import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const BACKUPS_DIR = process.env.BACKUPS_DIR || path.resolve(process.cwd(), "backups");
const MAX_BACKUPS = 10;

const ensureBackupsDir = () => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
};

const buildDbClientEnv = () => ({
  ...process.env,
  PGPASSWORD: process.env.DB_PASSWORD || "",
});

export const buildTerminateDatabaseConnectionsSql = (databaseName) => {
  const escapedDatabaseName = databaseName.replace(/'/g, "''");
  return `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${escapedDatabaseName}'
      AND pid <> pg_backend_pid();
  `;
};

const getBackupFilePath = (fileName) => path.join(BACKUPS_DIR, fileName);

const pruneOldBackups = () => {
  ensureBackupsDir();
  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((file) => file.endsWith(".backup") || file.endsWith(".dump"))
    .sort()
    .map((file) => ({ file, fullPath: getBackupFilePath(file) }));

  if (files.length <= MAX_BACKUPS) {
    return files;
  }

  const filesToRemove = files.slice(0, files.length - MAX_BACKUPS);
  filesToRemove.forEach((file) => {
    try {
      fs.unlinkSync(file.fullPath);
    } catch (error) {
      console.error("Error al eliminar backup antiguo:", error);
    }
  });

  return files.slice(filesToRemove.length);
};

const createBackupInternal = async () => {
  ensureBackupsDir();

  const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  const fileName = `backup-${timestamp}.backup`;
  const outputPath = getBackupFilePath(fileName);

  const args = [
    "-h",
    process.env.DB_HOST || "localhost",
    "-p",
    process.env.DB_PORT || "5432",
    "-U",
    process.env.DB_USER || "postgres",
    "-d",
    process.env.DB_DATABASE || "postgres",
    "-F",
    "c",
    "-f",
    outputPath,
  ];

  await execFileAsync("pg_dump", args, {
    env: buildDbClientEnv(),
  });

  pruneOldBackups();

  return {
    fileName,
    path: outputPath,
    createdAt: new Date().toISOString(),
  };
};

export const listBackups = async (_req, res) => {
  try {
    ensureBackupsDir();
    const files = fs
      .readdirSync(BACKUPS_DIR)
      .filter((file) => file.endsWith(".backup") || file.endsWith(".dump"))
      .sort()
      .map((file) => {
        const fullPath = getBackupFilePath(file);
        const stats = fs.statSync(fullPath);
        return {
          fileName: file,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString(),
        };
      });

    res.json(files);
  } catch (error) {
    console.error("Error al listar backups:", error);
    res.status(500).json({ error: "No se pudieron listar los backups" });
  }
};

export const createBackup = async (_req, res) => {
  try {
    const backup = await createBackupInternal();
    res.json({ message: "Backup creado correctamente", backup });
  } catch (error) {
    console.error("Error al crear backup:", error);
    res.status(500).json({ error: "No se pudo crear el backup" });
  }
};

export const restoreBackup = async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "Debe indicar el nombre del backup" });
    }

    const backupPath = getBackupFilePath(fileName);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: "No se encontró el backup solicitado" });
    }

    const dbName = process.env.DB_DATABASE || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || "5432";
    const dbUser = process.env.DB_USER || "postgres";
    const env = buildDbClientEnv();
    const restoreDbName = `${dbName}_restore_${Date.now()}`;

    const terminateConnectionsSql = buildTerminateDatabaseConnectionsSql(dbName);
    await execFileAsync(
      "psql",
      ["-h", dbHost, "-p", dbPort, "-U", dbUser, "-d", "postgres", "-c", terminateConnectionsSql],
      { env }
    );

    await execFileAsync(
      "dropdb",
      ["--force", "--if-exists", "-h", dbHost, "-p", dbPort, "-U", dbUser, restoreDbName],
      { env }
    );
    await execFileAsync(
      "createdb",
      ["-h", dbHost, "-p", dbPort, "-U", dbUser, restoreDbName],
      { env }
    );
    await execFileAsync(
      "pg_restore",
      ["-h", dbHost, "-p", dbPort, "-U", dbUser, "-d", restoreDbName, backupPath],
      { env }
    );

    await execFileAsync(
      "psql",
      ["-h", dbHost, "-p", dbPort, "-U", dbUser, "-d", "postgres", "-c", terminateConnectionsSql],
      { env }
    );
    await execFileAsync(
      "dropdb",
      ["--force", "--if-exists", "-h", dbHost, "-p", dbPort, "-U", dbUser, dbName],
      { env }
    );
    await execFileAsync(
      "createdb",
      ["-h", dbHost, "-p", dbPort, "-U", dbUser, dbName],
      { env }
    );
    await execFileAsync(
      "pg_restore",
      ["-h", dbHost, "-p", dbPort, "-U", dbUser, "-d", dbName, backupPath],
      { env }
    );

    await execFileAsync(
      "dropdb",
      ["--if-exists", "-h", dbHost, "-p", dbPort, "-U", dbUser, restoreDbName],
      { env }
    );

    res.json({ message: "Backup restaurado correctamente", fileName });
  } catch (error) {
    console.error("Error al restaurar backup:", error);
    res.status(500).json({ error: "No se pudo restaurar el backup" });
  }
};

let backupSchedulerInitialized = false;

export const scheduleDailyBackup = () => {
  if (backupSchedulerInitialized) {
    return;
  }

  backupSchedulerInitialized = true;

  const runBackup = () => {
    createBackupInternal().catch((error) => {
      console.error("Error en el backup diario programado:", error);
    });
  };

  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(3, 0, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const delay = nextRun.getTime() - now.getTime();

  setTimeout(() => {
    runBackup();
    setInterval(runBackup, 24 * 60 * 60 * 1000);
  }, delay);
};

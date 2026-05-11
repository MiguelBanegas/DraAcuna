import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as db from "../db/index.js";

let ensureUsuariosActivoColumnPromise;

const ensureUsuariosActivoColumn = async () => {
  if (!ensureUsuariosActivoColumnPromise) {
    ensureUsuariosActivoColumnPromise = db.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE
    `);
  }
  await ensureUsuariosActivoColumnPromise;
};

const signAuthToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, rol: user.rol },
    process.env.JWT_SECRET || "secret_key_default",
    { expiresIn: "24h" }
  );

// Login de usuario
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    await ensureUsuariosActivoColumn();
    // Buscar usuario
    const { rows } = await db.query(
      "SELECT * FROM usuarios WHERE username = $1 AND activo = TRUE",
      [username]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    const usuario = rows[0];

    // Verificar contraseña
    const esValida = await bcrypt.compare(password, usuario.password_hash);

    if (!esValida) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    // Generar Token JWT
    const token = signAuthToken(usuario);

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor durante el login" });
  }
};

// Registro de usuario (para crear el primer admin)
export const register = async (req, res) => {
  const { username, password, nombre, email, rol } = req.body;

  if (!username || !password || !nombre) {
    return res.status(400).json({
      error: "Nombre, usuario y contraseña son obligatorios",
    });
  }

  try {
    await ensureUsuariosActivoColumn();
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO usuarios (username, password_hash, nombre, email, rol, activo)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id, username, nombre, email, rol, activo
    `;
    const values = [username, passwordHash, nombre, email, rol || "admin"];

    const { rows } = await db.query(query, values);
    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: rows[0],
    });
  } catch (error) {
    console.error("Error en register:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "El nombre de usuario o email ya existe" });
    }
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};

export const listUsers = async (_req, res) => {
  try {
    await ensureUsuariosActivoColumn();
    const { rows } = await db.query(
      `SELECT id, username, nombre, email, rol, activo
       FROM usuarios
       ORDER BY nombre ASC, username ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error en listUsers:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const adminResetCredentials = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  const nextUsername = String(username || "").trim();
  const nextPassword = String(password || "");

  if (!nextUsername || !nextPassword) {
    return res.status(400).json({
      error: "Usuario y nueva contraseña son obligatorios",
    });
  }

  if (nextPassword.length < 6) {
    return res.status(400).json({
      error: "La nueva contraseña debe tener al menos 6 caracteres",
    });
  }

  try {
    await ensureUsuariosActivoColumn();
    const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (rows[0].activo === false) {
      return res.status(400).json({ error: "No se pueden restablecer credenciales de un usuario archivado" });
    }

    const duplicate = await db.query(
      "SELECT id FROM usuarios WHERE username = $1 AND id <> $2",
      [nextUsername, id]
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nextPassword, salt);

    const { rows: updatedRows } = await db.query(
      `UPDATE usuarios
       SET username = $1, password_hash = $2
       WHERE id = $3
       RETURNING id, username, nombre, email, rol`,
      [nextUsername, passwordHash, id]
    );

    res.json({
      message: "Credenciales restablecidas correctamente",
      user: updatedRows[0],
    });
  } catch (error) {
    console.error("Error en adminResetCredentials:", error);
    res.status(500).json({ error: "Error al restablecer credenciales" });
  }
};

export const updateCredentials = async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const userId = req.user?.id;

  const username = String(newUsername || "").trim();
  const password = String(newPassword || "");

  if (!userId) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (!currentPassword) {
    return res
      .status(400)
      .json({ error: "La contraseña actual es obligatoria" });
  }

  if (!username && !password) {
    return res.status(400).json({
      error: "Debe indicar un nuevo usuario o una nueva contraseña",
    });
  }

  try {
    await ensureUsuariosActivoColumn();
    const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (rows[0].activo === false) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    const usuario = rows[0];
    const esValida = await bcrypt.compare(
      currentPassword,
      usuario.password_hash
    );

    if (!esValida) {
      return res
        .status(401)
        .json({ error: "La contraseña actual es incorrecta" });
    }

    if (username && username !== usuario.username) {
      const existing = await db.query(
        "SELECT id FROM usuarios WHERE username = $1 AND id <> $2",
        [username, userId]
      );

      if (existing.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "El nombre de usuario ya está en uso" });
      }
    }

    let passwordHash = usuario.password_hash;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUsername = username || usuario.username;
    const { rows: updatedRows } = await db.query(
      `UPDATE usuarios
       SET username = $1, password_hash = $2
       WHERE id = $3
       RETURNING id, username, nombre, rol`,
      [updatedUsername, passwordHash, userId]
    );

    const updatedUser = updatedRows[0];
    const token = signAuthToken(updatedUser);

    res.json({
      message: "Credenciales actualizadas correctamente",
      token,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateCredentials:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar las credenciales" });
  }
};

export const updateUserEstado = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  const actorId = req.user?.id;
  const nextActivo = Boolean(activo);

  try {
    await ensureUsuariosActivoColumn();
    const { rows } = await db.query("SELECT id, rol, activo FROM usuarios WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const target = rows[0];

    if (!nextActivo && String(actorId) === String(id)) {
      return res.status(400).json({ error: "No puede archivar su propio usuario" });
    }

    if (!nextActivo && String(target.rol || "").toLowerCase() === "admin") {
      const { rows: admins } = await db.query(
        "SELECT COUNT(*)::int AS total FROM usuarios WHERE rol = 'admin' AND activo = TRUE"
      );
      const totalAdminsActivos = admins[0]?.total || 0;
      if (totalAdminsActivos <= 1) {
        return res.status(409).json({ error: "No se puede archivar el último administrador activo" });
      }
    }

    const { rows: updatedRows } = await db.query(
      "UPDATE usuarios SET activo = $1 WHERE id = $2 RETURNING id, username, nombre, email, rol, activo",
      [nextActivo, id]
    );
    return res.json(updatedRows[0]);
  } catch (error) {
    console.error("Error en updateUserEstado:", error);
    return res.status(500).json({ error: "Error al actualizar el estado del usuario" });
  }
};

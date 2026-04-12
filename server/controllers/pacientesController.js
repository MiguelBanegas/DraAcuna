import * as db from "../db/index.js";

let ensurePacientesActivoColumnPromise;

const ensurePacientesActivoColumn = async () => {
  if (!ensurePacientesActivoColumnPromise) {
    ensurePacientesActivoColumnPromise = db.query(`
      ALTER TABLE pacientes
      ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE
    `);
  }

  await ensurePacientesActivoColumnPromise;
};

const normalizeQuery = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    await ensurePacientesActivoColumn();
    const { q, limit, includeInactivos } = req.query;
    const shouldIncludeInactivos = includeInactivos === "true";
    const activoCondition = shouldIncludeInactivos ? "" : "activo = TRUE";
    // Si se proporciona un query `q`, buscar por nombre o DNI (ILIKE para case-insensitive)
    if (q) {
      const max = Math.min(parseInt(limit, 10) || 50, 200);
      const tokens = normalizeQuery(q).split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        const nombreExpr =
          "translate(lower(coalesce(nombre_completo, '')), 'áéíóúüñ', 'aeiouun')";
        const searchConditions = tokens
          .map(
            (_, idx) =>
              `(${nombreExpr} LIKE $${idx + 1} OR lower(dni::text) LIKE $${idx + 1})`
          )
          .join(" AND ");
        const conditions = [activoCondition, searchConditions].filter(Boolean).join(" AND ");
        const values = tokens.map((token) => `%${token}%`);
        values.push(max);

        const { rows } = await db.query(
          `SELECT * FROM pacientes WHERE ${conditions} ORDER BY nombre_completo ASC LIMIT $${
            tokens.length + 1
          }`,
          values
        );
        return res.json(rows);
      }
    }

    // Si no hay query, devolver todos (cuidado con volumen en producción)
    const { rows } = await db.query(
      `SELECT * FROM pacientes ${activoCondition ? `WHERE ${activoCondition}` : ""} ORDER BY nombre_completo ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error en getAllPacientes:", error);
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
};

// Obtener un paciente por ID
export const getPacienteById = async (req, res) => {
  const { id } = req.params;
  try {
    await ensurePacientesActivoColumn();
    const { rows } = await db.query("SELECT * FROM pacientes WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en getPacienteById:", error);
    res.status(500).json({ error: "Error al obtener el paciente" });
  }
};

// Crear un nuevo paciente
export const createPaciente = async (req, res) => {
  const {
    nombre_completo,
    dni,
    fecha_nacimiento,
    genero,
    telefono,
    email,
    direccion,
    obra_social,
    numero_afiliado,
  } = req.body;

  try {
    await ensurePacientesActivoColumn();
    const query = `
      INSERT INTO pacientes (
        nombre_completo, dni, fecha_nacimiento, genero,
        telefono, email, direccion, obra_social, numero_afiliado, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
      RETURNING *
    `;
    const values = [
      nombre_completo,
      dni,
      fecha_nacimiento,
      genero,
      telefono,
      email,
      direccion,
      obra_social,
      numero_afiliado,
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error en createPaciente:", error);
    if (error.code === "23505") {
      // Unique violation para DNI
      return res
        .status(400)
        .json({ error: "Ya existe un paciente con ese DNI" });
    }
    res.status(500).json({ error: "Error al crear el paciente" });
  }
};

// Actualizar un paciente
export const updatePaciente = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_completo,
    dni,
    fecha_nacimiento,
    genero,
    telefono,
    email,
    direccion,
    obra_social,
    numero_afiliado,
  } = req.body;

  try {
    await ensurePacientesActivoColumn();
    const query = `
      UPDATE pacientes SET 
        nombre_completo = $1, dni = $2, fecha_nacimiento = $3, genero = $4, 
        telefono = $5, email = $6, direccion = $7, obra_social = $8, numero_afiliado = $9
      WHERE id = $10 
      RETURNING *
    `;
    const values = [
      nombre_completo,
      dni,
      fecha_nacimiento,
      genero,
      telefono,
      email,
      direccion,
      obra_social,
      numero_afiliado,
      id,
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en updatePaciente:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
};

export const updatePacienteEstado = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    await ensurePacientesActivoColumn();
    const { rows } = await db.query(
      "UPDATE pacientes SET activo = $1 WHERE id = $2 RETURNING *",
      [Boolean(activo), id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en updatePacienteEstado:", error);
    res.status(500).json({ error: "Error al actualizar el estado del paciente" });
  }
};

// Archivar un paciente
export const deletePaciente = async (req, res) => {
  req.body = { activo: false };
  return updatePacienteEstado(req, res);
};

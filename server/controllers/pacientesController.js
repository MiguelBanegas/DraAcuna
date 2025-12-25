import * as db from "../db/index.js";

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    const { q, limit } = req.query;
    // Si se proporciona un query `q`, buscar por nombre o DNI (ILIKE para case-insensitive)
    if (q) {
      const max = Math.min(parseInt(limit, 10) || 50, 200);
      const search = `%${q}%`;
      const { rows } = await db.query(
        `SELECT * FROM pacientes WHERE nombre_completo ILIKE $1 OR dni::text ILIKE $1 ORDER BY nombre_completo ASC LIMIT $2`,
        [search, max]
      );
      return res.json(rows);
    }

    // Si no hay query, devolver todos (cuidado con volumen en producción)
    const { rows } = await db.query(
      "SELECT * FROM pacientes ORDER BY nombre_completo ASC"
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
    const query = `
      INSERT INTO pacientes (
        nombre_completo, dni, fecha_nacimiento, genero, 
        telefono, email, direccion, obra_social, numero_afiliado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
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

// Eliminar un paciente
export const deletePaciente = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query("DELETE FROM pacientes WHERE id = $1", [
      id,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json({ message: "Paciente eliminado correctamente" });
  } catch (error) {
    console.error("Error en deletePaciente:", error);
    res.status(500).json({ error: "Error al eliminar el paciente" });
  }
};

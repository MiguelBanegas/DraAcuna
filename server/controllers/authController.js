import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as db from "../db/index.js";

// Login de usuario
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar usuario
    const { rows } = await db.query(
      "SELECT * FROM usuarios WHERE username = $1",
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
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol },
      process.env.JWT_SECRET || "secret_key_default",
      { expiresIn: "24h" }
    );

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

  try {
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO usuarios (username, password_hash, nombre, email, rol)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, nombre, rol
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

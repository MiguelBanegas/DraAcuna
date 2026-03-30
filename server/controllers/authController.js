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
    const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
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
    const token = jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username,
        rol: updatedUser.rol,
      },
      process.env.JWT_SECRET || "secret_key_default",
      { expiresIn: "24h" }
    );

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

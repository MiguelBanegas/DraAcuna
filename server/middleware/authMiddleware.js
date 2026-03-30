import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_key_default"
    );
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    const role = String(req.user?.rol || "").toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({ error: "Acceso solo para administradores" });
    }
    next();
  });
};

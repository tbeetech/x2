import { verifyAccessToken } from "../services/tokenService.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.substring(7);
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub ?? decoded.userId ?? decoded.id ?? decoded._id };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

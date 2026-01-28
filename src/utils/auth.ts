import { Request, Response, NextFunction } from "express";

export function verifyInternalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const expectedKey = process.env.INTERNAL_ACTION_KEY;

  // If no key configured, allow all requests (development/testing mode)
  if (!expectedKey) {
    console.log("[auth] ⚠️ No INTERNAL_ACTION_KEY configured - allowing request");
    return next();
  }

  // If key configured and matches, allow
  if (token === expectedKey) {
    console.log("[auth] ✅ Valid token");
    return next();
  }

  // Key configured but doesn't match - reject
  console.log("[auth] ❌ Invalid token");
  return res.status(401).json({ error: "Unauthorized" });
}

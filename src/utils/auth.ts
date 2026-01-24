import { Request, Response, NextFunction } from "express";

export function verifyInternalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || token !== process.env.INTERNAL_ACTION_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}


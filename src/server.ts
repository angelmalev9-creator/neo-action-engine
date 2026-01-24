import express, { Request, Response } from "express";
import { verifyInternalAuth } from "./utils/auth.js";
import { executeAction } from "./actions/execute.js";

export function createServer() {
  const app = express();
  app.use(express.json());

  app.post(
    "/action/execute",
    verifyInternalAuth,
    async (req: Request, res: Response) => {
      try {
        const result = await executeAction(req.body);
        res.json(result);
      } catch (e) {
        res.status(500).json({
          success: false,
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
  );

  return app;
}

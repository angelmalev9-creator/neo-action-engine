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
        const { action, params } = req.body;

        if (!action) {
          return res.status(400).json({
            success: false,
            error: "Missing action"
          });
        }

        const result = await executeAction(action, params);
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

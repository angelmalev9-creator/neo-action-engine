import express, { Request, Response } from "express";
import { verifyInternalAuth } from "./utils/auth.js";
import { executeAction } from "./actions/execute.js";

export function createServer() {
  const app = express();
  app.use(express.json());

  // ═══════════════════════════════════════════════════════════════
  // HEALTH CHECK ENDPOINTS (GET requests for browser testing)
  // ═══════════════════════════════════════════════════════════════
  app.get("/", (req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      service: "neo-action-engine",
      version: "1.0.0",
      endpoints: {
        health: "GET /health",
        execute: "POST /action/execute"
      }
    });
  });

  app.get("/health", (req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MAIN ACTION ENDPOINT (POST only)
  // ═══════════════════════════════════════════════════════════════
  app.post(
    "/action/execute",
    verifyInternalAuth,
    async (req: Request, res: Response) => {
      try {
        const { action, params } = req.body;

        console.log(`[neo-action-engine] Received action: ${action}`);

        if (!action) {
          return res.status(400).json({
            success: false,
            error: "Missing action"
          });
        }

        const result = await executeAction(action, params);
        
        console.log(`[neo-action-engine] Action ${action} completed`);
        
        res.json(result);
      } catch (e) {
        console.error(`[neo-action-engine] Error:`, e);
        res.status(500).json({
          success: false,
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
  );

  return app;
}

import express from "express";
import { verifyInternalAuth } from "./utils/auth";
import { bookAction } from "./actions/book";

export function createServer() {
  const app = express();
  app.use(express.json());

  app.post("/action/book", verifyInternalAuth, async (req, res) => {
    try {
      const result = await bookAction(req.body);
      res.json(result);
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  });

  return app;
}


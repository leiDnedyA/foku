import express from "express";

export const hostRouter = express.Router();

hostRouter.get("/", async (req, res) => {
  res.send("Hello, world")
})

import express from "express";

export const controllerRouter = express.Router();

controllerRouter.get("/", async (req, res) => {
  res.send("Controller screen.");
});

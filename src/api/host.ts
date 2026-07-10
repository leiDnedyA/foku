import express from "express";
import { getLocalIp } from "../util/ip";

export const hostRouter = express.Router();

hostRouter.get("/", async (req, res) => {
  res.send(`http://${getLocalIp()}:${process.env.PORT}/controller`)
})

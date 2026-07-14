import express from "express";
import { getLocalIp } from "../util/ip";
import { generateQRCodeBuffer } from "./qr";
import path from 'path';

export const hostRouter = express.Router();

hostRouter.get("/", async (_req, res) => {
  res.type("html").sendFile(path.resolve(__dirname, '../assets/index.html'));
});

hostRouter.get("/qr.png", async (_req, res) => {
  const url = `http://${getLocalIp()}:${process.env.PORT}/controller`;
  const buffer = await generateQRCodeBuffer(url);
  res.type("image/png");
  res.send(buffer);
});

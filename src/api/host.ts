import express from "express";
import { getLocalIp } from "../util/ip";
import { generateQRCodeBuffer } from "./qr";
import path from 'path';

export const hostRouter = express.Router();
const assetsPath = path.resolve(__dirname, '../assets');

hostRouter.get("/", async (_req, res) => {
  res.type("html").sendFile(path.join(assetsPath, 'index.html'));
});

hostRouter.get("/qr.png", async (_req, res) => {
  const url = `http://${getLocalIp()}:${process.env.PORT}/controller`;
  const buffer = await generateQRCodeBuffer(url);
  res.type("image/png");
  res.send(buffer);
});

hostRouter.use(express.static(assetsPath));

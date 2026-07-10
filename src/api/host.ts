import express from "express";
import { getLocalIp } from "../util/ip";
import { generateQRCodeBuffer } from "./qr";

export const hostRouter = express.Router();

hostRouter.get("/", async (req, res) => {
  const url = `http://${getLocalIp()}:${process.env.PORT}/controller`;
  const buffer = await generateQRCodeBuffer(url);
  res.type("image/png");
  res.send(buffer);
});

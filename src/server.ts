import express from "express";
import { hostRouter } from "./api/host";
const app = express();

app.get("/", (req, res) => res.redirect("/host"));

app.use("/host", hostRouter);

export { app };

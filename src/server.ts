import express from "express";
import { hostRouter } from "./api/host";
import { controllerRouter } from "./api/controller";
const app = express();

app.get("/", (req, res) => res.redirect("/host"));

app.use("/host", hostRouter);
app.use("/controller", controllerRouter);

export { app };

import express from "express";
import { hostRouter } from "./api/host";
import { controllerRouter } from "./api/controller";
const app = express();

app.use((_, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store",
  });
  next();
});

app.get("/", (req, res) => res.redirect("/host"));

app.use("/host", hostRouter);
app.use("/controller", controllerRouter);

export { app };

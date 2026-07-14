import { app as expressApp } from './server';
import { setupWebSockets } from './api/socket';
import { loadEnv } from './util/env';
import { app as electronApp, BrowserWindow } from 'electron';
import path from 'path';

if (!require.main) throw new Error("You have seriously fucked up");

loadEnv(path.resolve(__dirname, '../.env'));

let mainWindow: BrowserWindow | null = null;

const server = expressApp.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.PORT}`)
})

setupWebSockets(server);

electronApp.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800
  })
  mainWindow.loadURL(`http://localhost:${process.env.PORT}/host`)
})

const onCloseSignal = () => {
  console.log("sigint received, shutting down");
  server.close(() => {
    console.log("Server closed.");
    process.exit();
  });
  setTimeout(() => process.exit(1), 2_000).unref();
}

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);

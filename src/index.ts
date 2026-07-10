import { app } from './server';
import { loadEnv } from './util/env';
import path from 'path';

if (!require.main) throw new Error("You have seriously fucked up");

loadEnv(path.join(require.main.filename, '../../.env'));

const server = app.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.PORT}`)
})

const onCloseSignal = () => {
  console.log("sigint received, shutting down");
  server.close(() => {
    console.log("Server closed.");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);

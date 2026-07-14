import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

type Role = "host" | "controller";

const hosts = new Set<WebSocket>();
const controllers = new Set<WebSocket>();

function roleFromUrl(url: string | undefined): Role | null {
  if (!url) return null;
  const params = new URL(url, "http://localhost").searchParams;
  const role = params.get("role");
  if (role === "host" || role === "controller") return role;
  return null;
}

export function setupWebSockets(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const role = roleFromUrl(req.url);
    if (!role) {
      ws.close(1008, "Missing or invalid ?role= (expected 'host' or 'controller')");
      return;
    }

    const pool = role === "host" ? hosts : controllers;
    pool.add(ws);
    console.log(`${role} connected (${pool.size} total)`);

    ws.on("message", (data) => {
      if (role !== "controller") return;
      // Relay controller messages to every connected host screen.
      const message = data.toString();
      for (const host of hosts) {
        if (host.readyState === WebSocket.OPEN) host.send(message);
      }
    });

    ws.on("close", () => {
      pool.delete(ws);
      console.log(`${role} disconnected (${pool.size} total)`);
    });

    ws.on("error", (err) => console.error(`${role} socket error:`, err));
  });

  return wss;
}

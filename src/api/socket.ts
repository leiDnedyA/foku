import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

type Role = "host" | "controller";

const hosts = new Set<WebSocket>();
const controllers = new Map<WebSocket, string>();
let nextControllerId = 1;

function roleFromUrl(url: string | undefined): Role | null {
  if (!url) return null;
  const params = new URL(url, "http://localhost").searchParams;
  const role = params.get("role");
  if (role === "host" || role === "controller") return role;
  return null;
}

function broadcastToHosts(payload: object) {
  const message = JSON.stringify(payload);
  for (const host of hosts) {
    if (host.readyState === WebSocket.OPEN) host.send(message);
  }
}

export function setupWebSockets(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const role = roleFromUrl(req.url);
    if (!role) {
      ws.close(1008, "Missing or invalid ?role= (expected 'host' or 'controller')");
      return;
    }

    if (role === "host") {
      hosts.add(ws);
      console.log(`host connected (${hosts.size} total)`);
      // Let a late-joining host know about controllers that are already here.
      for (const controllerId of controllers.values()) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "controller-joined", controllerId }));
        }
      }
    } else {
      const controllerId = `c${nextControllerId++}`;
      controllers.set(ws, controllerId);
      console.log(`controller ${controllerId} connected (${controllers.size} total)`);
      broadcastToHosts({ type: "controller-joined", controllerId });
    }

    ws.on("message", (data) => {
      if (role !== "controller") return;
      const controllerId = controllers.get(ws);
      if (!controllerId) return;
      // Relay controller messages to every connected host screen,
      // tagged with the sending controller's id.
      try {
        const parsed = JSON.parse(data.toString());
        broadcastToHosts({ ...parsed, controllerId });
      } catch {
        console.warn(`Dropped non-JSON message from ${controllerId}`);
      }
    });

    ws.on("close", () => {
      if (role === "host") {
        hosts.delete(ws);
        console.log(`host disconnected (${hosts.size} total)`);
      } else {
        const controllerId = controllers.get(ws);
        controllers.delete(ws);
        console.log(`controller ${controllerId} disconnected (${controllers.size} total)`);
        if (controllerId) broadcastToHosts({ type: "controller-left", controllerId });
      }
    });

    ws.on("error", (err) => console.error(`${role} socket error:`, err));
  });

  return wss;
}

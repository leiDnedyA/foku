import express from "express";

export const controllerRouter = express.Router();

controllerRouter.get("/", async (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <title>foku remote</title>
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      background: #111;
      color: #eee;
      font-family: sans-serif;
      touch-action: manipulation;
    }
    #dpad {
      display: grid;
      grid-template-columns: repeat(3, 80px);
      grid-template-rows: repeat(3, 80px);
      gap: 8px;
    }
    button {
      font-size: 2rem;
      border: none;
      border-radius: 12px;
      background: #333;
      color: #eee;
    }
    button:active { background: #555; }
    #up    { grid-area: 1 / 2; }
    #left  { grid-area: 2 / 1; }
    #right { grid-area: 2 / 3; }
    #down  { grid-area: 3 / 2; }
    #status { color: #888; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>foku remote</h1>
  <div id="dpad">
    <button id="up" data-direction="up">&#8593;</button>
    <button id="left" data-direction="left">&#8592;</button>
    <button id="right" data-direction="right">&#8594;</button>
    <button id="down" data-direction="down">&#8595;</button>
  </div>
  <p id="status">Connecting...</p>
  <script>
    const status = document.getElementById('status');
    let ws = null;

    function connect() {
      ws = new WebSocket('ws://' + location.host + '/ws?role=controller');
      ws.onopen = () => { status.textContent = 'Connected'; };
      ws.onclose = () => {
        status.textContent = 'Disconnected. Reconnecting...';
        setTimeout(connect, 1000);
      };
    }
    connect();

    document.querySelectorAll('#dpad button').forEach((button) => {
      button.addEventListener('click', () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'press', direction: button.dataset.direction }));
      });
    });
  </script>
</body>
</html>`);
});

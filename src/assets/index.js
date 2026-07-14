const status = document.getElementById('status');
const lastPress = document.getElementById('last-press');
const arrows = { up: '\\u2191', down: '\\u2193', left: '\\u2190', right: '\\u2192' };

function connect() {
  const ws = new WebSocket('ws://' + location.host + '/ws?role=host');
  ws.onopen = () => { status.textContent = 'Connected. Waiting for input...'; };
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'press' && msg.direction in arrows) {
        lastPress.textContent = arrows[msg.direction] + ' ' + msg.direction;
      }
    } catch (e) {
      console.error('Bad message from server:', event.data);
    }
  };
  ws.onclose = () => {
    status.textContent = 'Disconnected. Reconnecting...';
    setTimeout(connect, 1000);
  };
}
connect();


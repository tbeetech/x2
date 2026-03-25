import net from 'node:net';
const PORT = Number(process.env.PORT_TO_TEST ?? 57188);
const HOST = '127.0.0.1';
const socket = new net.Socket();
socket.setTimeout(2000);
socket.on('connect', () => {
  console.log(`tcp: connected to ${HOST}:${PORT}`);
  socket.end();
});
socket.on('timeout', () => { console.error('tcp: timeout'); socket.destroy(); });
socket.on('error', (err) => { console.error('tcp: error', err.message); });
socket.connect(PORT, HOST);

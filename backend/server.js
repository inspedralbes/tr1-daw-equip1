const { createServer } = require("node:http");
const express = require("express");
const { Server } = require("socket.io");
const { registrarPueblo } = require("./pueblo");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const port = Number(process.env.PORT ?? 3000);

// Lista de partidas compartida por todos los clientes (en memoria)
const partidas = []; // { id, titulo, max, tipo, codigo }

app.get("/", (_request, response) => {
  response.send("Servidor en funcionament");
});

io.on("connection", (socket) => {
  console.log(`Client connectat: ${socket.id}`);
  socket.emit("welcome", "Connexió establerta amb el servidor");

  // Al conectarse, recibe las partidas que ya existen
  socket.emit("partidas:lista", partidas);

  // Alguien crea una partida: se guarda y se avisa a todos
  socket.on("partidas:crear", (partida) => {
    partidas.push({
      id: Date.now(),
      titulo: String(partida.titulo).slice(0, 30),
      max: Number(partida.max),
      tipo: partida.tipo,
      codigo: partida.codigo,
    });
    io.emit("partidas:lista", partidas);
  });

  socket.on("disconnect", () => {
    console.log(`Client desconnectat: ${socket.id}`);
  });
});

registrarPueblo(io);
httpServer.listen(port, () => {
  console.log(`Servidor escoltant a http://localhost:${port}`);
});
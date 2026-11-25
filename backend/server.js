const { createServer } = require("node:http");
const express = require("express");
const { Server } = require("socket.io");
const { registrarPueblo } = require("./pueblo");

const app = express();
const httpServer = createServer(app);
// cors: el frontend (Vite, puerto 5173) se conecta desde otro origen que el backend (puerto 3000)
const io = new Server(httpServer, { cors: { origin: "*" } });
const port = Number(process.env.PORT ?? 3000);

app.get("/", (_request, response) => {
  response.send("Servidor en funcionament");
});

io.on("connection", (socket) => {
  console.log(`Client connectat: ${socket.id}`);
  socket.emit("welcome", "Connexió establerta amb el servidor");

  socket.on("disconnect", () => {
    console.log(`Client desconnectat: ${socket.id}`);
  });
});

// La sala del pueblo: casas, posiciones de los jugadores, lobos...
registrarPueblo(io);

httpServer.listen(port, () => {
  console.log(`Servidor escoltant a http://localhost:${port}`);
});

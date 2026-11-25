const { createServer } = require("node:http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const port = 3000;

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

httpServer.listen(port, () => {
  console.log(`Servidor escoltant a http://localhost:${port}`);
});

// pueblo.js — Eventos de Socket.IO de los jugadores del pueblo.
//   player:join → un jugador entra en el pueblo
//   player:move → un jugador se mueve
//   disconnect  → un jugador se va (lo lanza Socket.IO solo)
const estado = require('./jugadores');

function registrarPueblo(io) {
  io.on('connection', (socket) => {
    // Al principio este socket todavía no es un jugador: tiene que mandar "player:join"
    let jugador = null;

    // ---------- player:join ----------
    socket.on('player:join', (datos) => {
      // Si ya ha entrado antes, no hacemos nada
      if (jugador !== null) {
        return;
      }

      // El nombre viene en los datos. Si no viene, "Anónimo".
      let nom = 'Anónimo';
      if (datos && datos.nom) {
        nom = datos.nom;
      }

      // Apuntarlo en la lista (con una casa libre)
      jugador = estado.agregarJugador(socket.id, nom);

      // Si no cabe, avisarle
      if (jugador === null) {
        socket.emit('salaLlena');
        return;
      }

      console.log('player:join → ' + nom + ' en la casa ' + jugador.casa);

      // Al que entra: su casa y la lista de todos
      socket.emit('bienvenida', {
        miId: socket.id,
        miCasa: jugador.casa,
        jugadores: estado.listarJugadores(),
      });

      // A los demás: que ha llegado alguien
      socket.broadcast.emit('jugadorNuevo', jugador);
    });

    // ---------- player:move ----------
    socket.on('player:move', (datos) => {
      // Si todavía no ha hecho player:join, no se puede mover
      if (jugador === null) {
        return;
      }

      const jugadorActualizado = estado.actualizarJugador(socket.id, datos);
      socket.broadcast.emit('jugadorMovido', jugadorActualizado);
    });

    // ---------- disconnect ----------
    socket.on('disconnect', () => {
      // Si nunca llegó a entrar en el pueblo, no hay nada que quitar
      if (jugador === null) {
        return;
      }

      estado.quitarJugador(socket.id);
      io.emit('jugadorSale', socket.id);
      console.log('disconnect → sale ' + jugador.nom);
    });
  });
}

module.exports = { registrarPueblo };
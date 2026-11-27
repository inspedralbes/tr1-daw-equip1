// pueblo.js — La sala del pueblo: da una casa a cada jugador y reenvía las posiciones.
const estado = require('./jugadores');

function registrarPueblo(io) {
  io.on('connection', (socket) => {
    // 1. Leer el nombre que manda el juego. Si no manda ninguno, "Anónimo".
    let nom = socket.handshake.query.nom;
    if (nom === undefined || nom === '') {
      nom = 'Anónimo';
    }

    // 2. Apuntarlo en la lista
    const jugador = estado.agregarJugador(socket.id, nom);

    // Si no cabe, avisarle y desconectarlo
    if (jugador === null) {
      socket.emit('salaLlena');
      socket.disconnect();
      return;
    }

    console.log('Entra ' + nom + ' en la casa ' + jugador.casa);

    // 3. Al que entra: su casa y la lista de todos
    socket.emit('bienvenida', {
      miId: socket.id,
      miCasa: jugador.casa,
      jugadores: estado.listarJugadores(),
    });

    // 4. A los demás: que ha llegado alguien
    socket.broadcast.emit('jugadorNuevo', jugador);

    // 5. Cuando se mueve
    socket.on('mover', (datos) => {
      const jugadorActualizado = estado.actualizarJugador(socket.id, datos);
      socket.broadcast.emit('jugadorMovido', jugadorActualizado);
    });

    // 6. Cuando se va
    socket.on('disconnect', () => {
      estado.quitarJugador(socket.id);
      io.emit('jugadorSale', socket.id);
      console.log('Sale ' + nom);
    });
  });
}

module.exports = { registrarPueblo };
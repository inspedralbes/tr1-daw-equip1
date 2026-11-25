// pueblo.js — La sala del pueblo (El Pueblo Duerme).
// Reparte una casa distinta a cada jugador que entra (máximo 8)
// y reenvía a los demás su posición, hacia dónde mira, si anda, si es lobo y si duerme.
//
// Mensajes de Socket.IO:
//   servidor → cliente: bienvenida, jugadorNuevo, jugadorMovido, jugadorSale, salaLlena
//   cliente → servidor: mover

const MAX_JUGADORES = 8;

function registrarPueblo(io) {
  // casas[0] ... casas[7]: el id del jugador que vive ahí, o null si está libre
  const casas = new Array(MAX_JUGADORES).fill(null);

  // id del socket → datos del jugador
  const jugadores = new Map();

  io.on('connection', (socket) => {
    // 1. Buscar la primera casa libre
    const casa = casas.indexOf(null);

    if (casa === -1) {
      socket.emit('salaLlena');
      socket.disconnect();
      return;
    }

    // 2. Asignarle esa casa
    casas[casa] = socket.id;
    const jugador = {
      id: socket.id,
      casa,              // número de casa: 0 a 7
      x: null,           // null = todavía está en su spawn (el cliente sabe dónde es)
      y: null,
      dir: 'abajo',
      andando: false,
      forma: 'aldeano',  // 'aldeano' o 'lobo'
      durmiendo: false,
    };
    jugadores.set(socket.id, jugador);
    console.log(`Pueblo: entra ${socket.id} → casa ${casa}`);

    // 3. Al nuevo: su casa y la lista de todos los que ya están
    socket.emit('bienvenida', {
      miId: socket.id,
      miCasa: casa,
      jugadores: [...jugadores.values()],
    });

    // 4. A los demás: que ha llegado alguien
    socket.broadcast.emit('jugadorNuevo', jugador);

    // 5. Cuando se mueve, se lo contamos a los demás
    socket.on('mover', ({ x, y, dir, andando, forma, durmiendo }) => {
      jugador.x = x;
      jugador.y = y;
      jugador.dir = dir;
      jugador.andando = andando;
      jugador.forma = forma;
      jugador.durmiendo = durmiendo;
      socket.broadcast.emit('jugadorMovido', jugador);
    });

    // 6. Al salir, su casa queda libre para el siguiente
    socket.on('disconnect', () => {
      casas[casa] = null;
      jugadores.delete(socket.id);
      io.emit('jugadorSale', socket.id);
      console.log(`Pueblo: sale ${socket.id} → casa ${casa} libre`);
    });
  });
}

module.exports = { registrarPueblo };

// jugadores.js — La lista de jugadores conectados (se guarda en memoria).

const MAX_JUGADORES = 8;

// Las 8 casas. Cada hueco tiene el id del jugador que vive ahí, o null si está libre.
const casas = [null, null, null, null, null, null, null, null];

// Los jugadores conectados. Clave: id del jugador. Valor: sus datos.
const jugadores = new Map();

function agregarJugador(id, nom) {
  // Buscar la primera casa libre
  const casa = casas.indexOf(null);

  // Si no hay ninguna libre, no cabe
  if (casa === -1) {
    return null;
  }

  // Ocupar la casa
  casas[casa] = id;

  // Crear el jugador y guardarlo
  const jugador = {
    id: id,
    nom: nom,
    casa: casa,
    x: null,
    y: null,
    dir: 'abajo',
    andando: false,
    forma: 'aldeano',
    durmiendo: false,
  };
  jugadores.set(id, jugador);

  return jugador;
}

function actualizarJugador(id, datos) {
  const jugador = jugadores.get(id);

  if (jugador === undefined) {
    return null;
  }

  jugador.x = datos.x;
  jugador.y = datos.y;
  jugador.dir = datos.dir;
  jugador.andando = datos.andando;
  jugador.forma = datos.forma;
  jugador.durmiendo = datos.durmiendo;

  return jugador;
}

function quitarJugador(id) {
  const jugador = jugadores.get(id);

  if (jugador === undefined) {
    return;
  }

  // Dejar su casa libre y borrarlo de la lista
  casas[jugador.casa] = null;
  jugadores.delete(id);
}

function listarJugadores() {
  const lista = [];
  for (const jugador of jugadores.values()) {
    lista.push(jugador);
  }
  return lista;
}

function contarJugadores() {
  return jugadores.size;
}

module.exports = {
  agregarJugador,
  actualizarJugador,
  quitarJugador,
  listarJugadores,
  contarJugadores,
};
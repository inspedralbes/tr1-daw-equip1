// textos.js — Lo que dicen el tablón y el pozo.
// Cada página del tablón es { subtitulo, texto }. "\n" = salto de línea.

export const COMO_JUGAR = [
  {
    subtitulo: '¿De qué va?',
    texto: 'Sois 8 vecinos del pueblo.\nEntre vosotros se esconden 2 LOBOS.\n\nLos aldeanos tienen que descubrir quiénes son antes de que sea tarde.',
  },
  {
    subtitulo: 'El día',
    texto: 'Paseáis por el pueblo, habláis y os fijáis en todo.\n\nLas casas no tienen techo: lo que pasa dentro se ve desde fuera.\n\nAsómate al POZO de la plaza: cada día te da una pista nueva.',
  },
  {
    subtitulo: 'La noche',
    texto: 'Los aldeanos vuelven a su casa y duermen.\n\nLos lobos salen, se reúnen en la plaza y pueden eliminar a 1 aldeano (o a nadie).',
  },
  {
    subtitulo: 'La votación',
    texto: 'Al amanecer se descubre qué ha pasado y se debate.\n\nDespués, todos votan. Si alguien saca mayoría, queda expulsado y se revela su rol.',
  },
  {
    subtitulo: '¿Quién gana?',
    texto: 'Ganan los ALDEANOS si expulsan a los 2 lobos.\n\nGanan los LOBOS si llegan a ser tantos como los aldeanos (por ejemplo, 2 contra 2).',
  },
];

// Pista del día 1, día 2, día 3…
// Más adelante, el servidor debería mandar las pistas reales de cada partida
// (si están aquí, cualquiera podría verlas mirando el código).
export const PISTAS = [
  'Uno de los lobos vive en la fila de casas de arriba.',
  'Un lobo viste de un color frío.',
  'Laia es inocente, eso seguro.',
  'El nombre de uno de los lobos empieza por «N».',
  'El otro lobo vive al lado de una casa con chimenea.',
];

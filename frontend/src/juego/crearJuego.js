// crearJuego.js — Crea el juego de Phaser con la escena del pueblo.
import * as Phaser from 'phaser';
import PuebloScene from './PuebloScene.js';

export function crearJuego(contenedor) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: contenedor,          // elemento HTML donde va el canvas
    width: 800,
    height: 480,
    pixelArt: true,              // ¡importante! para que los píxeles no se vean borrosos
    backgroundColor: '#1b2238',
    physics: {
      default: 'arcade',
      arcade: { debug: false },  // ponlo a true para ver las cajas de colisión
    },
    scene: [PuebloScene],
  });
}

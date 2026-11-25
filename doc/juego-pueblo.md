# El Pueblo Duerme

Mapa de Tiled + Phaser 4 + Vue 3 + servidor Socket.IO. Cada jugador que entra aparece en su propia casa.

## Cómo verlo

Se arranca como el resto del proyecto, con Docker (mira el `README` de la raíz):

```bash
docker compose -f compose.dev.yaml up --build
```

> La primera vez después de este merge hace falta `--build` (y, si ya tenías los volúmenes creados, `docker compose -f compose.dev.yaml down -v` antes), porque el frontend tiene dependencias nuevas: `phaser` y `socket.io-client`.

Luego abre en el navegador `http://localhost:5173/plaza` (o entra por el login → **Unirse**, que lleva a `/partida`: es la misma vista).

Abre **otra pestaña** con la misma dirección y verás un segundo jugador en otra casa. Puedes abrir hasta 8.

### Jugar con otro ordenador de la misma red (por ejemplo, en clase)

Los demás tienen que abrir `http://IP_DE_TU_ORDENADOR:5173/plaza`. El juego se conecta al backend en el **mismo ordenador, puerto 3000** (`SERVIDOR` en `PuebloScene.js`). Si cambias `BACKEND_HOST_PORT` en el `.env`, cambia también ese puerto. Si no conecta, puede que el cortafuegos esté bloqueando los puertos 3000 y 5173.

## Controles

| Tecla | Qué hace |
|---|---|
| WASD / flechas | Moverse |
| E | Usar el tablón (cómo jugar) o el pozo (pista del día) |
| N | Cambiar entre día y noche. De noche te conviertes en lobo (y al amanecer vuelves a ser aldeano) |
| C | Ir a tu cama (te tumbas a dormir) / volver a tu puerta |

## Personajes

Son los **Pixel Citizens** de Craftpix (dibujos de 48×48), en `frontend/public/assets/pueblo/personajes/`: una carpeta por aldeano (`tu`, `marta`, `pol`, `laia`, `iker`, `nora`, `alex`, `julia`) y otra para el `lobo`. Cada una tiene `D_` (de frente), `S_` (de lado: los aldeanos miran a la izquierda y el lobo a la derecha; para el otro lado se voltean) y `U_` (de espaldas), en `Idle` y `Walk`, más `Sleep` para la cama. La licencia está en `personajes/LICENCIA_craftpix.txt`.

De momento **todos** se convierten en lobo de noche, para poder probarlo. Cuando haya roles, en `PuebloScene.js` cambia `CASAS_DE_LOS_LOBOS` para dejar solo las 2 casas de los lobos.

## Carpetas (solo lo del juego)

```
tr1-daw-equip1/
├── backend/
│   ├── server.js            ← servidor del equipo: llama a registrarPueblo(io)
│   └── pueblo.js            ← la sala del pueblo: reparte las casas y reenvía posiciones
├── frontend/
│   ├── src/
│   │   ├── views/PlazaView.vue  ← la vista que enseña el juego (rutas /plaza y /partida)
│   │   └── juego/
│   │       ├── JuegoPueblo.vue  ← componente que monta Phaser
│   │       ├── crearJuego.js    ← configuración de Phaser
│   │       ├── PuebloScene.js   ← la escena: mapa, jugador, colisiones, interactuables, noche…
│   │       └── textos.js        ← lo que dicen el tablón y el pozo
│   └── public/assets/pueblo/
│       ├── pueblo.tmx       ← el mapa para EDITAR en Tiled
│       ├── pueblo.tmj       ← el mapa que LEE Phaser (se exporta desde Tiled)
│       └── tilesets/ casas/ interior/ objetos/ personajes/ ui/
└── doc/
    ├── juego-pueblo.md      ← este archivo
    └── GUIA_TILED.md        ← cómo editar el mapa en Tiled (spawns, colisiones, exportar…)
```

## Editar el mapa

1. Abre `frontend/public/assets/pueblo/pueblo.tmx` con Tiled.
2. Cambia lo que quieras (está explicado en `GUIA_TILED.md`).
3. Exporta con **Ctrl+E** (la primera vez: `File → Export As…` → `pueblo.tmj` en la misma carpeta).
4. Recarga el navegador.

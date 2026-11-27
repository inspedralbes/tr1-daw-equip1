# El Pueblo Duerme — Mapa de Tiled + Phaser

## Qué hay en esta carpeta

```
pueblo-tiled/
├── pueblo.tmx          ← el mapa en XML: ESTE es el que abres y editas en Tiled
├── pueblo.tmj          ← el mismo mapa en JSON: ESTE es el que lee Phaser
├── tilesets/
│   ├── suelo_base.png      (el suelo del pueblo, cortado en tiles de 16×16)
│   └── suelo_pintable.png  (tiles sueltos para pintar suelo nuevo)
├── casas/  interior/  objetos/   ← imágenes del tileset "objetos"
├── personajes/  ui/
└── phaser/
    ├── PuebloScene.js   ← escena completa que carga el mapa
    ├── main.js          ← crea el juego
    └── JuegoPueblo.vue  ← componente de Vue que lo monta
```

> **Importante:** Phaser **no lee .tmx**, solo **.tmj/.json**. Tú editas el `.tmx` en Tiled y luego lo exportas a `.tmj` (paso 4). No muevas las carpetas de sitio: el mapa busca las imágenes con rutas relativas.

---

## 1. Abrir el mapa en Tiled

1. Instala **Tiled 1.10 o superior** (mapeditor.org).
2. `File → Open…` → `pueblo.tmx`.
3. A la derecha, en el panel **Layers**, verás estas capas:

| Capa | Tipo | Para qué sirve |
|---|---|---|
| `suelo` | Tiles | El suelo del pueblo (hierba, caminos, plaza, estanque, suelos de las casas). |
| `detalles_suelo` | Tiles | Vacía. Para pintar encima con `suelo_pintable` sin estropear el suelo original. |
| `interior` | Objetos (imágenes) | Camas, alfombras, mesas, cofres… |
| `objetos` | Objetos (imágenes) | Casas, árboles, farolas, pozo, puestos, vallas, cultivos… |
| `colisiones` 🔴 | Rectángulos | Por donde **no** se puede pasar (paredes, troncos, pozo, estanque…). |
| `spawns` 🔵 | Puntos | Dónde aparece cada jugador, su cama, la puerta, los puntos de reunión… |
| `zonas` 🟡 | Rectángulos/elipses | Áreas con significado: cada casa y la plaza. |
| `interactuables` 🟣 | Puntos | El tablón (cómo jugar) y el pozo (pistas). |
| `luces` 🟠 | Puntos | Farolas y pozo: dónde poner luz de noche. |

Truco: haz clic en el ojo 👁 de una capa para ocultarla mientras trabajas.

---

## 2. Los spawn points que ya tiene

Están en la capa `spawns`. Cada punto tiene un **nombre**, una **clase** (en Tiled se llama *Class*) y **propiedades**:

| Nombre | Clase | Propiedades | Uso |
|---|---|---|---|
| `inicio_tu`, `inicio_marta`… | `spawn` | `casa`, `momento = dia`, `jugador` (0-7) | Donde aparece cada jugador al empezar el día (delante de su puerta). |
| `cama_tu`, `cama_marta`… | `spawn` | `casa`, `momento = noche` | Donde se tumba cada aldeano por la noche. |
| `puerta_dentro_X` / `puerta_fuera_X` | `camino` | `casa` | Para que los bots sepan entrar y salir de casa. |
| `reunion_1` … `reunion_8` | `spawn` | `momento = votacion`, `orden` | Corro alrededor del pozo para la votación. |
| `lobo_noche_1`, `lobo_noche_2` | `spawn` | `momento = noche`, `rol = lobo` | Donde salen los lobos de noche. |

### Añadir un spawn nuevo

1. Selecciona la capa **`spawns`**.
2. Pulsa **`I`** (herramienta *Insert Point*) y haz clic en el mapa.
3. En el panel **Properties** (izquierda):
   - **Name:** por ejemplo `spawn_mercader`.
   - **Class:** `spawn`.
   - Para añadir una propiedad, pulsa el **`+`** de abajo, elige el tipo (`string`, `int`, `bool`…) y ponle nombre y valor. Ejemplo: `momento` (string) = `dia`.
4. Guarda (`Ctrl+S`) y exporta (paso 4).

En Phaser lo lees así:

```js
const p = this.punto('spawn_mercader');
this.add.sprite(p.x, p.y, 'marta').setOrigin(0.5, 1);
```

---

## 3. Otras cosas que puedes hacer en Tiled

### Añadir una colisión
1. Capa **`colisiones`**.
2. Pulsa **`R`** (rectángulo) y arrastra. Para el estanque o cosas redondas usa **`C`** (elipse).
3. Ponlo solo en la **base** de los objetos (los pies del árbol, no la copa): así el jugador puede pasar por detrás.

### Añadir árboles, casas, muebles…
1. Capa **`objetos`** (o `interior` para muebles).
2. En el panel **Tilesets** (abajo a la derecha) abre la pestaña **`objetos`**.
3. Elige la imagen y pulsa **`T`** (*Insert Tile*) y haz clic en el mapa.
4. Si es una imagen grande que se tiene que dibujar detrás de los personajes (como la pared trasera de una casa), añádele la propiedad `profundidad` (int). Si no la pones, Phaser usa la parte de abajo del objeto, que es lo normal.

### Pintar suelo
1. Capa **`detalles_suelo`**.
2. Tileset **`suelo_pintable`** → elige un tile → **`B`** (pincel).
3. Las 13 últimas piezas (abajo del tileset) son el camino de tierra con bordes de hierba: bloque 3×3 (bordes y esquinas) + 2×2 (esquinas interiores).
4. Para borrar: **`E`**.

### Añadir una zona (por ejemplo, un "bosque" donde dar una pista)
1. Capa **`zonas`** → **`R`** → arrastra.
2. Name: `bosque`, Class: `zona`.

### Añadir un objeto interactuable (como el tablón o el pozo)
1. En la capa **`objetos`**, pon la imagen del objeto (por ejemplo un barril) y fíjate en su **Name** (por ejemplo `barril`). Si hay varios con el mismo nombre, cámbiale el nombre a uno: `barril_misterioso`.
2. Capa **`interactuables`** → **`I`** → clic delante del objeto (donde se pondrá el jugador).
3. Name: `barril_misterioso`, Class: `interactuable`, y estas propiedades:

| Propiedad | Tipo | Ejemplo | Para qué |
|---|---|---|---|
| `tipo` | string | `pistas` / `como_jugar` / el que inventes | Qué pasa al pulsar E (se decide en `usarInteractuable()` de `PuebloScene.js`). |
| `objeto` | string | `barril_misterioso` | El **Name** del objeto de la capa `objetos` al que se le pone el contorno brillante. |
| `icono` | string | `icono_pozo` | Imagen del bocadillo que flota encima (`ui/icono_tablon.png` o `ui/icono_pozo.png`). |
| `radio` | int | `44` | A cuántos píxeles tienes que estar para poder usarlo. |
| `texto_boton` | string | `Abrir el barril` | Lo que sale abajo: «[E] Abrir el barril». |

---

## 4. Exportar para Phaser (cada vez que cambies algo)

1. **La primera vez:** `Edit → Preferences → General` y marca en *Export Options*:
   - ✅ **Embed tilesets**
   - ✅ **Resolve object types and properties**
2. `File → Export As…` → elige **JSON map files (*.tmj *.json)** → guarda encima de `pueblo.tmj`.
3. A partir de ahí basta con **`Ctrl+E`** (*Export*) para volver a exportar al mismo archivo.

Si te olvidas de exportar, Phaser seguirá mostrando el mapa antiguo.

---

## 5. Montarlo en Phaser (con Vue + Vite)

1. Copia **toda la carpeta** `pueblo-tiled` dentro de `public/assets/` y renómbrala a `pueblo`:

```
tu-proyecto/
├── public/
│   └── assets/
│       └── pueblo/          ← aquí dentro: pueblo.tmj, tilesets/, casas/, objetos/...
└── src/
    └── juego/
        ├── PuebloScene.js   ← copia de phaser/PuebloScene.js
        ├── main.js          ← copia de phaser/main.js
        └── JuegoPueblo.vue  ← copia de phaser/JuegoPueblo.vue
```

2. Úsalo en tu `App.vue`:

```vue
<script setup>
import JuegoPueblo from './juego/JuegoPueblo.vue';
</script>

<template>
  <JuegoPueblo />
</template>
```

3. `npm run dev`. Deberías aparecer delante de tu casa (arriba a la izquierda) con la cámara siguiéndote.

**Controles de prueba:** WASD/flechas para andar, **E** delante de un poste, **N** día/noche, **C** ir a la cama.

### Qué hace `PuebloScene.js`, paso a paso

| Parte | Qué hace |
|---|---|
| `preload()` | Carga `pueblo.tmj`, los dos tilesets de suelo y los personajes. Cuando el mapa termina de cargar, **lee el tileset `objetos` y carga sus imágenes solo**: si añades una imagen nueva en Tiled, no tienes que tocar el código. |
| `addTilesetImage('suelo_base', 'suelo_base')` | El **primer** nombre tiene que ser **igual** que el nombre del tileset en Tiled; el segundo es la clave con la que lo cargaste en `preload`. |
| `createLayer('suelo', …)` | Dibuja la capa de tiles con ese nombre. |
| Bucle de `interior` y `objetos` | Crea una imagen por cada objeto. Tiled los apoya **abajo a la izquierda**, por eso `setOrigin(0, 1)`. La profundidad es la propiedad `profundidad` o, si no tiene, su `y`. |
| Bucle de `colisiones` | Convierte cada rectángulo en una zona invisible con física estática. |
| `this.punto('inicio_tu')` | Busca un spawn por nombre. |
| `zonaActual()` | Te dice en qué zona estás (casa, plaza…). Sale en la esquina de arriba. |
| `posteCerca()` / `interactuar()` | Mira si estás dentro del `radio` de un poste y lanza el evento `'poste'`, que puedes escuchar desde Vue. |
| `cambiarNoche()` | Pone un rectángulo oscuro encima y enciende una luz (`luz_farola.png` en modo ADD) en cada punto de la capa `luces`. |
| `setDepth(jugador.y)` en `update()` | Ordena por la Y: así pasas **por detrás** de los árboles y **dentro** de las casas sin techo. |

### Ver las colisiones

En `main.js` cambia `debug: false` por `debug: true`. Verás las cajas en rosa.

---

## 6. Errores típicos

| Lo que pasa | Por qué | Solución |
|---|---|---|
| `Cannot read properties of null (reading 'objects')` | El nombre de una capa en el código no coincide con Tiled. | Revisa que se llame exactamente igual (mayúsculas incluidas). |
| El suelo sale negro o no sale | El primer parámetro de `addTilesetImage` no coincide con el nombre del tileset en Tiled. | Debe ser `suelo_base` y `suelo_pintable`. |
| Los objetos no aparecen y en consola hay 404 | Las imágenes no están donde dice el mapa. | La carpeta `frontend/public/assets/pueblo/` debe tener `casas/`, `objetos/`… al mismo nivel que `pueblo.tmj`. |
| Phaser da error al cargar el mapa | Exportaste con tilesets externos (`.tsx`). | Marca **Embed tilesets** al exportar (paso 4). |
| Todo se ve borroso | Falta `pixelArt: true`. | Está en `main.js`; no lo quites. |
| He cambiado el mapa y no se ve | Has guardado el `.tmx` pero no has exportado el `.tmj`. | `Ctrl+E` en Tiled. |
| El jugador se queda enganchado en las puertas | La caja de choque es más grande que el hueco. | En `PuebloScene.js`, `body.setSize(10, 6)`: hazla más pequeña. |

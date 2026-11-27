<template>
  <div class="marco">
    <div ref="contenedor" class="juego"></div>

    <!-- Ventana de diálogo del tablón / pozo (encima del canvas) -->
    <div v-if="dialogo" class="dialogo" role="dialog" :aria-label="dialogo.titulo">
      <div class="cabecera">
        <img :src="`/assets/pueblo/ui/${dialogo.icono}.png`" alt="" class="icono" />
        <h2>{{ dialogo.titulo }}</h2>
        <span v-if="dialogo.paginas.length > 1" class="pagina">
          {{ pagina + 1 }}/{{ dialogo.paginas.length }}
        </span>
      </div>

      <h3>{{ paginaActual.subtitulo }}</h3>
      <p class="texto">{{ paginaActual.texto }}</p>

      <div class="botones">
        <button v-if="pagina > 0" type="button" @click="anterior">◀ Anterior</button>
        <button type="button" class="principal" @click="siguiente">
          {{ esUltima ? 'Cerrar' : 'Siguiente ▶' }}
        </button>
      </div>
      <p class="pista-teclas">E / Enter: {{ esUltima ? 'cerrar' : 'siguiente' }} · Esc: cerrar</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { crearJuego } from './crearJuego.js';

const contenedor = ref(null);
const dialogo = ref(null);   // { titulo, icono, paginas: [{ subtitulo, texto }] }
const pagina = ref(0);
let juego = null;
let abiertoEn = 0;           // momento en que se abrió el diálogo
let escena = null;

const paginaActual = computed(() => dialogo.value.paginas[pagina.value]);
const esUltima = computed(() => pagina.value === dialogo.value.paginas.length - 1);

function abrir(datos) {
  dialogo.value = datos;
  pagina.value = 0;
  abiertoEn = performance.now();
}

function cerrar() {
  dialogo.value = null;
  if (escena) escena.events.emit('dialogo-cerrado');
}

function siguiente() {
  if (esUltima.value) cerrar();
  else pagina.value += 1;
}

function anterior() {
  if (pagina.value > 0) pagina.value -= 1;
}

// Teclado mientras el diálogo está abierto
function teclado(e) {
  if (!dialogo.value) return;
  // La misma pulsación de E que abre el diálogo también llega aquí:
  // si la tecla se pulsó antes de abrirlo, la ignoramos (si no, se cerraría al instante).
  if (e.timeStamp <= abiertoEn || e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === 'e' || k === 'enter' || k === ' ') {
    e.preventDefault();
    siguiente();
  } else if (k === 'escape') {
    cerrar();
  } else if (k === 'arrowleft' || k === 'a') {
    anterior();
  } else if (k === 'arrowright' || k === 'd') {
    if (!esUltima.value) siguiente();
  }
}

onMounted(() => {
  juego = crearJuego(contenedor.value);
  if (import.meta.env.DEV) window.juego = juego;   // para depurar desde la consola

  juego.events.once('ready', () => {
    escena = juego.scene.getScene('Pueblo');
    escena.events.on('dialogo', abrir);
  });
  window.addEventListener('keydown', teclado);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', teclado);
  if (juego) juego.destroy(true);
});
</script>

<style scoped>
.marco {
  position: relative;
  width: 800px;
  height: 480px;
}

.juego {
  width: 800px;
  height: 480px;
  border-radius: 12px;
  overflow: hidden;
}

.dialogo {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  width: 560px;
  box-sizing: border-box;
  padding: 16px 20px 12px;
  background: #f2e6c8;
  color: #2a1e14;
  border: 4px solid #4a2e1c;
  border-radius: 6px;
  box-shadow: 0 0 0 4px #9a6638, 0 8px 0 4px rgba(0, 0, 0, 0.35);
  font-family: 'Pixelify Sans', monospace;
}

.cabecera {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icono {
  width: 40px;
  height: 48px;
  image-rendering: pixelated;
}

h2 {
  margin: 0;
  font-size: 24px;
}

.pagina {
  margin-left: auto;
  font-size: 16px;
  color: #7a5232;
}

h3 {
  margin: 10px 0 4px;
  font-size: 18px;
  color: #7a3b1e;
}

.texto {
  margin: 0;
  min-height: 96px;
  font-size: 17px;
  line-height: 1.45;
  white-space: pre-line;   /* respeta los "\n" de textos.js */
}

.botones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

button {
  font-family: inherit;
  font-size: 16px;
  padding: 6px 14px;
  border: 3px solid #2a1e14;
  border-radius: 4px;
  background: #e8d8b0;
  color: #2a1e14;
  cursor: pointer;
}

button.principal {
  background: #f2c14e;
  box-shadow: 0 3px 0 #9a7420;
}

button:hover {
  filter: brightness(1.08);
}

.pista-teclas {
  margin: 6px 0 0;
  font-size: 13px;
  color: #7a6a58;
  text-align: right;
}
</style>

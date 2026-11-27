// PuebloScene.js — Mapa de Tiled + multijugador + objetos interactuables.
// Funciona con Phaser 3.60+ y Phaser 4. Necesita: npm i socket.io-client
//
// Controles:
//   WASD / flechas  → moverse
//   E               → usar el objeto que tengas cerca (tablón, pozo)
//   N               → cambiar entre día y noche (de noche te conviertes en lobo)
//   C               → ir a tu cama / volver a tu puerta
//
// Personajes: "Pixel Citizens" de Craftpix (dibujos de 48x48).
//   Cada aldeano tiene su carpeta en personajes/ con:
//     D_Idle, D_Walk  → mirando abajo (de frente)
//     S_Idle, S_Walk  → de lado (los aldeanos miran a la izquierda y el lobo a la derecha; para el otro lado se voltean)
//     U_Idle, U_Walk  → mirando arriba (de espaldas)
//     Sleep           → dormido en la cama
//   El lobo (personajes/lobo/) tiene lo mismo menos Sleep.
import * as Phaser from 'phaser';
import { io } from 'socket.io-client';
import { comoJugar, PISTAS } from './textos.js';
import { useUserStore } from '@/stores/user';

const RUTA = 'assets/pueblo/';
const SERVIDOR = `http://${window.location.hostname}:3000`; // mismo ordenador que la web, puerto 3000

// Casa número 0..7 → nombre que tiene en Tiled (spawns "inicio_X", "cama_X")
// y personaje que se usa para el que vive ahí.
const CASAS = ['tu', 'marta', 'pol', 'laia', 'iker', 'nora', 'alex', 'julia'];
const VELOCIDAD = 70;
const VELOCIDAD_LOBO = 95;

// Quién se convierte en lobo al hacerse de noche.
// De momento todos (para poder probarlo). Cuando haya roles, aquí irán solo las 2 casas de los lobos.
const CASAS_DE_LOS_LOBOS = CASAS;

// ---------- Hojas de los personajes ----------
const TAMANO_FRAME = 48;
const VISTAS = ['D', 'S', 'U'];              // D = de frente, S = de lado, U = de espaldas
const ACCIONES = {
  Idle: { dibujosPorSegundo: 6 },            // quieto (4 dibujos)
  Walk: { dibujosPorSegundo: 10 },           // andando (6 dibujos)
};
// Dónde están los pies dentro del dibujo de 48x48 (de arriba abajo).
// El lobo es más alto, por eso tiene los pies más abajo.
const PIES_ALDEANO = 32;
const PIES_LOBO = 43;
// Hacia dónde miran los dibujos de lado (S_) tal como vienen en el pack
const LADO_DEL_DIBUJO_ALDEANO = 'izquierda';
const LADO_DEL_DIBUJO_LOBO = 'derecha';
// Caja de choque en los pies
const ANCHO_CAJA = 10;
const ALTO_CAJA = 6;
const ENVIOS_POR_SEGUNDO = 15;
const COLOR_CONTORNO = [255, 232, 140];   // amarillo cálido

const clave = (ruta) => ruta.split('/').pop().replace('.png', '');

const prop = (obj, nombre) => {
  const p = (obj.properties || []).find((x) => x.name === nombre);
  return p ? p.value : undefined;
};

export default class PuebloScene extends Phaser.Scene {
  constructor() {
    super('Pueblo');
  }

  preload() {
    this.load.setPath(RUTA);
    this.load.tilemapTiledJSON('pueblo', 'pueblo.tmj');
    this.load.image('suelo_base', 'tilesets/suelo_base.png');
    this.load.image('suelo_pintable', 'tilesets/suelo_pintable.png');
    // Cada hoja se guarda con la clave "aspecto-accion-vista", por ejemplo "marta-Walk-S" o "lobo-Idle-D"
    [...CASAS, 'lobo'].forEach((aspecto) => {
      Object.keys(ACCIONES).forEach((accion) => {
        VISTAS.forEach((vista) => {
          this.load.spritesheet(`${aspecto}-${accion}-${vista}`, `personajes/${aspecto}/${vista}_${accion}.png`,
            { frameWidth: TAMANO_FRAME, frameHeight: TAMANO_FRAME });
        });
      });
    });
    CASAS.forEach((id) => {
      this.load.spritesheet(`${id}-Sleep`, `personajes/${id}/Sleep.png`, { frameWidth: TAMANO_FRAME, frameHeight: TAMANO_FRAME });
    });
    this.load.image('luz', 'objetos/luz_farola.png');
    this.load.image('icono_tablon', 'ui/icono_tablon.png');
    this.load.image('icono_pozo', 'ui/icono_pozo.png');

    this.load.on('filecomplete-tilemapJSON-pueblo', (key, type, datos) => {
      datos.tilesets
        .filter((ts) => ts.tiles)
        .forEach((ts) => ts.tiles.forEach((t) => {
          if (t.image) this.load.image(clave(t.image), t.image);
        }));
    });
  }

  create() {
    this.objetosPorNombre = {};    // nombre del objeto en Tiled → imagen (para encontrar el pozo, el tablón…)
    this.crearMapa();
    this.crearAnimaciones();
    this.crearNocheYLuces();
    this.crearInteractuables();
    this.crearTeclado();
    this.crearTextoAyuda();

    this.jugador = null;
    this.otros = new Map();
    this.enCama = false;
    this.ultimoEnvio = 0;
    this.dialogoAbierto = false;
    this.bloqueoE = 0;
    this.diaActual = 1;

    // Vue avisa cuando el jugador cierra la ventana de diálogo
    this.events.on('dialogo-cerrado', () => {
      this.dialogoAbierto = false;
      this.bloqueoE = this.time.now + 250;   // evita que la misma E vuelva a abrirlo
    });

    this.conectar();
  }

  // =====================================================
  //  MAPA
  // =====================================================
  crearMapa() {
    this.mapa = this.make.tilemap({ key: 'pueblo' });
    const tsBase = this.mapa.addTilesetImage('suelo_base', 'suelo_base');
    const tsPintable = this.mapa.addTilesetImage('suelo_pintable', 'suelo_pintable');
    this.mapa.createLayer('suelo', [tsBase, tsPintable], 0, 0).setDepth(-2);
    this.mapa.createLayer('detalles_suelo', [tsBase, tsPintable], 0, 0).setDepth(-1);

    const claveDeGid = {};
    this.mapa.imageCollections.forEach((col) => {
      col.images.forEach((img) => { claveDeGid[img.gid] = clave(img.image); });
    });
    ['interior', 'objetos'].forEach((nombreCapa) => {
      const capa = this.mapa.getObjectLayer(nombreCapa);
      if (!capa) return;
      capa.objects.forEach((o) => {
        const key = claveDeGid[o.gid];
        if (!key) return;
        const img = this.add.image(o.x, o.y, key).setOrigin(0, 1).setDepth(prop(o, 'profundidad') ?? o.y);
        this.objetosPorNombre[o.name] = img;
      });
    });

    this.muros = this.physics.add.staticGroup();
    this.mapa.getObjectLayer('colisiones').objects.forEach((o) => {
      let { x, y, width: w, height: h } = o;
      if (o.ellipse) { x += w * 0.12; y += h * 0.15; w *= 0.76; h *= 0.7; }
      const zona = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(zona, true);
      this.muros.add(zona);
    });

    this.spawns = this.mapa.getObjectLayer('spawns').objects;
    this.zonas = this.mapa.getObjectLayer('zonas').objects;

    const ancho = this.mapa.widthInPixels;
    const alto = this.mapa.heightInPixels;
    this.physics.world.setBounds(0, 0, ancho, alto);
    this.cameras.main.setBounds(0, 0, ancho, alto).setZoom(2).setRoundPixels(true);
  }

  // Una animación por hoja, con la misma clave que la hoja ("marta-Walk-S")
  crearAnimaciones() {
    [...CASAS, 'lobo'].forEach((aspecto) => {
      Object.entries(ACCIONES).forEach(([accion, opciones]) => {
        VISTAS.forEach((vista) => {
          const clave = `${aspecto}-${accion}-${vista}`;
          this.anims.create({
            key: clave,
            frames: this.anims.generateFrameNumbers(clave),   // todos los dibujos de la hoja
            frameRate: opciones.dibujosPorSegundo,
            repeat: -1,
          });
        });
      });
    });
    CASAS.forEach((id) => {
      this.anims.create({
        key: `${id}-Sleep`,
        frames: this.anims.generateFrameNumbers(`${id}-Sleep`),
        frameRate: 3,
        repeat: -1,
      });
    });
  }

  // 'abajo' → 'D', 'arriba' → 'U', 'derecha' / 'izquierda' → 'S' (de lado)
  vistaDe(direccion) {
    if (direccion === 'abajo') return 'D';
    if (direccion === 'arriba') return 'U';
    return 'S';
  }

  // Pone a un sprite (el tuyo o el de otro jugador) el dibujo que le toca según cómo esté:
  //   forma: 'aldeano' o 'lobo' · direccion: 'abajo', 'arriba', 'derecha', 'izquierda'
  //   andando: true / false · durmiendo: true / false
  ponerAspecto(sprite, { forma, direccion, andando, durmiendo }) {
    if (durmiendo) {
      sprite.setOrigin(0.5, 0.5);            // el dibujo de dormir va centrado en la cama
      sprite.setFlipX(false);
      sprite.anims.play(`${sprite.personaje}-Sleep`, true);
      return;
    }
    const esLobo = forma === 'lobo';
    const aspecto = esLobo ? 'lobo' : sprite.personaje;
    const pies = esLobo ? PIES_LOBO : PIES_ALDEANO;
    sprite.setOrigin(0.5, pies / TAMANO_FRAME);   // el punto (x, y) del sprite queda en los pies
    // Si va hacia el lado contrario al que mira el dibujo, se voltea
    const ladoDelDibujo = esLobo ? LADO_DEL_DIBUJO_LOBO : LADO_DEL_DIBUJO_ALDEANO;
    const vaDeLado = direccion === 'izquierda' || direccion === 'derecha';
    sprite.setFlipX(vaDeLado && direccion !== ladoDelDibujo);
    const accion = andando ? 'Walk' : 'Idle';
    sprite.anims.play(`${aspecto}-${accion}-${this.vistaDe(direccion)}`, true);   // true = no reiniciar si ya suena
    if (sprite.body) {
      // la caja de choque también tiene que ir a los pies
      sprite.body.setSize(ANCHO_CAJA, ALTO_CAJA, false);
      sprite.body.setOffset((TAMANO_FRAME - ANCHO_CAJA) / 2, pies - ALTO_CAJA);
    }
  }

  crearNocheYLuces() {
    const ancho = this.mapa.widthInPixels;
    const alto = this.mapa.heightInPixels;
    this.capaNoche = this.add.rectangle(0, 0, ancho, alto, 0x0e1230, 0.72)
      .setOrigin(0, 0).setDepth(10000).setVisible(false);
    this.luces = this.mapa.getObjectLayer('luces').objects.map((l) => {
      const radio = prop(l, 'radio') || 48;
      return this.add.image(l.x, l.y, 'luz').setDisplaySize(radio * 2, radio * 2)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setDepth(10001).setVisible(false);
    });
  }

  // =====================================================
  //  INTERACTUABLES: contorno brillante + icono flotante
  // =====================================================
  crearInteractuables() {
    this.interactuables = this.mapa.getObjectLayer('interactuables').objects.map((punto) => {
      const nombreObjeto = prop(punto, 'objeto');
      const img = this.objetosPorNombre[nombreObjeto];
      const item = { punto, img, contorno: null, icono: null, cerca: false };
      if (!img) {
        console.warn(`El interactuable "${punto.name}" apunta al objeto "${nombreObjeto}", que no está en la capa "objetos"`);
        return item;
      }

      // 1. Contorno: una copia de la silueta del objeto, 1 píxel más grande, en amarillo
      const claveContorno = this.crearTexturaContorno(img.texture.key);
      item.contorno = this.add.image(img.x - 1, img.y + 1, claveContorno)
        .setOrigin(0, 1)
        .setDepth(img.depth + 0.1)
        .setAlpha(0.5);
      item.tweenContorno = this.tweens.add({
        targets: item.contorno, alpha: { from: 0.25, to: 0.85 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      // 2. Icono flotante encima del objeto
      const xCentro = img.x + img.width / 2;
      const yArriba = img.y - img.height - 2;
      item.icono = this.add.image(xCentro, yArriba, prop(punto, 'icono'))
        .setOrigin(0.5, 1)
        .setDepth(10002);   // por encima de la noche: siempre se ve
      this.tweens.add({
        targets: item.icono, y: yArriba - 4,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      return item;
    });
  }

  // Crea (una sola vez) una textura con solo el borde de la silueta de otra
  crearTexturaContorno(key) {
    const claveContorno = `${key}_contorno`;
    if (this.textures.exists(claveContorno)) return claveContorno;

    const src = this.textures.get(key).getSourceImage();
    const w = src.width + 2;
    const h = src.height + 2;
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 1, 1);
    const datos = ctx.getImageData(0, 0, w, h);
    const solido = (x, y) => x >= 0 && y >= 0 && x < w && y < h && datos.data[(y * w + x) * 4 + 3] > 200;
    const borde = ctx.createImageData(w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (solido(x, y)) continue;
        if (solido(x - 1, y) || solido(x + 1, y) || solido(x, y - 1) || solido(x, y + 1)) {
          const i = (y * w + x) * 4;
          [borde.data[i], borde.data[i + 1], borde.data[i + 2]] = COLOR_CONTORNO;
          borde.data[i + 3] = 255;
        }
      }
    }
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(borde, 0, 0);
    this.textures.addCanvas(claveContorno, lienzo);
    return claveContorno;
  }

  // El interactuable dentro de cuyo "radio" estás (o undefined)
  interactuableCerca() {
    if (!this.jugador) return undefined;
    return this.interactuables.find((it) =>
      Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, it.punto.x, it.punto.y)
        <= (prop(it.punto, 'radio') || 40));
  }

  // Resalta más el objeto cuando estás al lado
  actualizarResaltado() {
    const cerca = this.interactuableCerca();
    this.interactuables.forEach((it) => {
      if (!it.contorno) return;
      const ahora = it === cerca;
      if (ahora === it.cerca) return;
      it.cerca = ahora;
      if (ahora) {
        it.tweenContorno.pause();
        it.contorno.setAlpha(1);
        it.icono.setScale(1.25);
      } else {
        it.tweenContorno.resume();
        it.icono.setScale(1);
      }
    });
  }

  usarInteractuable() {
    if (this.dialogoAbierto || this.time.now < this.bloqueoE) return;
    if (this.jugador.forma === 'lobo') return;   // los lobos no leen el tablón ni miran el pozo
    const it = this.interactuableCerca();
    if (!it) return;

    const tipo = prop(it.punto, 'tipo');
    let dialogo = null;

       if (tipo === 'como_jugar') {
      // Jugadores conectados: los demás que veo + yo
      const numeroDeJugadores = this.otros.size + 1;

      // 1 lobo por cada 4 jugadores (redondeando hacia abajo), y como mínimo 1
      let numeroDeLobos = Math.floor(numeroDeJugadores / 4);
      if (numeroDeLobos < 1) {
        numeroDeLobos = 1;
      }

      dialogo = { titulo: 'Tablón de anuncios', icono: 'icono_tablon', paginas: comoJugar(numeroDeJugadores, numeroDeLobos) };
    } else if (tipo === 'pistas') {
      const pista = PISTAS[Math.min(this.diaActual, PISTAS.length) - 1];
      dialogo = {
        titulo: 'El pozo',
        icono: 'icono_pozo',
        paginas: [
          { subtitulo: `Pista del día ${this.diaActual}`, texto: `Te asomas al pozo y el eco te susurra:\n\n«${pista}»` },
        ],
      };
    }

    if (dialogo) {
      this.dialogoAbierto = true;
      this.jugador.setVelocity(0, 0);
      this.events.emit('dialogo', dialogo);   // lo muestra Vue (JuegoPueblo.vue)
    }
  }

  // =====================================================
  //  TECLADO Y TEXTO DE AYUDA
  // =====================================================
  crearTeclado() {
    this.teclas = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,N,C');
    this.teclas.E.on('down', () => this.usarInteractuable());
    this.teclas.N.on('down', () => { if (!this.dialogoAbierto) this.cambiarNoche(); });
    this.teclas.C.on('down', () => { if (!this.dialogoAbierto) this.irACama(); });
  }

  crearTextoAyuda() {
    // Como la cámara tiene zoom 2, hay que compensar la posición y el tamaño
    const cam = this.cameras.main;
    const z = cam.zoom;
    this.ayuda = this.add.text(
      cam.width / 2 - (cam.width / 2 - 10) / z,
      cam.height / 2 - (cam.height / 2 - 10) / z,
      'Conectando con el servidor…',
      { fontFamily: 'monospace', fontSize: '14px', color: '#F4EBDD', backgroundColor: '#1E2547', padding: { x: 6, y: 4 } },
    ).setScrollFactor(0).setScale(1 / z).setDepth(20000);

    // Aviso "[E] …" abajo en el centro
    this.aviso = this.add.text(
      cam.width / 2,
      cam.height / 2 + (cam.height / 2 - 28) / z,
      '',
      { fontFamily: 'monospace', fontSize: '16px', color: '#FFE88C', backgroundColor: '#1E2547', padding: { x: 10, y: 6 } },
    ).setOrigin(0.5, 1).setScrollFactor(0).setScale(1 / z).setDepth(20000).setVisible(false);
  }

  // =====================================================
  //  SPAWNS POR CASA
  // =====================================================
  spawnDeCasa(casa) {
    const p = this.spawns.find((s) => s.type === 'spawn' && prop(s, 'jugador') === casa);
    if (!p) console.warn(`No hay spawn con jugador = ${casa} en la capa "spawns"`);
    return p;
  }

  camaDeCasa(casa) {
    return this.spawns.find((s) => s.name === `cama_${CASAS[casa]}`);
  }

  // =====================================================
  //  MULTIJUGADOR
  // =====================================================
  conectar() {
    // Coger el nombre que se puso en el login
    const usuario = useUserStore();
    let nom = usuario.nom;
    if (nom === '') {
      nom = 'Anónimo';
    }

    // Conectarse al servidor mandando el nombre
    this.socket = io(SERVIDOR, { query: { nom: nom } });

    this.socket.on('bienvenida', ({ miId, miCasa, jugadores }) => {
      this.miId = miId;
      this.miCasa = miCasa;
      this.crearMiJugador(miCasa);
      jugadores.forEach((j) => {
        if (j.id !== miId) this.crearOtro(j);
      });
    });

    this.socket.on('jugadorNuevo', (j) => this.crearOtro(j));

    this.socket.on('jugadorMovido', (j) => {
      const s = this.otros.get(j.id);
      if (!s) return;
      s.setPosition(j.x, j.y);
      this.ponerAspecto(s, { forma: j.forma, direccion: j.dir, andando: j.andando, durmiendo: j.durmiendo });
      s.setDepth(j.durmiendo ? j.y + 20 : j.y);   // dormido: por encima de la cama
    });

    this.socket.on('jugadorSale', (id) => {
      const s = this.otros.get(id);
      if (s) s.destroy();
      this.otros.delete(id);
    });

    this.socket.on('salaLlena', () => {
      this.ayuda.setText('La sala está llena (8/8)');
    });

    const desconectar = () => this.socket && this.socket.disconnect();
    this.events.once('shutdown', desconectar);
    this.events.once('destroy', desconectar);
  }

  crearMiJugador(casa) {
    const inicio = this.spawnDeCasa(casa);
    const personaje = CASAS[casa];
    this.jugador = this.physics.add.sprite(inicio.x, inicio.y, `${personaje}-Idle-D`, 0);
    this.jugador.personaje = personaje;
    this.jugador.direccion = 'abajo';
    this.jugador.forma = this.formaQueMeToca();
    this.ponerAspecto(this.jugador, { forma: this.jugador.forma, direccion: 'abajo', andando: false, durmiendo: false });
    this.jugador.setCollideWorldBounds(true);
    this.physics.add.collider(this.jugador, this.muros);
    this.cameras.main.startFollow(this.jugador, true, 0.15, 0.15);
    this.enviarPosicion(true);
  }

  crearOtro(j) {
    if (this.otros.has(j.id)) return;
    const personaje = CASAS[j.casa];
    const p = j.x === null ? this.spawnDeCasa(j.casa) : j;
    const s = this.add.sprite(p.x, p.y, `${personaje}-Idle-D`, 0);
    s.personaje = personaje;
    this.ponerAspecto(s, { forma: j.forma, direccion: j.dir, andando: j.andando, durmiendo: j.durmiendo });
    s.setDepth(j.durmiendo ? p.y + 20 : p.y);
    this.otros.set(j.id, s);
  }

  enviarPosicion(forzar = false) {
    const ahora = this.time.now;
    if (!forzar && ahora - this.ultimoEnvio < 1000 / ENVIOS_POR_SEGUNDO) return;
    this.ultimoEnvio = ahora;
    const j = this.jugador;
    this.socket.emit('mover', {
      x: Math.round(j.x),
      y: Math.round(j.y),
      dir: j.direccion,
      andando: j.body.velocity.lengthSq() > 0,
      forma: j.forma,              // 'aldeano' o 'lobo'
      durmiendo: this.enCama,
    });
  }

  // =====================================================
  //  BUCLE
  // =====================================================
  update() {
    if (!this.jugador) return;

    const t = this.teclas;
    const j = this.jugador;
    let vx = 0;
    let vy = 0;

    if (!this.enCama && !this.dialogoAbierto) {
      if (t.A.isDown || t.LEFT.isDown) vx = -1;
      else if (t.D.isDown || t.RIGHT.isDown) vx = 1;
      if (t.W.isDown || t.UP.isDown) vy = -1;
      else if (t.S.isDown || t.DOWN.isDown) vy = 1;
    }

    const velocidad = j.forma === 'lobo' ? VELOCIDAD_LOBO : VELOCIDAD;
    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(velocidad);
    j.setVelocity(v.x, v.y);
    const andando = vx !== 0 || vy !== 0;

    if (andando) {
      if (Math.abs(vx) > Math.abs(vy)) j.direccion = vx > 0 ? 'derecha' : 'izquierda';
      else j.direccion = vy > 0 ? 'abajo' : 'arriba';
    }
    if (!this.enCama) {
      this.ponerAspecto(j, { forma: j.forma, direccion: j.direccion, andando, durmiendo: false });
      j.setDepth(j.y);
    }

    if (andando || this.estabaAndando) this.enviarPosicion(!andando);
    this.estabaAndando = andando;

    // interactuables
    this.actualizarResaltado();
    const cerca = this.interactuableCerca();
    const mostrarAviso = cerca && !this.dialogoAbierto && !this.enCama && j.forma !== 'lobo';
    this.aviso.setVisible(!!mostrarAviso);
    if (mostrarAviso) this.aviso.setText(`[E] ${prop(cerca.punto, 'texto_boton')}`);

    const zona = this.zonaActual();
    this.ayuda.setText([
      `Tu casa: ${this.miCasa} (${CASAS[this.miCasa]}) · Jugadores: ${this.otros.size + 1}/8`,
      `Zona: ${zona ? zona.name : 'exterior'}`,
      'WASD moverse · E usar · N noche (lobo) · C cama',
    ]);
  }

  // =====================================================
  //  ZONAS, NOCHE Y CAMA
  // =====================================================
  zonaActual() {
    const { x, y } = this.jugador;
    return this.zonas.find((z) => {
      if (z.ellipse) {
        const rx = z.width / 2;
        const ry = z.height / 2;
        const dx = (x - (z.x + rx)) / rx;
        const dy = (y - (z.y + ry)) / ry;
        return dx * dx + dy * dy <= 1;
      }
      return x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height;
    });
  }

  cambiarNoche() {
    const noche = !this.capaNoche.visible;
    this.capaNoche.setVisible(noche);
    this.luces.forEach((l) => l.setVisible(noche));
    this.actualizarForma();
  }

  // De noche, si tu casa es de lobo, eres lobo. De día (o en la cama), aldeano.
  formaQueMeToca() {
    const esDeNoche = this.capaNoche.visible;
    const miCasaEsDeLobo = CASAS_DE_LOS_LOBOS.includes(CASAS[this.miCasa]);
    if (esDeNoche && miCasaEsDeLobo && !this.enCama) return 'lobo';
    return 'aldeano';
  }

  actualizarForma() {
    if (!this.jugador) return;
    const j = this.jugador;
    j.forma = this.formaQueMeToca();
    if (!this.enCama) this.ponerAspecto(j, { forma: j.forma, direccion: j.direccion, andando: false, durmiendo: false });
    this.enviarPosicion(true);   // que los demás vean el cambio
  }

  irACama() {
    if (!this.jugador) return;
    const destino = this.enCama ? this.spawnDeCasa(this.miCasa) : this.camaDeCasa(this.miCasa);
    this.enCama = !this.enCama;
    const j = this.jugador;
    j.forma = this.formaQueMeToca();      // en la cama siempre eres aldeano; al levantarte de noche, lobo
    this.ponerAspecto(j, { forma: j.forma, direccion: 'abajo', andando: false, durmiendo: this.enCama });
    j.direccion = 'abajo';
    j.body.reset(destino.x, destino.y);
    j.body.enable = !this.enCama;
    j.setDepth(this.enCama ? destino.y + 20 : destino.y);   // dormido: por encima de la cama
    this.enviarPosicion(true);
  }
}
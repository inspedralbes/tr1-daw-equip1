# Documentació
Llistat d'alguns dels punts que han de quedar explicats en aquesta carpeta. Poden ser tots en aquest fitxer o en diversos fitxers enllaçats.

És obligatori modificar aquest document!!

## Objectiu i arquitectura

El projecte és un prototip d'espai virtual amb client web i servidor en temps real. Actualment, el frontend és una plantilla Vue 3 amb Vite i el backend és un servidor Node.js amb Express i Socket.IO. La lògica del mapa, els avatars, el xat i les videotrucades encara no està implementada.

Durant el desenvolupament, Vite serveix l'aplicació Vue al port `5173` i el backend Node.js queda accessible directament al port `3000`. El frontend es connecta directament a Socket.IO del backend (port `3000`) des de la vista del joc (`/plaza` i `/partida`); no hi ha cap proxy configurat entre els dos serveis.

## Entorn de desenvolupament amb Docker

Cal tenir Docker amb Docker Compose v2 instal·lat. Des de l'arrel del repositori:

```sh
cp -n .env.example .env
docker compose -f compose.dev.yaml up --build
```

Compose carrega automàticament el fitxer `.env` de l'arrel. El fitxer `.env.example` és només una plantilla; cada desenvolupador la copia al seu `.env` local, que no es puja a Git. El frontend queda disponible a `http://localhost:5173` i el backend a `http://localhost:3000`. Els ports es poden canviar a `.env`. `NODE_ENV=development` indica a Express i a altres llibreries Node que s'està executant en desenvolupament; el servidor actual encara no té lògica pròpia condicionada per aquesta variable.

Els canvis als fitxers del backend reinicien el servidor amb Nodemon. Vite aplica HMR als canvis del frontend i utilitza polling per detectar-los de manera fiable dins dels volums Docker. Per aturar els contenidors sense esborrar els volums de dependències:

```sh
docker compose -f compose.dev.yaml down
```

El codi es munta dins dels contenidors per permetre la recàrrega en calent. Les dependències de Node.js es mantenen en volums Docker. Si canvies dependències, recrea aquests volums perquè s'instal·lin les versions noves:

```sh
docker compose -f compose.dev.yaml down -v
docker compose -f compose.dev.yaml up --build
```

## API i esdeveniments actuals del backend

- `GET /`: retorna el text `Servidor en funcionament` amb estat HTTP 200.
- Socket.IO: en connectar-se un client, el servidor emet `welcome` amb el text `Connexió establerta amb el servidor`.
- En desconnectar-se un client, el servidor registra l'esdeveniment al log.

### Sala del poble (joc)

La lògica és a `backend/pueblo.js` i s'activa des de `server.js` amb `registrarPueblo(io)`. Socket.IO té `cors` obert perquè el frontend (port `5173`) s'hi connecta des d'un altre origen.

| Esdeveniment | Direcció | Dades | Per a què |
|---|---|---|---|
| `bienvenida` | servidor → client nou | `{ miId, miCasa, jugadores }` | Casa assignada (0-7) i jugadors que ja hi són. |
| `jugadorNuevo` | servidor → la resta | `{ id, casa, x, y, dir, andando, forma, durmiendo }` | Ha entrat algú. |
| `mover` | client → servidor | `{ x, y, dir, andando, forma, durmiendo }` | Posició, direcció, si camina, si és llop i si dorm. |
| `jugadorMovido` | servidor → la resta | mateix objecte que `jugadorNuevo` | Algú s'ha mogut o ha canviat. |
| `jugadorSale` | servidor → tots | `id` | Algú ha sortit; la seva casa queda lliure. |
| `salaLlena` | servidor → client nou | — | Ja hi ha 8 jugadors. |

Més detalls del joc a [`juego-pueblo.md`](./juego-pueblo.md) i de l'edició del mapa a [`GUIA_TILED.md`](./GUIA_TILED.md).

Encara no hi ha altres rutes d'API ni senyalització o transport de mitjans WebRTC implementats.

## Documentació bàsica MÍNIMA
 * Objectius
 * Arquitectura bàsica
   * Tecnologies utilitzades
   * Interrelació entre els diversos components
 * Com crees l'entorn de desenvolupament
 * Com desplegues l'aplicació a producció
 * Llistat d'endpoints de l'API de backend (també podeu documentar-ho amb swagger)
    * Rutes
   * Exemples de JSON de peticó
   * Exemples de JSON de resposta i els seus codis d'estat 200? 404?
 * Aplicació Android
 * Altres elements importants.
 * ...


README
 · MD
# Pixel Plaza
 
Joc multijugador en temps real de llops i aldeans, fet amb Vue 3, Phaser, Socket.IO i WebRTC.
 
## Integrants
 
* Fode Konte
* Nil Díaz
* Jordi Guzmán
* Kim Zairyl
* Hugo Berea
## Nom del projecte
 
**Pixel Plaza** (projecte transversal TR1, Grau Superior 2 DAW, Institut Pedralbes)
 
## Descripció
 
Pixel Plaza és un joc d'estil «homes llop» en una sala de Phaser amb **8 jugadors**: 6 aldeans i 2 llops.
 
* La partida alterna **dia i nit**. De nit, els llops maten un jugador. De dia, tots els jugadors voten per expulsar un sospitós.
* La partida acaba quan **s'han expulsat els 2 llops**, o quan **queden 2 llops contra 2 aldeans**.
* El mapa és un poble amb una **zona central** i **cases o habitacions sense sostre**. Hi ha **pals interactuables** que donen informació i pistes segons la fase de la partida.
* Els jugadors es comuniquen en temps real amb Socket.IO i, per la proximitat, amb WebRTC.
### Tecnologies
 
* Vue 3 (interfície i estat)
* Phaser (món 2D)
* Socket.IO (servidor Node.js de comunicació en temps real)
* WebRTC (àudio i vídeo entre jugadors)
* Docker (entorn d'execució)
El projecte reutilitza codi de dos repositoris dels professors, entre ells [poc-oficina-virtual](https://github.com/polprats/poc-oficina-virtual).
 
## Gestor de tasques
 
Taiga (Scrum, projecte `dawtr1_g1`): https://tree.taiga.io/project/a24kimgalgal-dawtr1_g1/timeline
 
## Prototip gràfic
 
_Encara no disponible._
 
## URL de producció
 
_Encara no disponible._
 
## Estat
 
En desenvolupament. Treballem amb Scrum en sprints de 3 setmanes, **del 23 de novembre al 10 de desembre de 2026**.
 
* **Sprint 1 (en curs):** user stories US-01 a US-04 planificades a Taiga:
  * US-01: Docker
  * US-02: entrada amb nom i avatar
  * US-03: Phaser i moviment
  * US-04: sincronització entre jugadors
  * US-05: Lobby mínim amb jugadors connectats
  * US-06: Protocol, GitFlow i documentació inicial

* Pendent de decidir: el _stretch goal_ del projecte.
 

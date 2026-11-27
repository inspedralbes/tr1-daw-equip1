# Protocol de comunicació (Socket.IO) · v1
 
Document viu: s'actualitza a cada sprint. Qualsevol canvi d'un esdeveniment (nom, direcció o payload) s'ha de reflectir aquí **dins de la mateixa PR** que el canvi al codi.
 
- **Versió:** 1 (Sprint 1)
- **Estat:** descriu els esdeveniments **ja implementats** a `backend/server.js` i `backend/pueblo.js`
- **Transport:** Socket.IO (WebSocket). El servidor és la font de veritat de la sala. El vídeo (WebRTC) no passarà pel servidor; només hi haurà senyalització (pendent).
## 1. Convencions
 
- Els noms dels esdeveniments actuals estan en castellà i en `camelCase` (`jugadorNuevo`, `jugadorSale`). **Es mantenen tal com són al codi** perquè no es trenqui res; els esdeveniments nous han de seguir el mateix estil.
- Els payloads són objectes JSON plans (mai funcions ni nodes HTML).
- Hi ha una **sola sala** de **8 jugadors** com a màxim. Cada jugador té assignada una **casa** (0-7).
- `connection` i `disconnect` són esdeveniments propis de Socket.IO.
## 2. Esdeveniments implementats
 
### 2.1 Connexió (`backend/server.js`)
 
| Esdeveniment | Direcció | Dades | Per a què |
|---|---|---|---|
| `welcome` | servidor → client | text: `"Connexió establerta amb el servidor"` | Confirma que la connexió s'ha establert |
| `disconnect` | client → servidor | — | El servidor registra la desconnexió al log |
 
### 2.2 Sala del poble (`backend/pueblo.js`)
 
| Esdeveniment | Direcció | Dades | Per a què |
|---|---|---|---|
| `bienvenida` | servidor → client nou | `{ miId, miCasa, jugadores }` | Identificador propi, casa assignada (0-7) i jugadors que ja hi són |
| `jugadorNuevo` | servidor → la resta | `{ id, casa, x, y, dir, andando, forma, durmiendo }` | Ha entrat algú |
| `mover` | client → servidor | `{ x, y, dir, andando, forma, durmiendo }` | El client envia la seva posició i estat |
| `jugadorMovido` | servidor → la resta | mateix objecte que `jugadorNuevo` | Algú s'ha mogut o ha canviat d'estat |
| `jugadorSale` | servidor → tots | `id` | Algú ha sortit; la seva casa queda lliure |
| `salaLlena` | servidor → client nou | — | Ja hi ha 8 jugadors; no es pot entrar |
 
### 2.3 Camps del jugador
 
| Camp | Tipus | Descripció |
|---|---|---|
| `id` | string | Identificador del jugador (el de Socket.IO) |
| `casa` | number | Casa assignada, de 0 a 7 |
| `x`, `y` | number | Posició al mapa, en píxels |
| `dir` | string | Direcció cap a la qual mira |
| `andando` | boolean | Si està caminant (per a l'animació) |
| `forma` | string o boolean | Si és llop o aldeà (a confirmar el tipus al codi) |
| `durmiendo` | boolean | Si està dormint a la seva casa |
 
> **A confirmar al codi:** el tipus exacte de `jugadores` a `bienvenida` (array o objecte), els valors possibles de `dir` i `forma`, i si `jugadorSale` envia l'`id` sol o dins d'un objecte. Mira `backend/pueblo.js` i corregeix aquesta taula si cal.
 
## 3. Pendent de definir
 
Hi ha coses que la US-02 (pantalla d'entrada) ja recull al client però que el protocol actual **no transporta**:
 
1. **Nom i avatar del jugador:** el client els guarda a Pinia (`useUserStore`), però `mover`, `jugadorNuevo` i `bienvenida` no inclouen cap `nom` ni `avatar`. Caldrà un esdeveniment d'entrada (o afegir aquests camps) perquè els altres jugadors vegin el nom i el color.
2. **Validació del nom:** repetit o no vàlid (2-15 caràcters). Ara el servidor no el valida.
3. **Lobby:** llista de jugadors connectats abans d'entrar a la plaça.
4. **Freqüència de `mover`:** el client hauria de limitar-la (10-15 vegades per segon) perquè no saturi la xarxa.
## 4. Esdeveniments previstos (Sprints 2 i 3)
 
Encara **no implementats** i sense nom decidit. S'afegiran a la secció 2 quan es facin.
 
| Sprint | Què cal comunicar | Direcció |
|---|---|---|
| 2 | Jugador "a punt" al lobby | client → servidor → tots |
| 2 | Rol de cada jugador (només el seu) | servidor → client |
| 2 | Canvi de fase (dia, nit, debat, votació) i temps restant | servidor → tots |
| 2 | Votació dels llops a la nit i resultat | client → servidor → tots |
| 2 | Votació del poble i resultat | client → servidor → tots |
| 2 | Xat de text | client → servidor → sala |
| 2-3 | Senyalització WebRTC: oferta, resposta i candidats ICE | client → servidor → client |
| 3 | Inici i final de comunicació per zona o proximitat | servidor → clients implicats |
| 3 | Final de partida, guanyador i resum | servidor → tots |
 
## 5. Historial de canvis
 
| Versió | Data | Canvis |
|---|---|---|
| 1 | 27/11/2026 | Documentats els esdeveniments existents de la sala del poble |


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
 

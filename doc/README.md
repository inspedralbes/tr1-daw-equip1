# Documentació
Llistat d'alguns dels punts que han de quedar explicats en aquesta carpeta. Poden ser tots en aquest fitxer o en diversos fitxers enllaçats.

És obligatori modificar aquest document!!

## Objectiu i arquitectura

El projecte és un prototip d'espai virtual amb client web i servidor en temps real. Actualment, el frontend és una plantilla Vue 3 amb Vite i el backend és un servidor Node.js amb Express i Socket.IO. La lògica del mapa, els avatars, el xat i les videotrucades encara no està implementada.

Durant el desenvolupament, Vite serveix l'aplicació Vue al port `5173` i el backend Node.js queda accessible directament al port `3000`. El frontend encara no consumeix l'API ni Socket.IO, així que no hi ha cap proxy configurat entre els dos serveis.

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

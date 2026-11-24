# Backend

Servidor bàsic amb Node.js, Express i Socket.IO.

## Execució

```bash
npm install
npm start
```

El servidor escolta al port `3000` per defecte.

- `GET /` respon `Servidor en funcionament`.
- Socket.IO emet `welcome` quan es connecta un client i registra els esdeveniments `connection` i `disconnect`.

# 🌶️ Torrente-Full — Addon Stremio solo Español / Latino / Dual

Alternativa a Torrentio que usa **el mismo mecanismo pre-indexado de Torrentio** pero filtrado a español.

- Upstream: `https://torrentio.strem.fun` con `providers=mejortorrent,wolfmax4k,cinecalidad` + `language=spanish,latino`
- Filtro extra por regex: español, castellano, latino, dual, multi, VOSE, `Cap.510`
- Reordena por calidad (REMUX > HDR/DV > 4K > 1080p > 720p) y luego por seeders
- Soporta Debrid (RealDebrid / TorBox / AllDebrid / Premiumize / DebridLink / Offcloud) pasándolo a Torrentio
- Cache en memoria 10 min para respuesta instantánea como Torrentio

## 1. Probar en local (2 min)

```powershell
cd C:\Users\mp3ed\projects\torrente-full
npm install
npm start
```

Abre:

- `http://127.0.0.1:7000/manifest.json`
- `http://127.0.0.1:7000/{"debridService":"none"}/manifest.json` (con config)
- Test stream película: `http://127.0.0.1:7000/stream/movie/tt1254207.json`
- Test serie: `http://127.0.0.1:7000/stream/series/tt0903747:1:1.json`

Instalar en Stremio (solo local): pega `http://127.0.0.1:7000/manifest.json` en Stremio Web → Addons → pegar URL. Nota: Stremio exige HTTPS salvo `127.0.0.1`, por eso en local solo funciona en la misma máquina.

## 2. Desplegar para usar en móvil / TV (elige 1)

### A. Render.com (gratis, recomendado)
1. Sube esta carpeta a GitHub.
2. Render → New Web Service → conecta repo.
3. Build: `npm install`, Start: `npm start`. Render te da `https://torrente-full.onrender.com`.
4. Instala en Stremio: `https://torrente-full.onrender.com/manifest.json`

### B. Railway / Northflank / VPS
Igual: `npm install && npm start`, variable `PORT` la que te dé el host. Necesitas HTTPS público.

### C. Docker / VPS propio
```bash
docker build -t torrente-full .
docker run -p 7000:7000 -e PORT=7000 torrente-full
# + reverse proxy con HTTPS (Caddy/Nginx) para Stremio
```

## 3. Con Debrid (recomendado)

En la pantalla de instalación del addon elige `debridService` y pega tu `debridKey`, o construye la URL manual:

```
https://TU-DOMINIO/%7B"debridService"%3A"realdebrid"%2C"debridKey"%3A"TU_KEY"%7D/manifest.json
```

Sin debrid verás magnets P2P (necesitas seeders). Con debrid verás `+` cached instantáneo.

## 4. Cómo funciona (mismo mecanismo Torrentio)

```
Stremio → GET /stream/movie/ttXXXX → Torrente-Full
→ GET https://torrentio.strem.fun/providers=mejortorrent,wolfmax4k,cinecalidad|language=spanish,latino|sort=qualitysize/stream/...
→ filtra ES_REGEX → re-etiqueta [LATINO]/[CAST]/[DUAL]/[MULTI] → ordena → devuelve 50
```

No scrapea en vivo, reutiliza la DB pre-indexada de Torrentio (instantáneo, sin rate-limit).

## 5. Límites conocidos

- Solo hay 3 providers ES en Torrentio. Si una peli solo existe en inglés, saldrá vacía (a propósito). Pon `soloEspanol=no` para fallback.
- `Cinecalidad` es mayormente latino, `Wolfmax4K` castellano con nomenclatura `Cap.510`.
- Si quieres 100% propio sin depender de Torrentio, el paso siguiente es fork de `knightcrawler-stremio/knightcrawler` con solo esos indexers.

Uso responsable: solo contenido con derechos para compartir en tu país.

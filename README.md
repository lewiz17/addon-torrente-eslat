# 🌶️ Torrente-Full — Addon Stremio solo Español / Latino / Dual

Alternativa a Torrentio que usa **el mismo mecanismo pre-indexado de Torrentio** pero filtrado a español.

- Upstream: `https://torrentio.strem.fun` con `providers=mejortorrent,wolfmax4k,cinecalidad` + `language=spanish,latino`
- Filtro extra por regex: español, castellano, latino, dual, multi, VOSE, `Cap.510`
- Reordena por calidad (REMUX > HDR/DV > 4K > 1080p > 720p) y luego por seeders
- Soporta Debrid (RealDebrid / TorBox / AllDebrid / Premiumize / DebridLink / Offcloud) pasándolo a Torrentio
- Cache en memoria 10 min para respuesta instantánea como Torrentio

---

## Probar en local (2 min)

```powershell
cd C:\Users\mp3ed\projects\torrente-full
npm install
npm start
```

Abre:

- `http://127.0.0.1:7000/manifest.json`
- Test stream película: `http://127.0.0.1:7000/stream/movie/tt1254207.json`
- Test serie: `http://127.0.0.1:7000/stream/series/tt0903747:1:1.json`

Stremio exige HTTPS salvo `127.0.0.1`, así que en local solo funciona en la misma máquina. Para móvil/TV necesitas desplegar.

---

## Desplegar en Vercel (gratis, 2 min)

El addon ya incluye `serverless.js` + `vercel.json` listos para Vercel.

### Opción 1 — CLI (más rápido)

```powershell
# Instala la CLI de Vercel una vez
npm i -g vercel

# Desde la carpeta del proyecto
cd C:\Users\mp3ed\projects\torrente-full
vercel
```

Sigue las pantallas (login + link de proyecto). Al terminar te imprime la URL, tipo `https://torrente-full-xxxx.vercel.app`.

Luego instala en Stremio:

```
https://TU-URL.vercel.app/manifest.json
```

### Opción 2 — GitHub + Vercel dashboard

1. Sube la carpeta a un repo de GitHub.
2. Ve a [vercel.com/new](https://vercel.com/new).
3. Importa el repo. Vercel detecta `vercel.json` automáticamente.
4. Deploy. Te da `https://TU-PROYECTO.vercel.app`.
5. Instala en Stremio: `https://TU-PROYECTO.vercel.app/manifest.json`

### Opción 3 — Arrastrar y soltar

1. Comprime la carpeta en un `.zip` (sin `node_modules`).
2. Ve a [vercel.com/new](https://vercel.com/new) → "Deploy from folder" o arrastra el zip.
3. Te da la URL.

> Nota: Vercel free tier tiene límite de requests/mes (~100k en hobby). Cada búsqueda de Stremio = 1 request, más las de cache. Para uso personal es más que suficiente.

---

## Desplegar en Render / Railway / Docker (alternativas)

### Render.com
1. Sube a GitHub.
2. Render → New Web Service → conecta repo.
3. Build: `npm install`, Start: `npm start`.
4. Instala: `https://tu-app.onrender.com/manifest.json`

### Docker / VPS propio
```bash
docker build -t torrente-full .
docker run -p 7000:7000 -e PORT=7000 torrente-full
# + reverse proxy HTTPS (Caddy/Nginx) para Stremio
```

---

## Con Debrid (recomendado)

En Stremio, al instalar el addon, pulsa **Configure** y elige:

- `debridService`: `realdebrid` / `torbox` / `alldebrid` / etc.
- `debridKey`: tu API key del servicio debrid
- `soloEspanol`: `si` (solo español) o `no` (fallback a inglés si no hay)

O construye la URL manual:

```
https://TU-URL/%7B"debridService"%3A"realdebrid"%2C"debridKey"%3A"TU_KEY"%7D/manifest.json
```

Sin debrid verás magnets P2P (necesita seeders). Con debrid verás `+` cached instantáneo.

---

## Cómo funciona (mismo mecanismo Torrentio)

```
Stremio → GET /stream/movie/ttXXXX
  → Torrente-Full (Vercel serverless)
    → GET https://torrentio.strem.fun/
         providers=mejortorrent,wolfmax4k,cinecalidad
         |language=spanish,latino|sort=qualitysize
         /stream/movie/ttXXXX.json
    → filtra por ES_REGEX (español|latino|dual|multi|VOSE|Cap.)
    → re-etiqueta [LATINO] / [CAST] / [DUAL] / [MULTI]
    → ordena por calidad, luego seeders
    → cache en memoria 10 min
    → devuelve 50 streams
```

No scrapea en vivo. Reutiliza la DB pre-indexada de Torrentio (polling 24/7 de sus scrapers), así que la respuesta es instantánea.

---

## Límites conocidos

- Solo hay 3 providers ES en Torrentio. Si una peli solo existe en inglés, saldrá vacía (a propósito).
- `Cinecalidad` es mayormente latino, `Wolfmax4K` castellano con nomenclatura `Cap.510` (S05E10).
- Si quieres 100% propio sin depender de Torrentio, el siguiente paso es un fork de `knightcrawler-stremio/knightcrawler` con solo esos indexers.

---

Uso responsable: solo contenido con derechos para compartir en tu país.

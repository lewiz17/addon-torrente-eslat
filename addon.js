const { addonBuilder } = require('stremio-addon-sdk');

// Mismo mecanismo que Torrentio: NO scrapeamos en vivo.
// Proxyeamos su DB pre-indexada (polling 24/7) pero limitada a providers ES
// + filtro de idioma ES/Latino/Dual/Multi.
const UPSTREAM = process.env.TORRENTIO_BASE || 'https://torrentio.strem.fun';
const ES_PROVIDERS = 'mejortorrent,wolfmax4k,cinecalidad';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const manifest = {
  id: 'org.torrentefull.spanish',
  version: '1.0.0',
  name: 'Torrente-Full',
  description: 'Solo torrents en Español, Latino y Dual/Multi. Usa el mismo mecanismo pre-indexado de Torrentio (MejorTorrent + Wolfmax4K + Cinecalidad), filtrado y reordenado. Requiere Debrid para mejor resultado.',
  logo: 'https://torrentio.strem.fun/images/logo_v1.png',
  background: 'https://torrentio.strem.fun/images/background_v1.jpg',
  resources: [
    {
      name: 'stream',
      types: ['movie', 'series'],
      idPrefixes: ['tt', 'kitsu']
    }
  ],
  types: ['movie', 'series'],
  catalogs: [],
  config: [
    {
      key: 'debridService',
      type: 'select',
      title: 'Debrid (recomendado)',
      options: ['none', 'realdebrid', 'torbox', 'alldebrid', 'premiumize', 'debridlink', 'offcloud'],
      default: 'none',
      required: false
    },
    { key: 'debridKey', type: 'text', title: 'Debrid API Key', required: false },
    {
      key: 'soloEspanol',
      type: 'select',
      title: 'Si no hay español, ¿mostrar todo?',
      options: ['no', 'si'],
      default: 'no',
      required: false
    }
  ]
};

const builder = new addonBuilder(manifest);

// Regex español / latino / dual / multi
const ES_REGEX = /(espa[ñn]ol|spanish|castellano|\bcast\b|latino|lat[ií]n|dual|multi|vo.?se|subs?.?es|audio.?es|cap\.\d{3,4})/i;

function langTag(text) {
  const t = (text || '').toLowerCase();
  if (/multi/.test(t)) return '[MULTI]';
  if (/dual/.test(t)) return '[DUAL]';
  if (/latino|latín|latin/.test(t)) return '[LATINO]';
  if (/castellano|\bcast\b|espa[ñn]ol|spanish/.test(t)) return '[CAST]';
  if (/cap\.\d{3,4}/.test(t)) return '[CAST]';
  return '[ES]';
}

function qualityRank(text) {
  const t = (text || '').toLowerCase();
  if (/remux/.test(t)) return 0;
  if (/dolby.?vision|hdr|dv\b/.test(t)) return 1;
  if (/2160|4k|uhd/.test(t)) return 2;
  if (/1080/.test(t)) return 3;
  if (/720/.test(t)) return 4;
  if (/480|scr|cam/.test(t)) return 6;
  return 5;
}

function seedersOf(title) {
  const m = String(title || '').match(/👤\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function buildUpstream(type, id, config) {
  const service = (config && config.debridService) || 'none';
  const key = ((config && config.debridKey) || '').trim();
  // Formato Torrentio: /providers=..|language=spanish,latino|sort=qualitysize[|realdebrid=KEY]/stream/...
  let cfg = `providers=${ES_PROVIDERS}|language=spanish,latino|sort=qualitysize`;
  if (service && service !== 'none' && key) {
    cfg += `|${service}=${encodeURIComponent(key)}`;
  }
  return `${UPSTREAM}/${cfg}/stream/${type}/${id}.json`;
}

async function fetchUpstream(url) {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.data;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'torrente-full/1.0' } });
    if (!res.ok) throw new Error('upstream ' + res.status);
    const data = await res.json();
    cache.set(url, { at: now, data });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

builder.defineStreamHandler(async (args) => {
  const config = args.config || {};
  try {
    const url = buildUpstream(args.type, args.id, config);
    const data = await fetchUpstream(url);
    let streams = (data && data.streams) || [];

    // Filtro ES/Latino/Dual. Como upstream ya es solo providers ES,
    // esto solo elimina falsos positivos en inglés.
    const filtered = streams.filter((s) => {
      const blob = `${s.name || ''}\n${s.title || ''}\n${(s.behaviorHints && s.behaviorHints.filename) || ''}`;
      return ES_REGEX.test(blob);
    });

    let out = filtered.length > 0 ? filtered : streams;
    // Si el usuario quiere SOLO español y no hubo match, devuelve vacío en vez de fallback
    if (filtered.length === 0 && config.soloEspanol === 'si') out = [];

    out = out
      .map((s) => {
        const tag = langTag(`${s.name} ${s.title}`);
        return {
          ...s,
          name: `🌶️ Torrente-Full\n${tag} ${(s.name || '').split('\n')[0]}`.slice(0, 120),
          title: s.title
        };
      })
      .sort((a, b) => {
        const qa = qualityRank(`${a.name} ${a.title}`);
        const qb = qualityRank(`${b.name} ${b.title}`);
        if (qa !== qb) return qa - qb;
        return seedersOf(b.title) - seedersOf(a.title);
      })
      .slice(0, 50);

    return { streams: out };
  } catch (e) {
    console.error('[torrente-full]', args.type, args.id, e.message);
    return { streams: [] };
  }
});

module.exports = builder.getInterface();

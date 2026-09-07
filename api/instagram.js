/**
 * Trio Milagre — Instagram-feed.
 *
 * Funktionen kan hente på to måder, styret af miljøvariabler i Vercel:
 *
 *   IG_FEED_URL   Adressen på et feed fra fx behold.so. Anbefalet:
 *                 tjenesten holder selv Instagram-nøglen i live, så der
 *                 aldrig skal fornyes noget manuelt.
 *
 *   IG_TOKEN      En nøgle direkte fra Meta. Virker også, men udløber
 *                 efter 60 dage og skal fornyes i hånden.
 *
 * Er ingen af dem sat, svarer funktionen med en tom liste, og siden viser
 * de faste opslag fra IG_OPSLAG. Intet går i stykker.
 */

const FELTER = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
const ANTAL = 12;
const CACHE = 's-maxage=1800, stale-while-revalidate=86400';

export default async function handler(req, res) {
  const feedUrl = process.env.IG_FEED_URL;
  const token = process.env.IG_TOKEN;

  try {
    // 1. Feed-tjeneste — sendes videre som den er.
    if (feedUrl) {
      const svar = await fetch(feedUrl);
      if (!svar.ok) throw new Error('Feed svarede ' + svar.status);
      const data = await svar.json();
      res.setHeader('Cache-Control', CACHE);
      return res.status(200).json(data);
    }

    // 2. Nøgle direkte fra Meta.
    if (token) {
      const url = `https://graph.instagram.com/me/media?fields=${FELTER}`
        + `&limit=${ANTAL}&access_token=${encodeURIComponent(token)}`;
      const data = await (await fetch(url)).json();

      if (!data.data) {
        return res.status(200).json({
          posts: [],
          fejl: data.error?.message || 'Ukendt fejl fra Instagram.'
        });
      }
      const poster = data.data
        .map(o => ({
          permalink: o.permalink || '',
          mediaUrl: o.media_type === 'VIDEO' ? (o.thumbnail_url || '') : (o.media_url || ''),
          caption: o.caption || '',
          timestamp: o.timestamp || ''
        }))
        .filter(o => o.mediaUrl);

      res.setHeader('Cache-Control', CACHE);
      return res.status(200).json(poster);
    }

    return res.status(200).json({
      posts: [],
      fejl: 'Hverken IG_FEED_URL eller IG_TOKEN er sat i Vercel.'
    });
  } catch (fejl) {
    return res.status(200).json({ posts: [], fejl: String(fejl) });
  }
}

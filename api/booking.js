/**
 * Trio Milagre — bookingforespørgsler.
 *
 * Modtager formularen fra bookingsiden som JSON og sender den som mail via
 * Resend. Styres af miljøvariabler i Vercel:
 *
 *   RESEND_API_KEY     Nøglen fra resend.com. Uden den svarer funktionen
 *                      med en fejl, og siden falder tilbage til en
 *                      færdigskrevet mail.
 *   BOOKING_TIL        Modtager. Standard: st.tristan@gmail.com
 *   BOOKING_AFSENDER   Afsender. Skal være på et domæne, der er
 *                      verificeret i Resend. Standard: Trio Milagre
 *                      <booking@triomilagre.com>
 *
 * Svaret er altid JSON: { ok: true } eller { ok: false, fejl: '...' }.
 */

const TIL_STANDARD = 'st.tristan@gmail.com';
const AFSENDER_STANDARD = 'Trio Milagre <booking@triomilagre.com>';
const PAAKRAEVET = ['navn', 'email', 'dato', 'sted', 'besked'];
const MAKS = 4000;

function tekst(v) {
  return String(v == null ? '' : v).trim().slice(0, MAKS);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, fejl: 'Kun POST.' });
  }

  const noegle = process.env.RESEND_API_KEY;
  if (!noegle) {
    return res.status(500).json({ ok: false, fejl: 'RESEND_API_KEY er ikke sat i Vercel.' });
  }

  let krop = req.body || {};
  if (typeof krop === 'string') {
    try { krop = JSON.parse(krop); } catch { krop = {}; }
  }

  // Robotfælde: feltet er skjult for mennesker. Er det udfyldt, lader vi som
  // om alt gik godt, så robotten ikke prøver igen.
  if (tekst(krop.firma)) return res.status(200).json({ ok: true });

  const data = {};
  for (const felt of ['navn', 'email', 'telefon', 'dato', 'sted', 'anledning', 'gaester', 'saet', 'besked']) {
    data[felt] = tekst(krop[felt]);
  }
  const mangler = PAAKRAEVET.filter(f => !data[f]);
  if (mangler.length) {
    return res.status(400).json({ ok: false, fejl: 'Mangler: ' + mangler.join(', ') });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    return res.status(400).json({ ok: false, fejl: 'E-mailadressen ser forkert ud.' });
  }

  const linjer = [
    'Ny bookingforespørgsel fra triomilagre.com',
    '',
    'Navn:         ' + data.navn,
    'E-mail:       ' + data.email,
    'Telefon:      ' + (data.telefon || '—'),
    'Dato:         ' + data.dato,
    'Sted:         ' + data.sted,
    'Anledning:    ' + (data.anledning || '—'),
    'Antal gæster: ' + (data.gaester || '—'),
    'Spilletid:    ' + (data.saet || '—'),
    '',
    'Besked:',
    data.besked,
    '',
    'Svar direkte på denne mail, så går svaret til ' + data.email + '.'
  ];

  try {
    const svar = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + noegle, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.BOOKING_AFSENDER || AFSENDER_STANDARD,
        to: [process.env.BOOKING_TIL || TIL_STANDARD],
        reply_to: data.email,
        subject: 'Booking ' + data.dato + ' — ' + data.sted,
        text: linjer.join('\n')
      })
    });
    if (!svar.ok) {
      const fejl = await svar.text();
      console.error('Resend svarede', svar.status, fejl);
      return res.status(502).json({ ok: false, fejl: 'Mailen kunne ikke sendes (' + svar.status + ').' });
    }
    return res.status(200).json({ ok: true });
  } catch (fejl) {
    console.error('Resend fejlede', fejl);
    return res.status(502).json({ ok: false, fejl: String(fejl) });
  }
}

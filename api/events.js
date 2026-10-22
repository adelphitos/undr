// Vercel serverless function: pulls live NYC events from Ticketmaster's free Discovery API
// and tags age policy from the listing's `ageRestrictions.legalAgeEnforced` field.
// Set TM_API_KEY in Vercel env (free key: developer.ticketmaster.com). Without it, the app runs on seed data.
export default async function handler(req, res) {
  const key = process.env.TM_API_KEY;
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
  if (!key) return res.status(200).json({ live: false, events: [] });
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}&latlong=40.73,-73.97&radius=12&unit=miles&size=60&sort=date,asc&classificationName=music,comedy`;
    const r = await fetch(url);
    const j = await r.json();
    const today = new Date(); today.setHours(0,0,0,0);
    const events = (j._embedded?.events || []).map(e => {
      const v = e._embedded?.venues?.[0] || {};
      const start = new Date(e.dates?.start?.dateTime || e.dates?.start?.localDate);
      const d = Math.round((start - today) / 86400000);
      if (isNaN(d) || d < 0 || d > 20 || !v.location) return null;
      const legalAge = e.ageRestrictions?.legalAgeEnforced === true;
      const cls = (e.classifications?.[0]?.segment?.name || '').toLowerCase();
      const price = e.priceRanges?.[0]?.min ?? 30;
      return {
        id: 'tm-' + e.id, name: v.name || 'Venue', title: e.name,
        cat: cls.includes('comedy') ? 'comedy' : 'music',
        age: legalAge ? '21+' : '18+', price: Math.round(price),
        priceLabel: e.priceRanges ? `$${Math.round(price)}–${Math.round(e.priceRanges[0].max)}` : 'See listing',
        hood: v.city?.name || 'NYC', boro: v.city?.name === 'Brooklyn' ? 'Brooklyn' : v.city?.name === 'Queens' ? 'Queens' : 'Manhattan',
        lat: +v.location.latitude, lng: +v.location.longitude, addr: v.address?.line1 || '',
        img: (e.images || []).sort((a,b)=>b.width-a.width)[0]?.url || '',
        schedule: { offsets: [d], start: start.toTimeString().slice(0,5), end: '23:59' },
        blurb: e.info || e.pleaseNote || 'Live listing from Ticketmaster.',
        src: legalAge ? 'Ticketmaster: legal age enforced' : 'Ticketmaster: legal age not enforced',
        gotIn: 0, link: e.url
      };
    }).filter(Boolean);
    res.status(200).json({ live: true, events });
  } catch (err) {
    res.status(200).json({ live: false, events: [], error: String(err) });
  }
}

# UNDR — NYC for the under-21

Verified 18+ things to do in NYC tonight. No fake ID needed.

## Run locally
Open `index.html` in a browser, or `python3 -m http.server 5173` and visit http://localhost:5173.

## Deploy (personal Vercel)
`npx vercel` in this folder. Optional: add env var `TM_API_KEY` (free at developer.ticketmaster.com)
and the header pill flips from SEED DATA to LIVE · TICKETMASTER, with each event's age policy
read from the Discovery API's `ageRestrictions.legalAgeEnforced` field.

## Free APIs used
- Leaflet + OpenStreetMap / CARTO basemap tiles (map)
- OpenStreetMap Nominatim (geocoding for "Add a spot")
- Ticketmaster Discovery API (live listings, optional)
- Browser Geolocation + Web Share APIs

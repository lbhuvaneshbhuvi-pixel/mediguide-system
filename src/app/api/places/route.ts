/**
 * API endpoint to fetch nearby doctors/hospitals using free Overpass API (OpenStreetMap)
 * Query params: lat, lng, type (e.g., "doctor", "hospital"), radius (meters)
 * No API key required - uses free Overpass API
 */

export const runtime = 'nodejs';

interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    operator?: string;
    phone?: string;
    'contact:phone'?: string;
    website?: string;
    opening_hours?: string;
  };
}

interface OverpassResponse {
  elements: OverpassNode[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const type = searchParams.get('type') || 'doctor';
  const radius = searchParams.get('radius') || '5000'; // 5 km default

  if (!lat || !lng) {
    return Response.json(
      { error: 'Missing lat/lng parameters' },
      { status: 400 }
    );
  }

  try {
    // Use Overpass API (free, no key needed) to fetch doctors/hospitals
    const radiusInDegrees = parseInt(radius) / 111000; // rough conversion to degrees

    // Use multiple public Overpass endpoints as fallbacks in case one is overloaded
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    // Build an Overpass query that requests JSON output explicitly.
    // Also search for multiple amenity types commonly used for doctors/clinics/hospitals.
    const bbox = `${parseFloat(lat) - radiusInDegrees},${parseFloat(lng) - radiusInDegrees},${parseFloat(lat) + radiusInDegrees},${parseFloat(lng) + radiusInDegrees}`;

    const overpassQuery = `[out:json][timeout:25];(node["amenity"~"doctors|clinic|hospital"](${bbox});way["amenity"~"doctors|clinic|hospital"](${bbox});relation["amenity"~"doctors|clinic|hospital"](${bbox}););out center;`;

    let lastError: any = null;
    let data: OverpassResponse | null = null;

    // Try endpoints sequentially with a small delay/backoff when failures occur
    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      try {
        const response = await fetch(url, {
          method: 'POST',
          body: overpassQuery,
          headers: { 'Content-Type': 'text/plain' },
        });

        // If server returned non-2xx, capture and try next endpoint
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          console.warn(`Overpass endpoint ${url} returned ${response.status}: ${text.substring(0, 200)}`);
          lastError = { status: response.status, body: text };
          // small backoff before trying next endpoint
          await new Promise((r) => setTimeout(r, 300 * (i + 1)));
          continue;
        }

        // Inspect content-type. Even successful responses may be XML/HTML error pages.
        const contentType = response.headers.get('content-type') || '';
        if (!/json/i.test(contentType)) {
          // Try parse as text to surface server error message
          const text = await response.text().catch(() => '');
          // If the body looks like XML/HTML, treat it as an error and try next endpoint
          if (text.trim().startsWith('<') || /xml|html/i.test(contentType)) {
            console.warn(`Overpass endpoint ${url} returned non-JSON content; trying next. Snippet:`, text.substring(0, 300));
            lastError = { status: response.status, body: text };
            await new Promise((r) => setTimeout(r, 300 * (i + 1)));
            continue;
          }
        }

        // Parse JSON safely
        try {
          const parsed: OverpassResponse = await response.json();
          data = parsed;
          break;
        } catch (err) {
          const text = await response.text().catch(() => '');
          console.warn(`Failed to parse JSON from ${url}. Snippet:`, text.substring(0, 300));
          lastError = { parseError: err, body: text };
          await new Promise((r) => setTimeout(r, 300 * (i + 1)));
          continue;
        }
      } catch (err) {
        console.warn(`Error calling Overpass endpoint ${url}:`, err);
        lastError = err;
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
    }

    if (!data) {
      console.error('Overpass API error (all endpoints failed):', lastError);
      return Response.json({ error: 'Overpass API error or timeout' }, { status: 502 });
    }

    // Transform results
    // Elements may be nodes (with lat/lon) or ways/relations (with center)
    const results = data.elements
      .map((el) => {
        const name = el.tags?.name;
        if (!name) return null; // skip unnamed

        // get coordinates: prefer node lat/lon, otherwise use center if present
        let latNum = (el as any).lat;
        let lonNum = (el as any).lon;
        if ((!latNum || !lonNum) && (el as any).center) {
          latNum = (el as any).center.lat;
          lonNum = (el as any).center.lon;
        }
        if (!latNum || !lonNum) return null;

        const phone = el.tags?.phone || el.tags?.['contact:phone'] || null;

        return {
          name: name,
          address: `Lat: ${latNum.toFixed(4)}, Lng: ${lonNum.toFixed(4)}`,
          phone: phone || null,
          lat: latNum,
          lng: lonNum,
          rating: null,
          openNow: el.tags?.opening_hours || null,
          types: [el.tags?.amenity || type],
          website: el.tags?.website || null,
          operator: el.tags?.operator || null,
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    return Response.json({ results, status: results.length > 0 ? 'OK' : 'ZERO_RESULTS' });
  } catch (error) {
    console.error('Places API fetch error:', error);
    return Response.json(
      { error: 'Failed to fetch nearby places' },
      { status: 500 }
    );
  }
}

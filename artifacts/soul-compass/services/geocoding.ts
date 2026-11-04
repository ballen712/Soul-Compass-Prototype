export type HomeCitySearchResult = {
  city: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

type OpenMeteoLocation = {
  name?: unknown;
  country?: unknown;
  admin1?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
};

function isIanaTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * City lookup provider boundary. Only the city string supplied by the user is
 * sent as search data; this service never reads device location or profile data.
 * Open-Meteo supplies coordinates and a time-zone-database (IANA) identifier.
 */
export async function searchHomeCities(cityName: string): Promise<HomeCitySearchResult[]> {
  const name = cityName.trim();
  if (name.length < 2) return [];

  const params = new URLSearchParams({ name, count: '8', language: 'en', format: 'json' });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) throw new Error('City search is temporarily unavailable.');

  const data = (await response.json()) as { results?: OpenMeteoLocation[] };
  return (data.results ?? []).flatMap((entry) => {
    if (
      typeof entry.name !== 'string' ||
      typeof entry.country !== 'string' ||
      typeof entry.latitude !== 'number' ||
      !Number.isFinite(entry.latitude) ||
      typeof entry.longitude !== 'number' ||
      !Number.isFinite(entry.longitude) ||
      !isIanaTimeZone(entry.timezone)
    ) {
      return [];
    }

    return [{
      city: entry.name,
      country: entry.country,
      ...(typeof entry.admin1 === 'string' && entry.admin1 ? { admin1: entry.admin1 } : {}),
      latitude: entry.latitude,
      longitude: entry.longitude,
      timeZone: entry.timezone,
    }];
  });
}

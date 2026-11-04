import { searchCities, type CityLocation } from '@workspace/api-client-react';

export type HomeCitySearchResult = CityLocation;

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
 * Geoapify supplies coordinates and an IANA identifier through our API.
 * Provider credentials and provider URLs are never included in client requests.
 */
export async function searchHomeCities(cityName: string, signal?: AbortSignal): Promise<HomeCitySearchResult[]> {
  const name = cityName.trim();
  if (name.length < 2) return [];
  if (name.length > 100) throw new Error('Use a city name of 100 characters or fewer.');

  let data;
  try { data = await searchCities({ q: name }, { signal }); }
  catch (error) {
    if (signal?.aborted) throw error;
    const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
    throw new Error(status === 429 ? 'City search limit reached. Please wait and try again.'
      : 'City search is temporarily unavailable. Please try again.');
  }
  if (!Array.isArray(data.results)) throw new Error('Unexpected city search response.');
  return data.results.slice(0, 8).flatMap((entry) => {
    if (
      !entry ||
      typeof entry.city !== 'string' ||
      !entry.city.trim() ||
      typeof entry.country !== 'string' ||
      !entry.country.trim() ||
      typeof entry.latitude !== 'number' ||
      !Number.isFinite(entry.latitude) ||
      Math.abs(entry.latitude) > 90 ||
      typeof entry.longitude !== 'number' ||
      !Number.isFinite(entry.longitude) ||
      Math.abs(entry.longitude) > 180 ||
      !isIanaTimeZone(entry.timeZone)
    ) {
      return [];
    }

    return [{
      city: entry.city,
      country: entry.country,
      ...(typeof entry.admin1 === 'string' && entry.admin1 ? { admin1: entry.admin1 } : {}),
      latitude: entry.latitude,
      longitude: entry.longitude,
      timeZone: entry.timeZone,
    }];
  });
}

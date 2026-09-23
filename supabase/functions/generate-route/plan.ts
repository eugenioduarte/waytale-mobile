/**
 * Route generation — pure planning logic, shared by the Edge Function handler and its tests.
 *
 * Given where the traveller is, what interests them, how long they have and how much they
 * tolerate detours, pick an ordered set of nearby places that fits the time budget.
 */

export type Coordinates = { latitude: number; longitude: number };

export type RouteRequest = {
  origin: Coordinates;
  interests: string[];
  /** Total time budget, walking + listening at each stop. */
  maxMinutes: number;
  /** 0 = "direto" (stay close, straight line), 1 = "sem pressa" (wander further for interests). */
  deviationTolerance: number;
};

export type Candidate = Coordinates & {
  placeId: string;
  name: string;
  themes: string[];
};

export type PlannedStop = {
  placeId: string;
  name: string;
  position: number;
  walkMeters: number;
};

export type RoutePlan = {
  stops: PlannedStop[];
  distanceMeters: number;
  durationMinutes: number;
};

export class InvalidRouteRequest extends Error {}

/** A `places` row with the themes of the routes that stop there (the catalog query's shape). */
export type PlaceRow = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  stops: { routes: { theme: string | null } | null }[] | null;
};

/** Upper bound on places loaded per request; the search box keeps real requests well below it. */
export const MAX_CANDIDATES = 500;

const WALKING_METERS_PER_MINUTE = 80;
const MINUTES_PER_STOP = 5;
const MAX_STOPS = 12;
const EARTH_RADIUS_METERS = 6_371_000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validates an untrusted request body; throws `InvalidRouteRequest` with the first problem. */
export function parseRouteRequest(body: unknown): RouteRequest {
  if (typeof body !== 'object' || body === null)
    throw new InvalidRouteRequest('body must be an object');
  const { origin, interests, maxMinutes, deviationTolerance } = body as Record<string, unknown>;

  if (typeof origin !== 'object' || origin === null)
    throw new InvalidRouteRequest('origin is required');
  const { latitude, longitude } = origin as Record<string, unknown>;
  if (!isFiniteNumber(latitude) || latitude < -90 || latitude > 90) {
    throw new InvalidRouteRequest('origin.latitude must be between -90 and 90');
  }
  if (!isFiniteNumber(longitude) || longitude < -180 || longitude > 180) {
    throw new InvalidRouteRequest('origin.longitude must be between -180 and 180');
  }
  if (
    !Array.isArray(interests) ||
    !interests.every((item) => typeof item === 'string' && item.length <= 64) ||
    interests.length > 20
  ) {
    throw new InvalidRouteRequest('interests must be a list of up to 20 strings of 64 chars');
  }
  if (
    !isFiniteNumber(maxMinutes) ||
    !Number.isInteger(maxMinutes) ||
    maxMinutes < 10 ||
    maxMinutes > 480
  ) {
    throw new InvalidRouteRequest('maxMinutes must be a whole number between 10 and 480');
  }
  const tolerance = deviationTolerance ?? 0.5;
  if (!isFiniteNumber(tolerance) || tolerance < 0 || tolerance > 1) {
    throw new InvalidRouteRequest('deviationTolerance must be between 0 and 1');
  }

  return {
    origin: { latitude, longitude },
    interests: interests.map((item) => item.trim().toLowerCase()).filter(Boolean),
    maxMinutes,
    deviationTolerance: tolerance,
  };
}

/** Places with coordinates become candidates carrying their routes' distinct themes. */
export function toCandidates(rows: PlaceRow[]): Candidate[] {
  const candidates: Candidate[] = [];
  for (const row of rows) {
    if (row.latitude === null || row.longitude === null) continue;
    const themes = new Set<string>();
    for (const stop of row.stops ?? []) {
      if (stop.routes?.theme) themes.add(stop.routes.theme);
    }
    candidates.push({
      placeId: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      themes: [...themes],
    });
  }
  return candidates;
}

/** Great-circle distance in meters (haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function interestScore(candidate: Candidate, interests: string[]): number {
  if (interests.length === 0) return 0;
  const themes = candidate.themes.map((theme) => theme.toLowerCase());
  return interests.filter((interest) => themes.includes(interest)).length;
}

/**
 * How far from the origin a stop may be: half the walkable budget, scaled from 50% ("direto") to
 * 100% ("sem pressa") by the deviation tolerance.
 */
export function searchRadiusMeters(request: RouteRequest): number {
  return (
    ((request.maxMinutes * WALKING_METERS_PER_MINUTE) / 2) * (0.5 + request.deviationTolerance / 2)
  );
}

export type Bounds = {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
};

/**
 * Lat/lng box enclosing the search radius, so the catalog query only loads nearby places. The box
 * is a superset of the circle; `planRoute` still applies the exact distance.
 */
export function searchBounds(request: RouteRequest): Bounds {
  const radius = searchRadiusMeters(request);
  const latitudeDelta = (radius / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const cosLatitude = Math.cos((request.origin.latitude * Math.PI) / 180);
  // Near the poles the longitude span blows up; fall back to the whole range.
  const longitudeDelta = cosLatitude < 1e-6 ? 180 : latitudeDelta / cosLatitude;
  return {
    minLatitude: Math.max(-90, request.origin.latitude - latitudeDelta),
    maxLatitude: Math.min(90, request.origin.latitude + latitudeDelta),
    minLongitude: Math.max(-180, request.origin.longitude - longitudeDelta),
    maxLongitude: Math.min(180, request.origin.longitude + longitudeDelta),
  };
}

/**
 * Greedy walk: from the current point, go to the candidate with the best distance/interest
 * trade-off, while the remaining budget covers the walk plus listening time. A higher
 * `deviationTolerance` makes interest matches worth a longer detour.
 */
export function planRoute(request: RouteRequest, candidates: Candidate[]): RoutePlan {
  const maxRadius = searchRadiusMeters(request);
  // At full tolerance one interest match makes a stop worth walking up to 6x further for.
  const detourWeight = 0.5 + request.deviationTolerance * 4.5;

  const remaining = candidates.filter(
    (candidate) => distanceMeters(request.origin, candidate) <= maxRadius,
  );
  const stops: PlannedStop[] = [];
  let current: Coordinates = request.origin;
  let minutesLeft = request.maxMinutes;
  let totalMeters = 0;

  while (remaining.length > 0 && stops.length < MAX_STOPS) {
    let bestIndex = -1;
    let bestCost = Number.POSITIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index]!;
      const cost =
        distanceMeters(current, candidate) /
        (1 + detourWeight * interestScore(candidate, request.interests));
      // Ties break on placeId so the same request always yields the same route.
      if (
        cost < bestCost ||
        (cost === bestCost && candidate.placeId < remaining[bestIndex]!.placeId)
      ) {
        bestCost = cost;
        bestIndex = index;
      }
    }

    const next = remaining[bestIndex]!;
    const walk = distanceMeters(current, next);
    const minutesNeeded = walk / WALKING_METERS_PER_MINUTE + MINUTES_PER_STOP;
    remaining.splice(bestIndex, 1);
    if (minutesNeeded > minutesLeft) continue;

    stops.push({
      placeId: next.placeId,
      name: next.name,
      position: stops.length,
      walkMeters: Math.round(walk),
    });
    minutesLeft -= minutesNeeded;
    totalMeters += walk;
    current = next;
  }

  return {
    stops,
    distanceMeters: Math.round(totalMeters),
    durationMinutes: Math.ceil(request.maxMinutes - minutesLeft),
  };
}

// Edge Function: generate a walking route around the traveller.
//
// POST { origin: { latitude, longitude }, interests: string[], maxMinutes, deviationTolerance? }
// → 200 { stops, distanceMeters, durationMinutes } | 400 { error } | 405
//
// `auth: 'user'` requires a signed-in user's JWT, and `ctx.supabase` runs with that user's
// permissions, so the catalog query goes through the same RLS as the app (never the service role).
import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

import {
  InvalidRouteRequest,
  MAX_CANDIDATES,
  type PlaceRow,
  parseRouteRequest,
  planRoute,
  searchBounds,
  toCandidates,
} from './plan.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }

    let request;
    try {
      request = parseRouteRequest(await req.json());
    } catch (error) {
      const message =
        error instanceof InvalidRouteRequest ? error.message : 'body must be valid JSON';
      return Response.json({ error: message }, { status: 400 });
    }

    // Only places inside the search box, bounded — never the whole catalog (PostgREST would
    // silently truncate it at `max_rows`).
    const bounds = searchBounds(request);
    const { data, error } = await ctx.supabase
      .from('places')
      .select('id, name, latitude, longitude, stops(routes(theme))')
      .gte('latitude', bounds.minLatitude)
      .lte('latitude', bounds.maxLatitude)
      .gte('longitude', bounds.minLongitude)
      .lte('longitude', bounds.maxLongitude)
      .limit(MAX_CANDIDATES);
    if (error) {
      console.error('generate-route: catalog query failed', error.message);
      return Response.json({ error: 'could not load places' }, { status: 500 });
    }

    return Response.json(planRoute(request, toCandidates((data ?? []) as unknown as PlaceRow[])));
  }),
};

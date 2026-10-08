/**
 * Product analytics events (EPIC-01.12) and their parameters. Only these can be tracked: a new
 * event is added here first, so the dashboard and the code agree on names. Firebase limits: event
 * names ≤ 40 chars, snake_case; parameter values strings or numbers. No personal data in params
 * (no emails, no free text) — ids and measures only.
 */
export type AnalyticsEvents = {
  /** A walk began on a route. */
  route_started: { route_id: string };
  /** A story's audio started playing. */
  story_played: { audio_id: string };
  /** A walk reached its end. */
  journey_completed: { journey_id: string; route_id: string; duration_minutes: number };
  /** A place was saved for later. */
  place_saved: { place_id: string };
};

export type AnalyticsEventName = keyof AnalyticsEvents;

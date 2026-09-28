# Runtime checklist

## Behavior

- Verify applicable initial, loading, populated, empty, error, retry, disabled, offline, and success states.
- Verify back behavior, deep links, keyboard dismissal, and interrupted or repeated actions.
- Check double taps, stale queries, reconnects, and background/foreground transitions.

## Platform and accessibility

- Check safe areas, system bars, keyboard avoidance, permissions, and Android/iOS differences.
- Prefer semantic roles, labels, hints, values, and stable IDs over coordinates.
- Respect reduced motion, dynamic text, contrast, and minimum touch targets.

## Performance and lifecycle

- Use virtualized lists for unbounded data.
- Inspect re-renders and frame health before adding memoization.
- Clean up timers, listeners, subscriptions, pending requests, and animation callbacks.

## Evidence

- Record platform, build, exact steps, and observed result.
- Retain the smallest useful assertion, screenshot, focused log, trace, or performance sample.
- State explicitly when runtime verification was unavailable.

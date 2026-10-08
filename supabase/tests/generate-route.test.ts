import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type Candidate,
  distanceMeters,
  InvalidRouteRequest,
  parseRouteRequest,
  planRoute,
  searchBounds,
  searchRadiusMeters,
  toCandidates,
} from '../functions/generate-route/plan.ts';

const COMERCIO = { latitude: 38.7078, longitude: -9.1366 };

const candidates: Candidate[] = [
  {
    placeId: 'arco',
    name: 'Arco da Rua Augusta',
    latitude: 38.7088,
    longitude: -9.1368,
    themes: ['história'],
  },
  {
    placeId: 'chiado',
    name: 'Chiado',
    latitude: 38.7109,
    longitude: -9.1409,
    themes: ['literatura'],
  },
  {
    placeId: 'se',
    name: 'Sé de Lisboa',
    latitude: 38.7098,
    longitude: -9.1334,
    themes: ['história'],
  },
  {
    placeId: 'belem',
    name: 'Torre de Belém',
    latitude: 38.6916,
    longitude: -9.216,
    themes: ['história'],
  },
];

const baseRequest = {
  origin: COMERCIO,
  interests: [],
  maxMinutes: 60,
  deviationTolerance: 0.5,
};

describe('parseRouteRequest', () => {
  it('normalizes a valid body', () => {
    const request = parseRouteRequest({
      origin: COMERCIO,
      interests: [' História '],
      maxMinutes: 45,
    });
    assert.deepEqual(request, {
      origin: COMERCIO,
      interests: ['história'],
      maxMinutes: 45,
      deviationTolerance: 0.5,
    });
  });

  for (const [label, body] of [
    ['a non-object body', 'hello'],
    ['a missing origin', { interests: [], maxMinutes: 30 }],
    [
      'an out-of-range latitude',
      { origin: { latitude: 91, longitude: 0 }, interests: [], maxMinutes: 30 },
    ],
    ['a non-string interest', { origin: COMERCIO, interests: [1], maxMinutes: 30 }],
    ['a budget below 10 minutes', { origin: COMERCIO, interests: [], maxMinutes: 5 }],
    ['a fractional budget', { origin: COMERCIO, interests: [], maxMinutes: 10.5 }],
    ['an overlong interest', { origin: COMERCIO, interests: ['x'.repeat(65)], maxMinutes: 30 }],
    [
      'a tolerance above 1',
      {
        origin: COMERCIO,
        interests: [],
        maxMinutes: 30,
        deviationTolerance: 2,
      },
    ],
  ] as const) {
    it(`rejects ${label}`, () => {
      assert.throws(() => parseRouteRequest(body), InvalidRouteRequest);
    });
  }
});

describe('planRoute', () => {
  it('orders nearby stops and skips places beyond the walkable radius', () => {
    const plan = planRoute(baseRequest, candidates);
    assert.deepEqual(
      plan.stops.map((stop) => stop.placeId),
      ['arco', 'se', 'chiado'],
    );
    assert.ok(!plan.stops.some((stop) => stop.placeId === 'belem'));
    assert.deepEqual(
      plan.stops.map((stop) => stop.position),
      [0, 1, 2],
    );
  });

  it('never exceeds the time budget', () => {
    const plan = planRoute({ ...baseRequest, maxMinutes: 12 }, candidates);
    assert.ok(plan.durationMinutes <= 12);
    assert.equal(plan.stops.length, 1);
  });

  it('with a high tolerance, detours toward what the traveller likes', () => {
    const request = {
      ...baseRequest,
      interests: ['literatura'],
      deviationTolerance: 1,
    };
    assert.equal(planRoute(request, candidates).stops[0]!.placeId, 'chiado');
  });

  it('returns an empty plan when nothing is in reach', () => {
    const plan = planRoute(baseRequest, [candidates[3]!]);
    assert.deepEqual(plan, {
      stops: [],
      distanceMeters: 0,
      durationMinutes: 0,
    });
  });

  it('breaks exact ties by placeId, whatever the input order', () => {
    const twins: Candidate[] = [
      { placeId: 'b-twin', name: 'B', latitude: 38.7088, longitude: -9.1368, themes: [] },
      { placeId: 'a-twin', name: 'A', latitude: 38.7088, longitude: -9.1368, themes: [] },
    ];
    const first = (list: Candidate[]) => planRoute(baseRequest, list).stops[0]!.placeId;
    assert.equal(first(twins), 'a-twin');
    assert.equal(first([...twins].reverse()), 'a-twin');
  });

  it('is deterministic', () => {
    assert.deepEqual(
      planRoute(baseRequest, candidates),
      planRoute(baseRequest, [...candidates].reverse()),
    );
  });
});

describe('distanceMeters', () => {
  it('matches the known Comércio–Chiado distance (~550 m)', () => {
    const meters = distanceMeters(COMERCIO, candidates[1]!);
    assert.ok(meters > 450 && meters < 650, `got ${meters}`);
  });
});

describe('searchBounds', () => {
  it('encloses every point within the search radius', () => {
    const bounds = searchBounds(baseRequest);
    const radius = searchRadiusMeters(baseRequest);
    const north = { latitude: bounds.maxLatitude, longitude: COMERCIO.longitude };
    const east = { latitude: COMERCIO.latitude, longitude: bounds.maxLongitude };
    assert.ok(distanceMeters(COMERCIO, north) >= radius - 1);
    assert.ok(distanceMeters(COMERCIO, east) >= radius - 1);
  });

  it('keeps far places (Belém) out of the query box', () => {
    const bounds = searchBounds(baseRequest);
    const belem = candidates[3]!;
    assert.ok(belem.longitude < bounds.minLongitude);
  });
});

describe('toCandidates', () => {
  it('collects distinct route themes and skips places without coordinates', () => {
    const result = toCandidates([
      {
        id: 'p1',
        name: 'Chiado',
        latitude: 38.7109,
        longitude: -9.1409,
        stops: [
          { routes: { theme: 'literatura' } },
          { routes: { theme: 'literatura' } },
          { routes: { theme: null } },
          { routes: null },
        ],
      },
      { id: 'p2', name: 'Sem sítio', latitude: null, longitude: null, stops: [] },
    ]);
    assert.deepEqual(result, [
      {
        placeId: 'p1',
        name: 'Chiado',
        latitude: 38.7109,
        longitude: -9.1409,
        themes: ['literatura'],
      },
    ]);
  });
});

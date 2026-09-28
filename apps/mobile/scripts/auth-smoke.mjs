// Smoke test of email-code sign-in against the real Supabase project (01.5).
//
//   cd apps/mobile
//   node --env-file=.env.local scripts/auth-smoke.mjs you@example.com
//
// Reads EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the env file, asks
// Supabase for a code, prompts for it, and checks what a signed-in user can reach. Never prints
// tokens or keys. Creates the account on first run (that is the product flow).
import { createInterface } from 'node:readline/promises';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.argv[2]?.trim().toLowerCase();

if (!url || !key) {
  console.error(
    'Missing env: run with `node --env-file=.env.local scripts/auth-smoke.mjs <email>`',
  );
  process.exit(2);
}
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/auth-smoke.mjs <email>');
  process.exit(2);
}

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

// 1. Auth settings: email on, phone off, sign-up open.
const settings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } }).then((r) =>
  r.json(),
);
check('email provider on', settings.external?.email === true);
check('phone provider off', settings.external?.phone === false);
check('sign-up open', settings.disable_signup === false);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// 2. Request and verify the code.
const sent = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
check('code requested', !sent.error, sent.error ? `${sent.error.code}: ${sent.error.message}` : '');
if (sent.error) {
  console.log('\nIf the email never arrives, check Resend → Logs (unverified sender domain?).');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const code = (await rl.question(`Code sent to ${email} (6 digits): `)).trim();
rl.close();

const verified = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
const session = verified.data.session;
check(
  'code verified, session opened',
  !verified.error && Boolean(session),
  verified.error ? `${verified.error.code}: ${verified.error.message}` : '',
);
if (!session) process.exit(1);

// 3. Signed-in user reaches the catalog and their own tables (RLS + grants for `authenticated`).
for (const table of ['routes', 'places', 'saved_items', 'journeys', 'downloads']) {
  const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
  check(`authenticated reads ${table}`, !error, error ? `${error.code}: ${error.message}` : '');
}
const foreign = await supabase
  .from('saved_items')
  .select('user_id')
  .neq('user_id', session.user.id)
  .limit(1);
check(
  'no rows of other users visible in saved_items',
  !foreign.error && foreign.data.length === 0,
  foreign.error?.message ?? '',
);

// 4. generate-route: rejects anonymous calls, accepts the user's JWT.
const body = JSON.stringify({
  origin: { latitude: 38.7115, longitude: -9.1366 },
  interests: ['history'],
  maxMinutes: 60,
  deviationTolerance: 0.5,
});
const anon = await fetch(`${url}/functions/v1/generate-route`, {
  method: 'POST',
  headers: { apikey: key, 'Content-Type': 'application/json' },
  body,
});
check(
  'generate-route rejects no user JWT',
  [401, 403].includes(anon.status),
  `status ${anon.status}`,
);
const asUser = await fetch(`${url}/functions/v1/generate-route`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body,
});
check('generate-route accepts user JWT', asUser.status === 200, `status ${asUser.status}`);

// 5. Sign out revokes the session.
const out = await supabase.auth.signOut();
check('signed out', !out.error, out.error?.message ?? '');

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);

/**
 * App entry (EPIC-01.12): expo-router's entry, plus React Native Firebase's background message
 * handler, registered at startup so it also runs when a push wakes a killed app (no screen mounts
 * then, so it can't live in a layout).
 */
import 'expo-router/entry';

import { registerBackgroundMessageHandler } from '@/lib/firebase';

void registerBackgroundMessageHandler();

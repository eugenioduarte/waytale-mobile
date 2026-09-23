import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function WalkScreen() {
  return (
    <Screen title={copy.journey.walk} description={copy.journey.walkDescription}>
      <Action label={copy.journey.finish} onPress={() => router.push('/summary')} />
    </Screen>
  );
}

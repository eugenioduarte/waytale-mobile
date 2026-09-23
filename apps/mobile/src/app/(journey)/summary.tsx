import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function SummaryScreen() {
  return (
    <Screen title={copy.journey.summary} description={copy.journey.summaryDescription}>
      <Action label={copy.journey.done} onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}

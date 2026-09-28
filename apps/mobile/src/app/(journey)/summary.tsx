import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function SummaryScreen() {
  return (
    <Screen
      testID="screen-summary"
      title={copy.journey.summary}
      description={copy.journey.summaryDescription}
    >
      <Action
        testID="summary-done"
        label={copy.journey.done}
        onPress={() => router.dismissTo('/')}
      />
    </Screen>
  );
}

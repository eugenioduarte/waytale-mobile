import { Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function JourneysScreen() {
  return (
    <Screen
      testID="screen-journeys"
      title={copy.tabs.journeys}
      description={copy.screens.journeys}
    />
  );
}

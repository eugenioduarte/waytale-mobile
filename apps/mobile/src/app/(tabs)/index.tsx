import { Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function ExploreScreen() {
  return (
    <Screen testID="screen-explore" title={copy.tabs.explore} description={copy.screens.explore} />
  );
}

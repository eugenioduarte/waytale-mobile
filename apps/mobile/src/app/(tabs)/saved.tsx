import { Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function SavedScreen() {
  return <Screen title={copy.tabs.saved} description={copy.screens.saved} />;
}

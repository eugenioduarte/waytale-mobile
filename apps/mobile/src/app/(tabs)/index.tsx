import { Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function ExploreScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="screen-explore" title={t('tabs.explore')} description={t('screens.explore')} />
  );
}

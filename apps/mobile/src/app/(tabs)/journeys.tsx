import { Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function JourneysScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      testID="screen-journeys"
      title={t('tabs.journeys')}
      description={t('screens.journeys')}
    />
  );
}

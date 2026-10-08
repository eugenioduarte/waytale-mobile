import { Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function SavedScreen() {
  const { t } = useTranslation();
  return <Screen testID="screen-saved" title={t('tabs.saved')} description={t('screens.saved')} />;
}

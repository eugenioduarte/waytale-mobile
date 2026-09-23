import { Action, Screen } from '@/components/screen';
import { usePreviewSession } from '@/features/auth/preview-session';
import copy from '@/locales/pt.json';

export default function ProfileScreen() {
  const { exitPreview } = usePreviewSession();
  return (
    <Screen title={copy.tabs.profile} description={copy.screens.profile}>
      <Action label={copy.auth.exitPreview} onPress={exitPreview} secondary />
    </Screen>
  );
}

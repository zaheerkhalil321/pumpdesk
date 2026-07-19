import { Page } from "@/components/common/Page";
import { Typography } from "@/components/common/Typography";
import { GeneralSettings } from "@/app/(app)/settings/GeneralSettings";

export default function SettingsPage() {
  return (
    <Page>
      <Typography.H1>
        Settings
      </Typography.H1>

      <GeneralSettings />
    </Page>
  );
}
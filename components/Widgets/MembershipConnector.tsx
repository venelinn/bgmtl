import { getMembershipConfig } from "@/utils/content";
import { MembershipWidget } from "./Membership";

interface MembershipConnectorProps {
  locale: string;
  preview?: boolean;
}

/** Server component: fetches the Membership widget config from Contentful and renders it. */
export async function MembershipConnector({ locale, preview }: MembershipConnectorProps) {
  const config = await getMembershipConfig(locale, preview);

  if (!config || !config.tiers?.length || !config.hostedButtonId) return null;

  return <MembershipWidget {...config} />;
}

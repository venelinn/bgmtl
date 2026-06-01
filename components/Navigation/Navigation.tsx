// components/Navigation/Navigation.tsx
import { NavigationInner } from "./NavigationInner";

type NavigationProps = {
  pageLocale: string;
  data?: any;
};

export default async function Navigation({ pageLocale, data }: NavigationProps) {
  return <NavigationInner pageLocale={pageLocale} data={data} />;
}

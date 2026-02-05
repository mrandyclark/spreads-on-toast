import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

import { DashboardClient } from './dashboard-client';

export default async function Dashboard() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  // Pass minimal user info from Kinde session - no DB call needed for UI
  const user = {
    email: kindeUser?.email ?? undefined,
    id: kindeUser?.id ?? '',
    nameFirst: kindeUser?.given_name ?? undefined,
    nameLast: kindeUser?.family_name ?? undefined,
  };

  return <DashboardClient user={user} />;
}

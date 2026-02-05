import { redirect } from 'next/navigation';

import { DashboardClient } from './dashboard-client';

import { getAuthUser } from '@/lib/auth';

export default async function Dashboard() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/');
  }

  return <DashboardClient user={user} />;
}

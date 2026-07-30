import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';

export const metadata = { title: 'Dashboard — boss' };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect('/login?next=/dashboard');

  const user = data.user;
  const meta = user.user_metadata ?? {};

  return (
    <DashboardClient
      initialUser={{
        id: user.id,
        email: user.email ?? '',
        displayName: meta.full_name ?? meta.name ?? null,
        avatarUrl: meta.avatar_url ?? meta.picture ?? null,
        providers: (user.identities ?? []).map((i) => i.provider),
      }}
    />
  );
}

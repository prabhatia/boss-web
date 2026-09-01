import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminModerationClient } from './AdminModerationClient';

export const metadata = { title: 'Moderation — boss' };

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

export default async function AdminPage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect('/login?next=/admin');

  // platform_role lives in app_metadata (Supabase Admin API only — never
  // user-editable), same field JwtService.parsePlatformRole reads server-side.
  const role = (data.user.app_metadata as { platform_role?: string })?.platform_role;
  if (!role || !ADMIN_ROLES.has(role)) redirect('/dashboard');

  return <AdminModerationClient isSuperAdmin={role === 'SUPERADMIN'} />;
}

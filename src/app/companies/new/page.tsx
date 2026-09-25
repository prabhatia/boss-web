import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewCompanyClient } from './NewCompanyClient';

export const metadata = { title: 'Add your company — boss' };

// Mirrors company-service's CompanyController: POST /api/companies requires
// hasAnyRole('ENTERPRISE','ADMIN') — SUPERADMIN implies ADMIN (see auth-service's
// SecurityConfig), so it's included here too.
const ALLOWED_ROLES = new Set(['ENTERPRISE', 'ADMIN', 'SUPERADMIN']);

export default async function NewCompanyPage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect('/login?next=/companies/new');

  // platform_role lives in app_metadata (Supabase Admin API only — never
  // user-editable), same field JwtService.parsePlatformRole reads server-side.
  const role = (data.user.app_metadata as { platform_role?: string })?.platform_role;
  if (!role || !ALLOWED_ROLES.has(role)) redirect('/companies');

  return <NewCompanyClient />;
}

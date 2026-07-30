import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { CompaniesClient } from './CompaniesClient';

export const metadata = {
  title: 'Company ratings — boss',
  description: 'Culture, management, compensation, growth, and diversity scores from verified employees.',
};

export default async function CompaniesPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <Nav signedIn={!!data.user} />
      <CompaniesClient />
      <Footer />
    </>
  );
}

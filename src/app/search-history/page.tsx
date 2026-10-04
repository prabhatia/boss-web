import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { SearchHistoryClient } from './SearchHistoryClient';

export const metadata = {
  title: 'Search history — boss',
  description: 'Your past searches on People and Companies.',
};

export default async function SearchHistoryPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <Nav signedIn={!!data.user} />
      <SearchHistoryClient />
      <Footer />
    </>
  );
}

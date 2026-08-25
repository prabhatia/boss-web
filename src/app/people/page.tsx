import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { PeopleClient } from './PeopleClient';

export const metadata = {
  title: 'People — boss',
  description: 'Search managers by name and see their ratings, across every company.',
};

export default async function PeoplePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <Nav signedIn={!!data.user} />
      <PeopleClient />
      <Footer />
    </>
  );
}

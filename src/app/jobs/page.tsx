import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { JobsClient } from './JobsClient';

export const metadata = {
  title: 'Jobs — boss',
  description: 'Jobs matched to the workplace values you actually rate highly.',
};

export default async function JobsPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <Nav signedIn={!!data.user} />
      <JobsClient signedIn={!!data.user} />
      <Footer />
    </>
  );
}

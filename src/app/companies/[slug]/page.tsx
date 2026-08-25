import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { CompanyDetailClient } from './CompanyDetailClient';

export default async function CompanyDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <Nav signedIn={!!data.user} />
      <CompanyDetailClient slug={params.slug} />
      <Footer />
    </>
  );
}

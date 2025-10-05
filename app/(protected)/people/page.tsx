import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PeopleSearchInterface } from './components';

export default async function PeoplePage() {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch initial users (most recent or popular)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, bio, avatar_url, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching users:', error);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PeopleSearchInterface 
        initialUsers={users || []} 
        currentUserId={user.id}
      />
    </div>
  );
}

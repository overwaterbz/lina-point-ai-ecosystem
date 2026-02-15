import { createServerSupabaseClient } from '@/lib/supabase-server';
import ProfileForm from '@/components/ProfileForm';
import { updateProfileAction } from '@/app/dashboard/profile/actions';

export const metadata = {
  title: 'Onboarding',
};

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p>Unauthorized</p>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Welcome to Lina Point</h1>
      <p className="text-gray-600 mb-6">
        Set your preferences and enable agent permissions to personalize your experience.
      </p>
      <div className="bg-white p-6 rounded shadow">
        <ProfileForm action={updateProfileAction} initial={profile} />
      </div>
    </div>
  );
}

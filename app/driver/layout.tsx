import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/auth';

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/driver');
  }

  const profile = await getUserProfile(userId);

  if (!profile) {
    redirect('/onboarding');
  }

  if (profile.role !== 'logistics_driver') {
    if (profile.role === 'farmer') redirect('/farmer');
    if (profile.role === 'wholesaler') redirect('/wholesaler');
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-paper pb-20">
      {children}
    </div>
  );
}
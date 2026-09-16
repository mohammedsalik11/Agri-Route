import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const cookieStore = await cookies();
  const role =
    (sessionClaims?.publicMetadata as { role?: string })?.role ||
    cookieStore.get('userRole')?.value;

  if (!role) {
    redirect('/onboarding');
  }

  if (role !== 'farmer') {
    redirect('/wholesaler');
  }

  return <>{children}</>;
}

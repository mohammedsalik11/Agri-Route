import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-field-green">Agri Route</h1>
        <p className="text-xs text-ink-muted mt-1">Sign in with Phone &amp; SMS OTP</p>
      </div>

      <div className="w-full max-w-md bg-white p-4 rounded-2xl shadow-xs border border-border flex justify-center">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/auth-callback"
        />
      </div>
    </div>
  );
}

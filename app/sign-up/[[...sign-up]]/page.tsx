import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-field-green">Agri Route</h1>
        <p className="text-xs text-ink-muted mt-1">Create an Account with Phone &amp; SMS OTP</p>
      </div>

      <div className="w-full max-w-md bg-white p-4 rounded-2xl shadow-xs border border-border flex justify-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding"
        />
      </div>

      <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center max-w-md w-full">
        <p className="text-xs font-semibold text-amber-900">Demo Quick Access</p>
        <p className="text-[11px] text-amber-800">
          Phone: <code className="bg-white px-1 py-0.5 rounded font-bold">+91 9999999999</code> · OTP: <code className="bg-white px-1 py-0.5 rounded font-bold">424242</code>
        </p>
      </div>
    </div>
  );
}

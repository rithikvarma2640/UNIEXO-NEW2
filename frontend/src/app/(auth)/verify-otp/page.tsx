'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on Backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setLoading(true);
    setError('');
    
    try {
      // Connect to backend API:
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpValue,
        purpose: searchParams.get('purpose') || 'email-verify' // or 'signup', 'password-reset'
      });
      
      // Successfully verified
      if (searchParams.get('purpose') === 'signup' && response.data?.data?.accessToken) {
        // Automatically log in the user
        useAuthStore.getState().login(response.data.data.user, response.data.data.accessToken);
        router.push('/dashboard');
      } else {
        router.push('/login?verified=true');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { 
        email, 
        purpose: searchParams.get('purpose') || 'email-verify' 
      });
      // Optionally show a success toast here
      console.log('OTP Resent');
    } catch (err: any) {
      console.error('Failed to resend OTP', err);
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-2xl sm:px-10 border text-center">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 sm:gap-4 mb-8">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-background focus:ring-2 focus:ring-primary focus-visible:ring-primary shadow-sm"
                />
              ))}
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium mb-4">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold mb-4"
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>

            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Resend
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}

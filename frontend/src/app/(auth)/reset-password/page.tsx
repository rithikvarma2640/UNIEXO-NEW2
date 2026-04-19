'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { AuthRedirectWrapper } from '@/components/auth-redirect-wrapper';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
  });

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/reset-password', formData);
      toast.success('Password reset successfully! Please login with your new password.');
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card py-8 px-4 shadow sm:rounded-2xl sm:px-10 border">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            readOnly
            disabled
            className="h-11 bg-muted"
            value={formData.email}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">Reset OTP</Label>
          <Input
            id="otp"
            name="otp"
            type="text"
            required
            className="h-11 tracking-widest text-center text-lg"
            placeholder="000000"
            maxLength={6}
            value={formData.otp}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            className="h-11"
            placeholder="••••••••"
            value={formData.newPassword}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm font-medium">{error}</div>
        )}

        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthRedirectWrapper>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter the OTP sent to your email and your new password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="text-center py-8">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
      </div>
    </AuthRedirectWrapper>
  );
}

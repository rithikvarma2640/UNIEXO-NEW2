'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Building, CheckCircle2, Eye, EyeOff, LocateFixed } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthRedirectWrapper } from '@/components/auth-redirect-wrapper';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'user' | 'vendor'>('user'); // Also fix the role casing here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    universityId: '',
    location: '',
    businessName: '',
    serviceType: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole: 'user' | 'vendor') => {
    setRole(newRole);
  };

  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      setError('');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Using OpenStreetMap's Nominatim API for reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            if (data && data.address) {
              const address = data.address;
              const city = address.city || address.town || address.village || address.state_district;
              const state = address.state;
              const country = address.country;
              
              const displayLocation = [city, state, country].filter(Boolean).join(', ');
              
              setFormData(prev => ({ 
                ...prev, 
                location: displayLocation || `${latitude}, ${longitude}` 
              }));
            } else {
              setFormData(prev => ({ 
                ...prev, 
                location: `${latitude}, ${longitude}` 
              }));
            }
          } catch (err) {
            console.error('Failed to reverse geocode', err);
            // Fallback to coordinates
            setFormData(prev => ({ 
              ...prev, 
              location: `${latitude}, ${longitude}` 
            }));
          }
        },
        (error) => {
          console.error('Geolocation permission denied or error', error);
          setError('Could not fetch location. Please allow location permissions or type it manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role,
      };

      if (role === 'user') {
        payload.universityId = formData.universityId;
        payload.location = formData.location;
      } else if (role === 'vendor') {
        payload.businessName = formData.businessName;
        payload.serviceType = formData.serviceType;
      }

      // Connect to backend API:
      await api.post('/auth/signup', payload);
      // Redirect to OTP verification after successful signup
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=signup`);
    } catch (err: any) {
      console.error('Signup Error:', err);
      // Backend returns errors in err.response.data.message
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || err.message || 'Something went wrong during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthRedirectWrapper>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Or{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-2xl sm:px-10 border">
          
          <div className="mb-8 flex space-x-4">
            <button
              type="button"
              onClick={() => handleRoleChange('user')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                role === 'user' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-border hover:border-border/80 text-muted-foreground'
              }`}
            >
              <CheckCircle2 className={`w-6 h-6 mb-2 ${role === 'user' ? 'opacity-100' : 'opacity-0 hidden'}`} />
              <span className="font-semibold">General User</span>
              <span className="text-xs text-center mt-1">Rent & Buy</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('vendor')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                role === 'vendor' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-border hover:border-border/80 text-muted-foreground'
              }`}
            >
              <div className="flex space-x-1 mb-2">
                <Car className="w-5 h-5" />
                <Building className="w-5 h-5" />
              </div>
              <span className="font-semibold">Vendor</span>
              <span className="text-xs text-center mt-1">List & Sell</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                className="h-11"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-11"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                className="h-11"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {role === 'user' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="universityId">University ID</Label>
                  <Input
                    id="universityId"
                    name="universityId"
                    type="text"
                    required
                    className="h-11"
                    placeholder="E.g. 21BCE102"
                    value={formData.universityId}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-end">
                    <Label htmlFor="location">Current Location</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={fetchLocation}
                      className="h-6 text-xs px-2 text-primary"
                    >
                      <LocateFixed className="w-3 h-3 mr-1" />
                      Auto-fill my location
                    </Button>
                  </div>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    required
                    className="h-11 w-full"
                    placeholder="Allow location or type manually"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {role === 'vendor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    className="h-11"
                    placeholder="Your Business Name"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Primary Service</Label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    required
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={formData.serviceType}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select service domain</option>
                    <option value="CAR">Car Rental</option>
                    <option value="ROOM">Room Rental (PG)</option>
                    <option value="LAUNDRY">Laundry Service</option>
                    <option value="FOOD">Food Service</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-4 pb-2">
              <div className="space-y-2 relative">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="h-11 pr-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  At least 8 characters, with uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="h-11 pr-10"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm font-medium pt-2">{error}</div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </AuthRedirectWrapper>
  );
}


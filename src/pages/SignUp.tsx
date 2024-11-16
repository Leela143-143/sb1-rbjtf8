import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ref, get } from 'firebase/database';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { UserPlus, ArrowLeft } from 'lucide-react';

interface Community {
  name: string;
  logoUrl: string;
  currentCount: number;
  maxCapacity: number;
  countries: Record<string, string>;
}

export function SignUp() {
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get('community');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [communityData, setCommunityData] = useState<Community | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!communityId) {
      navigate('/communities');
      return;
    }

    const fetchCommunityData = async () => {
      try {
        const communityRef = ref(db, `communities/${communityId}`);
        const communitySnapshot = await get(communityRef);
        
        if (!communitySnapshot.exists()) {
          toast.error('Community not found');
          navigate('/communities');
          return;
        }

        const data = communitySnapshot.val();
        setCommunityData({
          name: data.name,
          logoUrl: data.logoUrl,
          currentCount: data.currentCount || 0,
          maxCapacity: data.maxCapacity,
          countries: data.countries || {}
        });

        // Get available countries (those with empty strings)
        const availableCountries = Object.entries(data.countries || {})
          .filter(([_, userId]) => userId === "")
          .map(([country]) => country);

        if (availableCountries.length === 0) {
          toast.error('No countries available in this community');
          navigate('/communities');
        }

        setAvailableCountries(availableCountries);
      } catch (error) {
        console.error('Error fetching community data:', error);
        toast.error('Failed to load community data');
        navigate('/communities');
      }
    };

    fetchCommunityData();
  }, [communityId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!communityId || !communityData) {
      toast.error('Invalid community selection');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!country) {
      toast.error('Please select a country');
      return;
    }

    if (communityData.currentCount >= communityData.maxCapacity) {
      toast.error('This community is full');
      return;
    }

    if (!availableCountries.includes(country)) {
      toast.error('Selected country is no longer available');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, name, communityId, country);
      toast.success('Verification email sent. Please check your inbox.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <Link to="/communities" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Communities
          </Link>
          <div className="flex justify-center">
            <UserPlus className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create an account</h2>
          {communityData && (
            <p className="mt-2 text-gray-600">Joining: {communityData.name}</p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Countries
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a country</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" isLoading={isLoading}>
            Create Account
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
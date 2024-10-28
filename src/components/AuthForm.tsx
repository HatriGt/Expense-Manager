import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  // Add error state
  const [error, setError] = useState<string | null>(null);
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin // Add redirect URL
          }
        });

        if (signUpError) throw signUpError;
        
        if (data?.user) {
          // Show success message for email verification
          setError('Please check your email to verify your account!');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (signInError) throw signInError;
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-center mb-8">
          <img src="/monety-logo.png" alt="Monety" className="h-8" />
        </div>

        {/* Add error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
              placeholder="Enter your email"
              aria-label="Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
              placeholder="Enter your password"
              aria-label="Password"
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            disabled={isLoading}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isLoading 
              ? 'Loading...' 
              : (isSignUp ? 'Sign Up' : 'Sign In')
            }
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-indigo-600 hover:text-indigo-500"
            type="button"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

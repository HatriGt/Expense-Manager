import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountrySelector from './CountrySelector';

interface PasswordCriteria {
  hasLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
  });

  const validatePassword = (value: string) => {
    setPasswordCriteria({
      hasLength: value.length >= 8,
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  useEffect(() => {
    validatePassword(password);
  }, [password]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-digit characters
    const cleaned = e.target.value.replace(/\D/g, '');
    // Limit to 10 digits
    const truncated = cleaned.slice(0, 10);
    setPhone(truncated);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!isPasswordValid) {
          throw new Error('Please meet all password requirements');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone,
              country_code: countryCode,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setError('Success! Please check your email to confirm your account.');
          // Clear form
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
          setPhone('');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password
        });

        if (signInError) throw signInError;
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Auth error:', err);
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const CriteriaItem = ({ met, label }: { met: boolean; label: string }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center space-x-2"
    >
      {met ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm ${met ? 'text-green-600' : 'text-red-600'}`}>
        {label}
      </span>
    </motion.div>
  );

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-purple-100 via-purple-50 to-white">
      {/* Background Illustration */}
      <div className="absolute inset-0 z-0 flex items-end justify-center">
        <img 
          src="/Loginpage.png" 
          alt="" 
          className="w-full max-w-3xl object-contain opacity-90"
          style={{ maxHeight: '90vh' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-purple-50/80" />
      </div>

      {/* Main Form Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-[90%] max-w-[400px] mx-4 flex flex-col max-h-[80vh]"
      >
        {/* Fixed Logo Section with Border */}
        <div className="sticky top-0 bg-white z-20 pb-2">
          <motion.div 
            className="flex items-center justify-center mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <img 
              src="/assets/LogoRounded.png" 
              alt="Logo" 
              className="h-[200px] sm:h-20 w-auto object-contain"
            />
          </motion.div>
          <div className="absolute bottom-2 left-0 right-0 h-px bg-gray-200" />
        </div>

        {/* Scrollable Form Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.form 
              key={isSignUp ? 'signup' : 'signin'}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleAuth} 
              className="space-y-4 sm:space-y-5"
            >
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:ring-0"
                        required
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:ring-0"
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:ring-0"
                  required
                  placeholder="Enter your email"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:ring-0"
                  required
                  placeholder="Enter your password (min 8 characters)"
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div 
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-2"
                  >
                    <CriteriaItem met={passwordCriteria.hasLength} label="At least 8 characters" />
                    <CriteriaItem met={passwordCriteria.hasUpperCase} label="Contains uppercase letter" />
                    <CriteriaItem met={passwordCriteria.hasLowerCase} label="Contains lowercase letter" />
                    <CriteriaItem met={passwordCriteria.hasNumber} label="Contains number" />
                    <CriteriaItem met={passwordCriteria.hasSymbol} label="Contains symbol" />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Code
                      </label>
                      <CountrySelector
                        value={countryCode}
                        onChange={setCountryCode}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600">
                        Phone
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:ring-0"
                        required
                        maxLength={10}
                        placeholder="1234567890"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                variants={itemVariants}
                type="submit"
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p 
              key={isSignUp ? 'signup-text' : 'signin-text'}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-4 text-center text-sm text-gray-500"
            >
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <motion.button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setEmail('');
                  setPassword('');
                  setFirstName('');
                  setLastName('');
                  setPhone('');
                  setCountryCode('+1');
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </motion.button>
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`mt-4 p-3 rounded-lg text-sm ${
                  error.includes('Success') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

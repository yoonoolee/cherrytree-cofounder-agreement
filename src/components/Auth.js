import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function Auth({ onLogin }) {
  const [step, setStep] = useState('signin'); // 'signin', 'signup', 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [wiggleField, setWiggleField] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [credentialError, setCredentialError] = useState('');

  // Validate email format
  const validateEmail = (email) => {
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return '';
    }

    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    // Check for common typos
    const commonTypos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outloo.com': 'outlook.com',
    };

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && commonTypos[domain]) {
      return `Did you mean ${email.split('@')[0]}@${commonTypos[domain]}?`;
    }

    // Check for suspicious patterns
    if (email.includes('..')) {
      return 'Email contains consecutive dots';
    }

    if (email.startsWith('.') || email.endsWith('.')) {
      return 'Email cannot start or end with a dot';
    }

    return '';
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setEmailError(validateEmail(value));
    setCredentialError(''); // Clear credential error when typing
  };

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-red-500';
    return 'bg-green-500';
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain uppercase and lowercase letters';
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  // Combined signin/signup handler
  const handleSubmitCombined = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate email
    if (!email.trim()) {
      setWiggleField('email');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      setWiggleField('email');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    // Validate password
    if (!password.trim()) {
      setWiggleField('password');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    setLoading(true);

    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, email, password);
      // Let LoginPage's auth listener handle redirect to avoid race condition
      // Keep loading state active until redirect happens
    } catch (err) {
      console.error('Auth error:', err);

      // Firebase returns 'auth/invalid-credential' for both wrong password AND user not found
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        // Show inline error message and wiggle both fields
        setCredentialError('Account doesn\'t exist or password is incorrect');
        setWiggleField('email');
        setTimeout(() => {
          setWiggleField('password');
          setTimeout(() => setWiggleField(''), 500);
        }, 500);
        setLoading(false);
        return;
      }

      // Other errors
      if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setWiggleField('email');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate fields
    if (!email.trim()) {
      setWiggleField('email');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      setWiggleField('email');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    if (!name.trim()) {
      setWiggleField('name');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    if (!password.trim()) {
      setWiggleField('password');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setWiggleField('password');
      setTimeout(() => setWiggleField(''), 500);
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Save user profile to Firestore (SINGLE SOURCE OF TRUTH)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name.trim(),
        email: email,
        createdAt: new Date(),
        updatedAt: new Date(),
        purchases: []
      });

      setSuccess('Account created! Please check your email to verify your account.');

      // Let LoginPage's auth listener handle redirect after user sees success message
      // Keep loading state active until redirect happens
    } catch (err) {
      console.error('Signup error:', err);

      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The useUserSync hook will handle Firestore syncing
      // Let LoginPage's auth listener handle redirect to avoid race condition
      // Keep loading state active until redirect happens
    } catch (err) {
      console.error('Error signing in with Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Please allow popups for this site');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="bg-transparent p-8 w-full max-w-md">
        {/* Header */}
        <div className="mb-6 animate-fade-up">
          {step === 'signin' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
              <p className="text-gray-600">Sign in to your account</p>
            </>
          )}
          {step === 'signup' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Set up your Cherrytree account</p>
            </>
          )}
          {step === 'reset' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600">We'll send you a reset link</p>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-950 mb-4">{error}</p>
        )}

        {/* Success Message */}
        {success && (
          <p className="text-xs text-green-600 mb-4">{success}</p>
        )}

        {/* Combined Sign In Form (with email + password on same screen) */}
        {step === 'signin' && (
          <form onSubmit={handleSubmitCombined} className="flex flex-col gap-6">
            <div className="animate-fade-up-delay-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-0 py-2 border-0 border-b-2 ${emailError ? 'border-red-950' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'email' ? 'animate-wiggle' : ''}`}
                placeholder="tim@cherrytree.app"
                autoFocus
              />
              {emailError && (
                <p className="text-xs text-red-950 mt-1">{emailError}</p>
              )}
            </div>

            <div className="animate-fade-up-delay-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setCredentialError(''); }}
                  className={`w-full px-0 py-2 pr-10 border-0 border-b-2 ${credentialError ? 'border-red-950' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'password' ? 'animate-wiggle' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {credentialError && (
                <p className="text-xs text-red-950 mt-1">{credentialError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed next-button animate-fade-up-delay-3"
            >
              Sign In
            </button>

            {/* Divider */}
            <div className="relative animate-fade-up-delay-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              tabIndex="-1"
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded font-semibold bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed animate-fade-up-delay-5"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="text-center animate-fade-up-delay-6 space-y-2">
              <button
                type="button"
                onClick={() => setStep('reset')}
                className="text-sm text-gray-600 hover:text-gray-900 block w-full"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => { setStep('signup'); setPassword(''); setError(''); }}
                className="text-sm text-gray-600 hover:text-gray-900 block w-full"
              >
                Don't have an account? Create one
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Step */}
        {step === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col gap-6">
            <div className="animate-fade-up-delay-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-0 py-2 border-0 border-b-2 ${emailError ? 'border-red-950' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'email' ? 'animate-wiggle' : ''}`}
                placeholder="tim@cherrytree.app"
                autoFocus
              />
              {emailError && (
                <p className="text-xs text-red-950 mt-1">{emailError}</p>
              )}
            </div>

            <div className="animate-fade-up-delay-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'name' ? 'animate-wiggle' : ''}`}
                placeholder="Tim He"
              />
            </div>

            <div className="animate-fade-up-delay-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full px-0 py-2 pr-10 border-0 border-b-2 border-gray-300 focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'password' ? 'animate-wiggle' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  {getPasswordStrengthText() && (
                    <p className="text-xs text-gray-600">
                      Password strength: {getPasswordStrengthText()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Use 8+ characters with uppercase, lowercase, and numbers
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed next-button"
            >
              Create Account
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              tabIndex="-1"
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded font-semibold bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('signin'); setPassword(''); setError(''); }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {/* Password Reset Step */}
        {step === 'reset' && (
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-6">
            <div className="animate-fade-up-delay-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-0 py-2 border-0 border-b-2 ${emailError ? 'border-red-950' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'email' ? 'animate-wiggle' : ''}`}
                placeholder="tim@cherrytree.app"
                autoFocus
              />
              {emailError && (
                <p className="text-xs text-red-950 mt-1">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed next-button animate-fade-up-delay-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center animate-fade-up-delay-2">
              <button
                type="button"
                onClick={() => { setStep('signin'); setError(''); setSuccess(''); }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth;
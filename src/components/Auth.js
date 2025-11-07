import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
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
    if (passwordStrength <= 4) return 'bg-blue-500';
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
      onLogin();
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

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name,
        email: email,
        createdAt: new Date(),
        purchases: []
      });

      setSuccess('Account created! Please check your email to verify your account.');

      // Still allow login even if email not verified
      setTimeout(() => onLogin(), 2000);
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
          <p className="text-xs text-red-600 mb-4">{error}</p>
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
                className={`w-full px-0 py-2 border-0 border-b-2 ${emailError ? 'border-red-500' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'email' ? 'animate-wiggle' : ''}`}
                placeholder="tim@cherrytree.app"
                autoFocus
              />
              {emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
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
                  className={`w-full px-0 py-2 pr-10 border-0 border-b-2 ${credentialError ? 'border-red-500' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'password' ? 'animate-wiggle' : ''}`}
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
                <p className="text-xs text-red-600 mt-1">{credentialError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed next-button animate-fade-up-delay-3"
            >
              Sign In
            </button>

            <div className="text-center animate-fade-up-delay-3 space-y-2">
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
                className={`w-full px-0 py-2 border-0 border-b-2 ${emailError ? 'border-red-500' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'email' ? 'animate-wiggle' : ''}`}
                placeholder="tim@cherrytree.app"
                autoFocus
              />
              {emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
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
                className={`w-full px-0 py-2 border-0 border-b-2 ${emailError ? 'border-red-500' : 'border-gray-300'} focus:border-black focus:ring-0 bg-transparent text-gray-900 ${wiggleField === 'email' ? 'animate-wiggle' : ''}`}
                placeholder="tim@cherrytree.app"
                autoFocus
              />
              {emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
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
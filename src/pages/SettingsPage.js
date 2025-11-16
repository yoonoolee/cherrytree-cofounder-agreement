import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import SurveyNavigation from '../components/SurveyNavigation';

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' or 'security'

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        setEmail(currentUser.email || '');
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showMessage('error', 'Please enter a name');
      return;
    }

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName.trim() });

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: displayName.trim(),
        updatedAt: new Date()
      });

      showMessage('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showMessage('error', 'Please enter an email');
      return;
    }
    if (!currentPassword) {
      showMessage('error', 'Please enter your current password to update email');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user before sensitive operation
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, email.trim());

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        email: email.trim(),
        updatedAt: new Date()
      });

      setCurrentPassword('');
      showMessage('success', 'Email updated successfully');
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        showMessage('error', 'Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        showMessage('error', 'This email is already in use');
      } else if (error.code === 'auth/invalid-email') {
        showMessage('error', 'Invalid email address');
      } else if (error.code === 'auth/requires-recent-login') {
        showMessage('error', 'Please log out and log back in before changing your email');
      } else {
        showMessage('error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showMessage('error', 'Please enter your current password');
      return;
    }
    if (!newPassword) {
      showMessage('error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user before sensitive operation
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', 'Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        showMessage('error', 'Incorrect current password');
      } else if (error.code === 'auth/weak-password') {
        showMessage('error', 'Password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        showMessage('error', 'Please log out and log back in before changing your password');
      } else {
        showMessage('error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#ffffff' }}>
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center" style={{ zIndex: 50, paddingLeft: '270px' }}>
        <div className="flex-1 flex items-center px-6">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <SurveyNavigation
        displayTitle={user?.displayName || 'User'}
        currentPage="settings"
      >
        {/* Settings Sections */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveSection('profile')}
            className={`w-full text-left px-3 py-2 rounded-lg transition text-sm font-medium ${
              activeSection === 'profile'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`w-full text-left px-3 py-2 rounded-lg transition text-sm font-medium ${
              activeSection === 'security'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Security
          </button>
        </div>
      </SurveyNavigation>

      {/* Main Content */}
      <div className="flex-1" style={{ marginLeft: '270px', marginTop: '64px' }}>
        <div className="max-w-2xl mx-auto p-8">
          {/* Message Banner */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

                {/* Update Email */}
                <div className="mb-10">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Email</h3>
                  <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                        placeholder="Enter new email"
                      />
                    </div>

                    <div>
                      <label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPasswordEmail"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                        placeholder="Enter current password"
                      />
                      <p className="mt-1 text-xs text-gray-500">Required for security verification</p>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Update Password */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Password</h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label htmlFor="currentPasswordPwd" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPasswordPwd"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

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
import { doc, updateDoc, getDoc } from 'firebase/firestore';

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [memberSince, setMemberSince] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || '');
        setOriginalEmail(currentUser.email || '');

        // Fetch name and member since from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.name) {
            setDisplayName(userData.name);
          } else {
            setDisplayName(currentUser.displayName || '');
          }
          if (userData.createdAt) {
            setMemberSince(userData.createdAt.toDate());
          }
        } else {
          setDisplayName(currentUser.displayName || '');
        }
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showMessage('error', 'Please enter a name');
      return;
    }

    const emailChanged = email.trim() !== originalEmail;

    if (emailChanged && !currentPassword) {
      showMessage('error', 'Please enter your current password to update email');
      return;
    }

    setLoading(true);
    try {
      // Update name in Firebase Auth and Firestore
      await updateProfile(user, { displayName: displayName.trim() });
      const userRef = doc(db, 'users', user.uid);

      const updateData = {
        name: displayName.trim(),
        updatedAt: new Date()
      };

      // If email changed, update it too
      if (emailChanged) {
        // Re-authenticate user before sensitive operation
        const credential = EmailAuthProvider.credential(originalEmail, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update email in Firebase Auth
        await updateEmail(user, email.trim());

        // Add email to update data
        updateData.email = email.trim();

        // Update original email state
        setOriginalEmail(email.trim());
      }

      await updateDoc(userRef, updateData);
      setCurrentPassword('');
      showMessage('success', emailChanged ? 'Profile and email updated successfully' : 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
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
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-6" style={{ zIndex: 50 }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mr-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
      </div>

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-4xl mx-auto p-8 space-y-6">
          {/* Message Banner */}
          {message.text && (
            <div className={`p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Header */}
          <div className="flex items-center gap-4 pb-6">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-medium">
                {displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : email[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{displayName || 'User'}</h2>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>

          {/* Basic Profile Details Card */}
          <div className="border border-gray-200 rounded p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Basic profile details</h2>
                <p className="text-sm text-gray-500">Manage your basic profile details</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
                  </svg>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={async (e) => {
                await handleSaveProfile(e);
                if (!loading) setIsEditing(false);
              }}>
                {/* Name Field - Edit Mode */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-900">
                      Name
                    </label>
                    <p className="text-sm text-gray-500">This is your name as it will appear on your profile.</p>
                  </div>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-64 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent transition text-sm"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email Field - Edit Mode */}
                <div className={`flex items-center justify-between py-4 ${email !== originalEmail ? '' : 'border-b border-gray-100'}`}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                      Email address
                    </label>
                    <p className="text-sm text-gray-500">This is your profile email.</p>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-64 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent transition text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Field - Only shown when email is changed */}
                {email !== originalEmail && (
                  <div className="flex items-center justify-between py-4 border-b border-gray-100 bg-gray-50 -mx-6 px-6">
                    <div>
                      <label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-900">
                        Current password
                      </label>
                      <p className="text-sm text-gray-500">Required to change your email address.</p>
                    </div>
                    <input
                      type="password"
                      id="currentPasswordEmail"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-64 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent transition text-sm"
                      placeholder="Enter current password"
                    />
                  </div>
                )}

                {/* Save/Cancel Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEmail(originalEmail);
                      setCurrentPassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Name Field - View Mode */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Name
                    </label>
                    <p className="text-sm text-gray-500">This is your name as it will appear on your profile.</p>
                  </div>
                  <div className="text-sm text-gray-900">
                    {displayName || 'Not set'}
                  </div>
                </div>

                {/* Email Field - View Mode */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Email address
                    </label>
                    <p className="text-sm text-gray-500">This is your profile email.</p>
                  </div>
                  <div className="text-sm text-gray-900">
                    {email}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Change Password Card */}
          <div className="border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Change your password</h2>
                <p className="text-sm text-gray-500">You can change your current password for your account.</p>
              </div>
              {!isChangingPassword && (
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Change password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={(e) => {
                handleUpdatePassword(e);
                setIsChangingPassword(false);
              }} className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                <div>
                  <label htmlFor="currentPasswordPwd" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPasswordPwd"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent transition text-sm"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent transition text-sm"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent transition text-sm"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Delete Account Card */}
          <div className="border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Delete account</h2>
                <p className="text-sm text-gray-500">This action is irreversible and all data will be permanently deleted.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteConfirmChecked(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition"
              >
                Delete my account
              </button>
            </div>
          </div>

          {/* Delete Account Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h3>

                <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will permanently delete your account and all associated projects. This action cannot be undone.
                  </p>
                </div>

                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteConfirmChecked}
                    onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    I understand that this action is permanent and all my data will be deleted.
                  </span>
                </label>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmChecked(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!deleteConfirmChecked}
                    onClick={() => {
                      // TODO: Implement account deletion
                      showMessage('error', 'Account deletion is not yet implemented. Please contact support.');
                      setShowDeleteConfirm(false);
                      setDeleteConfirmChecked(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete my account
                  </button>
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

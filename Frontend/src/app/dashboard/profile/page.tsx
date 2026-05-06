'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { updateProfile, isUpdatingProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setAvatar(user.avatar);
    }
  }, [user, isAuthenticated, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    setIsUploading(true);
    try {
      const res = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatarUrl = res.data.data.url;
      setAvatar(newAvatarUrl);
      // Sync to auth store so navbar updates immediately
      updateProfile({ avatar: newAvatarUrl } as any);
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfile({ name, bio, avatar } as any);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <UserAvatar user={{ ...user, avatar }} size="xl" />
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-md">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
            {isUploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Personal Information</h2>
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Email"
            value={user.email}
            disabled
            helperText="Email cannot be changed"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers about yourself..."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
          </div>
          <Button onClick={handleSaveProfile} isLoading={isUpdatingProfile}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Change Password</h2>
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
          />
          <Button
            onClick={handleChangePassword}
            isLoading={isChangingPassword}
            variant="secondary"
          >
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );
}

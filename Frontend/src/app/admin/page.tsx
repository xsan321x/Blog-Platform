'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, Shield, Trash2, UserCheck, UserX, Edit2, Eye, KeyRound, X, Save } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { User, Post } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Edit User Modal ──────────────────────────────────────────────────────────

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}

function EditUserModal({ user: targetUser, onClose, onSaved }: EditUserModalProps) {
  const [name, setName] = useState(targetUser.name || '');
  const [bio, setBio] = useState(targetUser.bio || '');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setIsSavingProfile(true);
    try {
      await api.put(`/users/${targetUser._id}/reset-profile`, { name: name.trim(), bio });
      toast.success('Profile updated');
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.put(`/users/${targetUser._id}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setNewPassword('');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <UserAvatar user={targetUser} size="sm" />
            <div>
              <p className="font-semibold text-sm">{targetUser.name}</p>
              <p className="text-xs text-muted-foreground">{targetUser.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Profile Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              Edit Profile
            </h3>
            <div className="space-y-3">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User's full name"
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="User bio..."
                  rows={2}
                  maxLength={300}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                isLoading={isSavingProfile}
                size="sm"
                className="w-full"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </Button>
            </div>
          </div>

          {/* Password Section */}
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-orange-500" />
              Reset Password
            </h3>
            <div className="space-y-3">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                helperText="The user will need to use this new password to log in"
              />
              <Button
                onClick={handleResetPassword}
                isLoading={isSavingPassword}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                <KeyRound className="w-4 h-4" />
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
    if (user && !['admin', 'master_admin'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { limit: 50 } });
      return res.data;
    },
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const res = await api.get('/posts/admin/all', { params: { limit: 50 } });
      return res.data;
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.put(`/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const toggleStatus = useMutation({
    mutationFn: async (userId: string) => {
      await api.put(`/users/${userId}/status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      toast.success('Post deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (!user) return null;

  const ROLE_OPTIONS = ['reader', 'author', 'admin'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/30 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users and content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: usersData?.pagination?.total ?? '—', icon: Users },
          { label: 'Total Posts', value: postsData?.pagination?.total ?? '—', icon: FileText },
          { label: 'Authors', value: usersData?.data?.filter((u: User) => u.role === 'author').length ?? '—', icon: UserCheck },
          { label: 'Admins', value: usersData?.data?.filter((u: User) => ['admin', 'master_admin'].includes(u.role)).length ?? '—', icon: Shield },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <Icon className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-foreground/60 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['users', 'posts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : usersData?.data?.map((u: User) => (
                  <tr key={u._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={u} size="sm" />
                        <div>
                          <p className="font-semibold text-sm text-foreground">{u.name}</p>
                          <p className="text-xs text-foreground/60 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {u.role === 'master_admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                          Master Admin
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => assignRole.mutate({ userId: u._id, role: e.target.value })}
                          disabled={u._id === user._id}
                          className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                        u.isActive
                          ? 'bg-green-500 text-white border-green-600'
                          : 'bg-red-500 text-white border-red-600'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground/70">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {u.role !== 'master_admin' && u._id !== user._id && (
                          <>
                            {/* Edit profile & reset password */}
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Edit profile / Reset password"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleStatus.mutate(u._id)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) deleteUser.mutate(u._id);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Post</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Author</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-foreground/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {postsLoading ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : postsData?.data?.map((post: Post) => (
                  <tr key={post._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm text-foreground line-clamp-1">{post.title}</p>
                      <p className="text-xs text-foreground/60 mt-0.5">❤️ {post.likesCount ?? 0} · 💬 {post.commentsCount ?? 0}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{post.author.name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full capitalize ${
                        post.status === 'published'
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                        {post.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground/70">{formatDate(post.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {post.status === 'published' && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            title="View post"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/posts/${post._id}/edit`}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete post "${post.title}"?`)) deletePost.mutate(post._id);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

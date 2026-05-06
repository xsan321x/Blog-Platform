import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * Hook for authentication operations
 */
export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await api.post('/auth/login', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Welcome back!');
      router.push('/');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await api.post('/auth/register', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Account created successfully!');
      router.push('/');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Logout
  const handleLogout = () => {
    logout();
    queryClient.clear();
    toast.success('Logged out successfully');
    router.push('/');
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await api.put('/auth/profile', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Profile updated!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return {
    user,
    token,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: handleLogout,
    updateProfile: updateProfileMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}

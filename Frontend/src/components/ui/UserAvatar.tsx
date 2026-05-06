import Image from 'next/image';
import { User } from '@/types';
import { getInitials, cn } from '@/lib/utils';

interface UserAvatarProps {
  user: Pick<User, '_id' | 'name' | 'avatar'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-base' },
  xl: { container: 'w-20 h-20', text: 'text-xl' },
};

const colors = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
];

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const { container, text } = sizeMap[size];

  // Safe name — never undefined
  const name = user?.name || 'User';

  if (user?.avatar) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', container, className)}>
        <Image
          src={user.avatar}
          alt={name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
    );
  }

  // Fallback: colored initials based on first char of name
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold',
        container,
        text,
        colors[colorIndex],
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

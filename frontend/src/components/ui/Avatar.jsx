import { HiUser } from 'react-icons/hi';

export default function Avatar({ src, alt, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-16 h-16', xl: 'w-24 h-24' };
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8', xl: 'w-12 h-12' };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'avatar'}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ring-2 ring-border-light dark:ring-border transition-all duration-200 hover:ring-primary-300 hover:brightness-105 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-surface-200 dark:bg-surface-200 flex items-center justify-center flex-shrink-0 ring-2 ring-border-light dark:ring-border ${className}`}>
      <HiUser className={`${iconSizes[size]} text-text-tertiary`} />
    </div>
  );
}

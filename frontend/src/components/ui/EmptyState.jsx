import { HiOutlineInbox } from 'react-icons/hi';

export default function EmptyState({ icon: Icon = HiOutlineInbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-primary-400 dark:text-primary-300" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        {title || 'Chưa có gì'}
      </h3>
      {description && (
        <p className="text-sm text-text-tertiary mb-5 text-center max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}

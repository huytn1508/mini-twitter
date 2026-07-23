import { HiOutlineInbox } from 'react-icons/hi';

export default function EmptyState({ icon: Icon = HiOutlineInbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        {title || 'Chưa có gì'}
      </h3>
      {description && (
        <p className="text-sm text-neutral-400 mb-5 text-center max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}

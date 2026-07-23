import { HiOutlineInbox } from 'react-icons/hi';

export default function EmptyState({ icon: Icon = HiOutlineInbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon className="w-16 h-16 mb-4" />
      <h3 className="text-lg font-semibold text-gray-500 mb-1">{title || 'Chưa có gì'}</h3>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}

export default function SkeletonPost() {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1 space-y-3">
          {/* Tên + time */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 skeleton" />
            <div className="h-3 w-16 skeleton" />
          </div>
          {/* Nội dung */}
          <div className="space-y-2">
            <div className="h-4 w-full skeleton" />
            <div className="h-4 w-3/4 skeleton" />
          </div>
          {/* Action bar */}
          <div className="flex items-center gap-6 pt-3 mt-3 border-t border-neutral-100">
            <div className="h-4 w-12 skeleton" />
            <div className="h-4 w-12 skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonPostList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPost key={i} />
      ))}
    </div>
  );
}

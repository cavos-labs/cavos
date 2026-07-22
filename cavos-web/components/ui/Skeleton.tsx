export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-black/[0.07] ${className}`} />
}

export function PageSkeleton() {
  return <div aria-label="Loading" aria-busy="true" className="space-y-6">
    <div className="space-y-2"><Skeleton className="h-8 w-44" /><Skeleton className="h-4 w-72 max-w-full" /></div>
    <div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
    <Skeleton className="h-72" />
  </div>
}

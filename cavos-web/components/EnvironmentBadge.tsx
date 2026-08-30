export function EnvironmentBadge({ kind }: { kind?: string | null }) {
  const production = kind === 'production'
  return (
    <span className="text-sm font-medium text-muted">
      {production ? 'Production' : 'Development'}
    </span>
  )
}

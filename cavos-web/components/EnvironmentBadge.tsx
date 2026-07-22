export function EnvironmentBadge({ kind }: { kind?: string | null }) {
  const production = kind === 'production'
  return <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${production ? 'text-black/50' : 'text-brand'}`}>
    <span className={`h-1.5 w-1.5 ${production ? 'bg-black/45' : 'bg-brand'}`} />
    {production ? 'Production' : 'Development'}
  </span>
}

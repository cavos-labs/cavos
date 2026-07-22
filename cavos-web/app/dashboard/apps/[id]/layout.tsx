import { AppNavigation } from '@/components/AppNavigation'

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div className="space-y-5"><AppNavigation appId={id} />{children}</div>
}

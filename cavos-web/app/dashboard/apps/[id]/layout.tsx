import { SyncSelectedApp } from '@/components/SyncSelectedApp'

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <SyncSelectedApp id={id} />
      {children}
    </>
  )
}

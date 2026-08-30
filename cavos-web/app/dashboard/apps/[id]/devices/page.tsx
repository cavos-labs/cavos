import { redirect } from 'next/navigation'

export default async function DevicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/apps/${id}/wallets`)
}

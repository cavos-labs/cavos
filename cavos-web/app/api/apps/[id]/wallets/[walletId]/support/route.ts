import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canRevealIdentity, organizationForApp } from '@/lib/operations/access'
import { maskExternalId } from '@/lib/operations/events'

export async function GET(_: Request, { params }: { params: Promise<{ id: string; walletId: string }> }) {
  const { id, walletId } = await params; const access = await organizationForApp(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const admin=createAdminClient()
  const {data:wallet}=await admin.from('wallets').select('id,address,network,user_social_id,created_at,updated_at,environment_id,wallet_devices(id,device_label,created_at)').eq('id',walletId).eq('app_id',id).maybeSingle()
  if(!wallet)return NextResponse.json({error:'Wallet not found'},{status:404})
  const [{data:requests},{data:events}]=await Promise.all([
    admin.from('device_addition_requests').select('id,device_label,status,expires_at,created_at,confirmed_at,confirmed_tx_hash').eq('wallet_id',walletId).order('created_at',{ascending:false}).limit(20),
    admin.from('cavos_events').select('id,event_type,status,severity,network,request_id,tx_reference,duration_ms,error_code,created_at').eq('wallet_id',walletId).order('created_at',{ascending:false}).limit(30),
  ])
  return NextResponse.json({wallet:{...wallet,user_social_id:undefined,external_id_masked:maskExternalId(wallet.user_social_id),can_reveal_external_id:canRevealIdentity(access.role)},device_requests:requests??[],events:events??[]})
}

export async function POST(request: Request,{params}:{params:Promise<{id:string;walletId:string}>}){
  const {id,walletId}=await params;const access=await organizationForApp(id)
  if(!access||!canRevealIdentity(access.role))return NextResponse.json({error:'Forbidden'},{status:403})
  const body=await request.json().catch(()=>({}));if(body.action!=='reveal_external_id')return NextResponse.json({error:'Invalid action'},{status:400})
  const admin=createAdminClient();const{data:wallet}=await admin.from('wallets').select('user_social_id').eq('id',walletId).eq('app_id',id).maybeSingle();if(!wallet)return NextResponse.json({error:'Wallet not found'},{status:404})
  await admin.from('audit_events').insert({organization_id:access.app.organization_id,actor_id:access.user.id,action:'wallet.external_id_revealed',resource_type:'wallet',resource_id:walletId,result:'success',changes:{reason:typeof body.reason==='string'?body.reason.slice(0,160):'support'}})
  return NextResponse.json({external_id:wallet.user_social_id})
}

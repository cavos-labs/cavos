import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/api-key'
import { requireOrganizationAccess } from '@/lib/operations/access'

export async function POST(_:Request,{params}:{params:Promise<{id:string;keyId:string}>}){
  const{id,keyId}=await params;const access=await requireOrganizationAccess(id,['owner','admin'])
  if(!access.ok)return NextResponse.json({error:'Forbidden'},{status:access.status})
  const admin=createAdminClient();const{data:previous}=await admin.from('organization_api_keys').select('name,environment_id,scopes').eq('id',keyId).eq('org_id',id).maybeSingle()
  if(!previous)return NextResponse.json({error:'API key not found'},{status:404})
  const{key,hash,prefix}=generateApiKey();const{data:created,error}=await admin.from('organization_api_keys').insert({org_id:id,name:`${previous.name} (rotated)`,key_hash:hash,key_prefix:prefix,created_by:access.user.id,environment_id:previous.environment_id,scopes:previous.scopes}).select('id,name,key_prefix,is_active,environment_id,scopes,created_at').single()
  if(error)return NextResponse.json({error:error.message},{status:500})
  await admin.from('organization_api_keys').update({expires_at:new Date(Date.now()+24*60*60*1000).toISOString()}).eq('id',keyId)
  await admin.from('audit_events').insert({organization_id:id,actor_id:access.user.id,action:'api_key.rotated',resource_type:'api_key',resource_id:keyId,result:'success',changes:{replacement_id:created.id,overlap_hours:24}})
  return NextResponse.json({key:created,plaintext:key,previous_expires_in_hours:24},{status:201})
}

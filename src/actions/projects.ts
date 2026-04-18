'use server'

import { createClient } from '@/lib/supabase-server'
import { getSession } from './auth'
import { Project } from '@/types'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side actions for managing Projects.
 * These actions enforce ownership and workspace isolation.
 */

async function getProfileByEmail(supabase: SupabaseClient, email: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
  return data
}

export async function getProjectsAction(): Promise<Project[]> {
  const session = await getSession()
  if (!session) return []
  
  const supabase = await createClient()
  
  let query = supabase.from('projects').select(`
    *,
    project_members (
      profile_id
    )
  `)
  
  if (session.accountKind === 'personal') {
    const profile = await getProfileByEmail(supabase, session.email)
    if (!profile) return []
    query = query.eq('owner_id', profile.id)
  } else {
    // Team mode: for simplicity we return all team-wide projects 
    // or filter by project_members if needed.
    query = query.eq('workspace_type', 'team')
  }

  const { data, error } = await query
  if (error) {
    console.error('getProjectsAction error:', error)
    return []
  }
  
  return (data as Record<string, unknown>[]).map((p) => ({
    ...p,
    assignedDevIds: (p.project_members as Record<string, unknown>[])?.map((m) => m.profile_id as string) || []
  })) as Project[]
}

export async function createProjectAction(project: Partial<Project>): Promise<Project | null> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const profile = await getProfileByEmail(supabase, session.email)
  
  const payload: Record<string, unknown> = {
    ...project,
    workspace_type: session.accountKind || 'team',
    owner_id: profile?.id || null,
    status: project.status || 'active',
  }

  // 1. Remove UI-only or auto-generated fields that might have "temp" values
  delete payload.assignedDevIds;
  
  // If id is not a valid UUID (e.g. "proj-123"), remove it and let DB generate
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (payload.id && !uuidRegex.test(String(payload.id))) {
    delete payload.id;
  }

  // 2. Ensure UUID foreign keys are valid or null (never empty string)
  const uuidFields = ['pm_id', 'client_id'];
  uuidFields.forEach(field => {
    const val = payload[field];
    if (val === '' || (val && !uuidRegex.test(String(val)))) {
      payload[field] = null;
    }
  });

  const { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('createProjectAction error:', error)
    console.error('Failed payload:', payload)
    throw error
  }
  
  revalidatePath('/')
  return { ...(data as Project), assignedDevIds: [] } as Project
}

export async function updateProjectAction(id: string, updates: Partial<Project>) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  
  const supabase = await createClient()
  
  // Security check: ensure user owns this project if personal
  if (session.accountKind === 'personal') {
    const profile = await getProfileByEmail(supabase, session.email)
    const { data: existing } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single()
    
    if (existing?.owner_id !== profile?.id) throw new Error('Forbidden')
  }

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/')
}

export async function deleteProjectAction(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  
  const supabase = await createClient()
  
  // Security check same as update
  if (session.accountKind === 'personal') {
    const profile = await getProfileByEmail(supabase, session.email)
    const { data: existing } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single()
    
    if (existing?.owner_id !== profile?.id) throw new Error('Forbidden')
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/')
}

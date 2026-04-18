'use server'

import { createClient } from '@/lib/supabase-server'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'
import { UserProfile } from '@/types'

/**
 * Server-side actions for managing User Profiles.
 */

export async function getProfiles(): Promise<UserProfile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, avatar_url, department')
    .eq('status', 'active');
  
  if (error) throw error;
  return data as UserProfile[];
}

export async function getProfileById(id: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, avatar_url, department')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data as UserProfile;
}

export async function upgradeToAdminAction() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const supabase = await createClient()
  
  // Find profile by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', session.email)
    .single()
  
  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'administrator' })
    .eq('id', profile.id)

  if (error) throw error
  revalidatePath('/')
}

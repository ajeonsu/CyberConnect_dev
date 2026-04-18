'use server'

import { cookies } from 'next/headers'

/**
 * Simulated authentication actions to bridge the gap between 
 * client-side localStorage/sessionStorage and a real backend.
 * These actions set HTTP-only cookies that the server-side 
 * Supabase client and other Server Actions can use.
 */

export async function loginAction(email: string, role: string, accountKind: 'team' | 'personal') {
  const cookieStore = await cookies()
  
  // Set session cookies
  cookieStore.set('cyberconnect_email', email, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
  
  cookieStore.set('cyberconnect_role', role, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })

  cookieStore.set('cyberconnect_account_kind', accountKind, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('cyberconnect_email')
  cookieStore.delete('cyberconnect_role')
  cookieStore.delete('cyberconnect_account_kind')
}

export async function getSession() {
  const cookieStore = await cookies()
  const email = cookieStore.get('cyberconnect_email')?.value
  const role = cookieStore.get('cyberconnect_role')?.value
  const accountKind = cookieStore.get('cyberconnect_account_kind')?.value as 'team' | 'personal' | undefined
  
  if (!email) return null
  
  return { email, role, accountKind }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId, verifyPassword, hashPassword, generateSalt } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/sales/change-password — a signed-in rep changes their own
// password. Requires the current password, same as any reasonable account
// settings flow — proves it's really them, not just someone at an
// already-open, unattended session.
export async function POST(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new password are required.' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    const { data: rep, error: fetchError } = await supabase
      .from('sales_reps')
      .select('password_hash, password_salt')
      .eq('id', repId)
      .single()

    if (fetchError || !rep) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    }

    const valid = await verifyPassword(currentPassword, rep.password_salt, rep.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    const newSalt = generateSalt()
    const newHash = await hashPassword(newPassword, newSalt)

    const { error: updateError } = await supabase
      .from('sales_reps')
      .update({ password_hash: newHash, password_salt: newSalt })
      .eq('id', repId)

    if (updateError) {
      console.error('Password change error:', updateError)
      return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Password change error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

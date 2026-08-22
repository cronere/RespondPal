// Lead ownership expiration — lazy pattern, no cron job needed. Every time
// leads are read (a rep's own list, or the open/unclaimed pool), this runs
// first: any lead still assigned to a rep but with no activity (no stage
// change, no note update — updated_at is the proxy for both) in 90 days
// gets released back to unclaimed (sales_rep_id set to null). The lead's
// own row stays intact — original_sales_rep_id preserves who found it,
// stage/notes/everything else is untouched, only current ownership opens
// up. Whoever next takes real action on it (the PATCH route) reclaims it
// automatically.
export async function releaseStaleLeads(supabase) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  try {
    await supabase
      .from('leads')
      .update({ sales_rep_id: null })
      .not('sales_rep_id', 'is', null)
      .lt('updated_at', ninetyDaysAgo)
      .neq('stage', 'won')
      .neq('stage', 'lost')
  } catch (err) {
    // Never let a release-sweep failure block an actual leads read — worst
    // case a stale lead stays assigned one extra request cycle.
    console.error('releaseStaleLeads error:', err)
  }
} 

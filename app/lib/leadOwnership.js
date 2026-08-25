// Lead ownership expiration — lazy pattern, no cron job needed. Every time
// leads are read (a rep's own list, or the open/unclaimed pool), this runs
// first: any lead still assigned to a rep but with no logged contact in 90
// days gets released back to unclaimed (sales_rep_id set to null). Keyed
// off last_contacted_at specifically — not updated_at, which changes on
// ANY edit (a rep fixing a typo shouldn't reset the clock the same way an
// actual conversation does). Falls back to created_at for a lead that's
// never been logged as contacted at all. The lead's own row stays intact
// — original_sales_rep_id preserves who found it, stage/notes/everything
// else is untouched, only current ownership opens up. Whoever next takes
// real action on it (the PATCH route) reclaims it automatically.
export async function releaseStaleLeads(supabase) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  try {
    // Two passes rather than one combined OR condition — clearer to read,
    // and Supabase's query builder doesn't cleanly express "column A is
    // null AND column B is old, OR column A is old" in one chain without
    // a raw filter string, which is exactly the kind of uncertain syntax
    // that already caused one real bug in this file.
    await supabase
      .from('leads')
      .update({ sales_rep_id: null })
      .not('sales_rep_id', 'is', null)
      .not('last_contacted_at', 'is', null)
      .lt('last_contacted_at', ninetyDaysAgo)
      .neq('stage', 'won')
      .neq('stage', 'lost')

    await supabase
      .from('leads')
      .update({ sales_rep_id: null })
      .not('sales_rep_id', 'is', null)
      .is('last_contacted_at', null)
      .lt('created_at', ninetyDaysAgo)
      .neq('stage', 'won')
      .neq('stage', 'lost')
  } catch (err) {
    // Never let a release-sweep failure block an actual leads read — worst
    // case a stale lead stays assigned one extra request cycle.
    console.error('releaseStaleLeads error:', err)
  }
}

// Same release logic, scoped to one rep specifically — used when archiving
// a rep, so their already-stale leads (90+ days, no activity) open up
// immediately rather than waiting for the normal lazy sweep to eventually
// touch them. Deliberately does NOT release leads that are still within
// the 90-day window — a lead the rep was genuinely, recently working
// shouldn't be ripped away the instant they're archived, only the ones
// they'd already effectively abandoned.
export async function releaseStaleLeadsForRep(supabase, repId) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  try {
    await supabase
      .from('leads')
      .update({ sales_rep_id: null })
      .eq('sales_rep_id', repId)
      .not('last_contacted_at', 'is', null)
      .lt('last_contacted_at', ninetyDaysAgo)
      .neq('stage', 'won')
      .neq('stage', 'lost')

    await supabase
      .from('leads')
      .update({ sales_rep_id: null })
      .eq('sales_rep_id', repId)
      .is('last_contacted_at', null)
      .lt('created_at', ninetyDaysAgo)
      .neq('stage', 'won')
      .neq('stage', 'lost')
  } catch (err) {
    console.error('releaseStaleLeadsForRep error:', err)
  }
}

-- ─────────────────────────────────────────
-- RespondPal — Commission events (Stripe webhook foundation)
-- Run this in your Supabase SQL editor. Safe on existing data.
-- ─────────────────────────────────────────

-- Every payment and chargeback the webhook receives from Stripe lands here
-- first, before any commission calculation happens. This is the actual
-- source of truth — nothing gets calculated or paid out except from what's
-- recorded in this table, and every row traces back to a real Stripe event.
create table if not exists commission_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Deduplication: Stripe retries webhook deliveries, sometimes more than
  -- once for the same event. This unique constraint means a retry can
  -- never be double-processed into two commission events.
  stripe_event_id text not null unique,

  event_type text not null check (event_type in ('payment', 'chargeback')),

  -- Stripe identifiers, kept for traceability and for matching a
  -- chargeback back to the original payment it's reversing.
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  stripe_charge_id text,

  amount_cents integer not null,

  -- How this event got matched to a rep/client, if it did.
  -- 'metadata' = matched via the rep's personal payment link metadata
  --              (the reliable path — see Section 3.6 of the rep agreement)
  -- 'email'    = matched by comparing the paying customer's email against
  --              an existing clients record (the fallback path)
  -- null       = not yet matched
  match_method text check (match_method in ('metadata', 'email')),

  sales_rep_id uuid references sales_reps(id) on delete set null,
  client_id uuid references clients(id) on delete set null,

  -- 'matched'      = confidently attributed, will feed the commission
  --                  calculation engine once that's built
  -- 'needs_review' = couldn't be confidently matched, or is a chargeback
  --                  affecting a not-yet-paid-out commission — held for
  --                  Jacob's manual review before counting toward anything,
  --                  per the explicit decision that unmatched payments
  --                  never auto-count
  -- 'reviewed'     = Jacob has resolved a needs_review row manually
  status text not null default 'needs_review' check (status in ('matched', 'needs_review', 'reviewed')),

  -- For a chargeback event, points at the commission_events row for the
  -- original payment it's reversing — this is how the clawback-before-vs-
  -- after-payout logic (Section 3.4 of the rep agreement) will know which
  -- specific commission is affected, once the payout engine is built.
  reverses_event_id uuid references commission_events(id) on delete set null,

  -- Free-text note for anything that needed manual judgment — e.g. why a
  -- row was matched by hand, or why a chargeback couldn't be linked
  -- automatically to its original payment.
  review_note text
);

create index if not exists idx_commission_events_status on commission_events(status);
create index if not exists idx_commission_events_rep on commission_events(sales_rep_id);
create index if not exists idx_commission_events_client on commission_events(client_id);
create index if not exists idx_commission_events_charge on commission_events(stripe_charge_id);

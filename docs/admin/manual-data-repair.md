# Manual data repair — stuck invited memberships

Use these queries only for targeted support cases. Do not run a global backfill without
reviewing each row.

## Diagnostic — invited memberships with confirmed email

```sql
select
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.status,
  om.invited_at,
  om.joined_at,
  u.email,
  u.email_confirmed_at
from public.organization_members om
join auth.users u on u.id = om.user_id
where om.status = 'invited'
  and u.email_confirmed_at is not null;
```

## Repair — activate a single stuck membership

Replace the placeholders with the values from the diagnostic query.

```sql
update public.organization_members
set
  status = 'active',
  joined_at = coalesce(joined_at, now())
where id = '<membership_id>'
  and organization_id = '<organization_id>'
  and user_id = '<auth_user_id>'
  and status = 'invited';
```

## RLS verification (run as support with SQL editor / service role)

After migration `20260704103000_fix_invited_membership_rls.sql`:

1. Authenticated user can read their own `organization_members` row when `status = 'invited'`.
2. Authenticated user can read their own `organization_members` row when `status = 'active'`.
3. Authenticated user cannot read another user's `invited` row.
4. Authenticated users cannot `UPDATE` `organization_members` directly (`revoke update` remains in place).
5. Active members can still read active teammates in the same organization.

## Preferred client self-service path

When possible, ask the client to open a fresh invitation link and complete
`/auth/set-password` again. The server action activates `invited` memberships with
the service role after password creation.

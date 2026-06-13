# Supabase Migrations CI

This project uses GitHub Actions to keep committed Supabase migrations aligned with the remote Supabase database.

The workflow lives at `.github/workflows/supabase-migrations.yml`.

## Required GitHub Secrets

Add these repository secrets in GitHub:

1. Open the GitHub repository.
2. Go to `Settings` -> `Secrets and variables` -> `Actions`.
3. Select `New repository secret`.
4. Add each required secret:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
SUPABASE_DB_PASSWORD
```

`SUPABASE_ACCESS_TOKEN` comes from Supabase account access tokens.

`SUPABASE_PROJECT_REF` is the Supabase project reference.

`SUPABASE_DB_PASSWORD` is the project database password.

Do not commit these values to the repository and do not put them in any `NEXT_PUBLIC_*` environment variable.

## What Runs Automatically

The workflow runs when one of these files changes:

```text
supabase/migrations/**
supabase/config.toml
.github/workflows/supabase-migrations.yml
```

Pull requests targeting `main` run a remote dry run only:

```bash
supabase db push --dry-run
```

Pushes to `main` run the dry run first. If the dry run succeeds, the workflow applies the pending migrations with:

```bash
supabase db push
```

Manual runs are supported with `workflow_dispatch`. Use:

- `true` to dry-run and apply migrations.
- `dry-run-only` to run validation without applying migrations.

## Safety Rules

The workflow never runs:

```bash
supabase db reset
```

The workflow never runs:

```bash
supabase migration repair
```

It does not run arbitrary SQL from CI. It only uses the committed migration files and the Supabase CLI migration flow.

Secrets are read from GitHub Actions secrets and are not hardcoded in the workflow.

The workflow uses a production concurrency group so two migration pushes cannot run at the same time.

## Applying Existing Pending Migrations

After the secrets are configured, trigger `Supabase Migrations` manually from GitHub Actions with `apply` set to `true` to apply any migrations that are already on `main`.

Then confirm in the Supabase dashboard that the migration history includes the expected migration files and that the new tables or columns exist.

## Notes

This automation does not replace database review. Migration files still need to be reviewed for data preservation, RLS, permissions, and production safety before they are merged into `main`.

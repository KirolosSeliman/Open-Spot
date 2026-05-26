# Mega Prompt Codex Audit — Review Latest Codex Push for 2e Chance RDV

You are a senior software architect, senior full-stack code reviewer, security engineer, QA lead, Supabase/RLS auditor, deployment reviewer, and product reliability auditor.

Your job is to analyze the latest changes pushed by Codex to the project **2e Chance RDV**. Do not simply summarize the code. I want a strict, technical, honest audit of what Codex changed, whether the changes are good, whether they are safe, whether they improve the project, and whether the project is closer to being deployable or still blocked.

This audit must protect the project before production.

---

## 0. Project Context

Repository:

```text
KirolosSeliman/2e-chance-RDV
```

Branch to inspect:

```text
main
```

Latest Codex push/commit(s):

```text
latest push
```

Original goal Codex was supposed to accomplish:

```text
Make Supabase Auth + organization onboarding + merchant dashboard workspace functional end-to-end.

Specifically:
- implement real Supabase sign-up;
- implement real Supabase sign-in;
- implement sign-out;
- create organization onboarding;
- create organizations row;
- create organization_members row with role owner;
- protect /dashboard and subroutes;
- redirect unauthenticated users to /sign-in;
- redirect authenticated users without organization to onboarding;
- load active organization in dashboard;
- never expose service role keys client-side;
- keep SMS_PROVIDER=simulator and ALLOW_REAL_SMS_SENDS=false;
- do not implement real SMS, Stripe, import persistence, or billing in this phase.
```

Deployment URL, if available:

```text
NOT PROVIDED
```

Supabase project URL:

```text
https://fuksavmwmfqyfmjcbgsx.supabase.co
```

Supabase project ref:

```text
fuksavmwmfqyfmjcbgsx
```

Relevant tools that may be available:

- GitHub
- terminal
- npm scripts
- Vercel logs, if connected
- Supabase project/database logs, if connected
- browser testing
- Playwright, if installed
- lint/build/test/typecheck commands

---

## 1. Non-Negotiable Audit Rules

Do not hallucinate.

Every factual claim must be classified as one of:

- VERIFIED IN CODE
- VERIFIED BY TEST/BUILD
- VERIFIED LIVE
- INFERRED
- NOT VERIFIED

If you cannot access something, clearly say what you could not verify and what evidence is missing.

Do not pretend.

Do not say “it should work” unless it was actually verified.

Do not mark a feature complete just because a file exists. You must inspect whether the feature is wired end-to-end.

Do not ignore security gaps because the UI appears to work.

Assume the project may contain hidden bugs, security risks, unsafe data handling, broken deployment issues, incomplete features, bad architecture, duplicated logic, fragile code, or fake placeholder implementations.

---

## 2. Initial Repository Inspection

Start by inspecting the repository and the latest changes.

Required steps:

1. Identify the latest commits pushed by Codex.
2. Compare the latest state against the previous state.
3. Review changed files, added files, deleted files, renamed files, migrations, package changes, config changes, environment variable changes, API changes, database changes, UI changes, and docs changes.
4. If terminal access is available, run the safest validation commands based on the project.

Suggested commands:

```bash
git status
git log --oneline -n 20
git diff --stat HEAD~1..HEAD
git diff HEAD~1..HEAD
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

If `HEAD~1` is not the correct base, identify the correct base commit before diffing.

If scripts are missing, inspect `package.json` and explain what validation was or was not possible.

If the project is deployed, check whether the live deployment actually reflects the latest push, if possible.

---

## 3. Project-Specific Areas to Audit Carefully

Because this project is a SaaS with Supabase and customer phone data, inspect these areas with extra severity.

### Auth

Check:

- sign-up really creates a Supabase Auth user;
- sign-in really authenticates;
- sign-out actually clears session;
- redirect logic works;
- dashboard cannot be accessed anonymously;
- auth state survives refresh;
- errors are handled safely;
- auth code does not expose private keys.

### Organization onboarding

Check:

- authenticated user without organization is redirected to onboarding;
- onboarding creates `organizations`;
- onboarding creates `organization_members`;
- creator becomes `owner`;
- slug is normalized and validated;
- duplicate slug is handled;
- anonymous users cannot create organizations;
- a user cannot create an organization for another user.

### Multi-tenant security

Check:

- every organization-scoped query is scoped by membership;
- no route trusts client-supplied `organization_id`;
- dashboard only shows the authenticated user’s organization;
- RLS is respected;
- service role, if used, is server-only and narrowly controlled.

### Dashboard

Check:

- dashboard loads real organization data;
- no fake hardcoded data remains where real data is expected;
- loading and error states exist;
- dashboard subroutes are protected;
- UI does not imply SMS/import/opening features are complete if they are not.

### Supabase migrations and types

Check:

- migrations match the code;
- `src/types/database.ts` matches the real schema enough for current code;
- no duplicated/conflicting migration was added;
- no unsafe RLS relaxation happened;
- any RPC added is safe and not over-permissive.

### SMS safety

For this phase, real SMS should remain disabled.

Check:

- `SMS_PROVIDER=simulator` is still the safe default;
- `ALLOW_REAL_SMS_SENDS=false` is respected;
- Plivo/Twilio are not accidentally activated;
- no real SMS credentials are hardcoded;
- no code path can send SMS unintentionally during tests.

### Environment and secrets

Check:

- `.env.local` is not committed;
- `.env.example` contains placeholders only;
- no service role key is exposed client-side;
- no Supabase DB password, service role key, SMS token, or Stripe key is committed;
- environment variable names are consistent.

---

# 4. Executive Verdict

Give one final status:

- READY TO DEPLOY
- ALMOST READY BUT NEEDS FIXES
- NOT DEPLOYABLE
- DANGEROUS / BLOCKED

Then explain the verdict in plain language.

Include:

- what Codex successfully changed;
- whether the original task appears completed;
- whether the implementation is safe;
- whether the app/project is more stable than before;
- whether there are blocking problems.

---

# 5. What Changed

Create this table:

| Area/File | Change Made | Purpose | Verification Level | Risk Level |
|---|---|---|---|---|

For each important change, explain:

- what was changed;
- why it was probably changed;
- what part of the project it affects;
- whether it is frontend, backend, database, auth, API, config, deployment, data, UI/UX, or infrastructure;
- whether it is complete or only a placeholder.

---

# 6. Before vs After

Use this structure:

## Before

Explain the previous likely state or problem.

## After

Explain what Codex changed.

## Real Improvement

Explain whether this is a real improvement or only a superficial change.

## Remaining Gap

Explain what is still missing.

---

# 7. Good Parts

List everything Codex did well.

For each good part, explain:

- why it is good;
- what risk it reduces;
- what feature or architecture it improves;
- whether it is production-quality or only partially good;
- evidence and verification level.

Do not give generic praise. Only mention things supported by code, tests, logs, or clear evidence.

---

# 8. Bad Parts / Weak Parts

List the weak points in the implementation.

Look specifically for:

- incomplete logic;
- fake fixes;
- placeholder code presented as complete;
- hardcoded values;
- duplicated code;
- fragile conditions;
- poor error handling;
- bad state management;
- UI that looks fixed but is not logically fixed;
- missing loading/error states;
- broken mobile behavior;
- broken edge cases;
- inconsistent naming;
- unnecessary complexity;
- unsafe assumptions;
- code that works only for one scenario;
- code that will be hard to maintain.

For each problem, provide:

- file/location;
- what is wrong;
- why it matters;
- severity;
- how to fix it properly;
- verification level.

---

# 9. Dangerous / Unsafe / Vulnerable Parts

Perform a security and safety review.

Check for:

- exposed secrets or keys;
- unsafe environment variable usage;
- missing authentication checks;
- missing authorization checks;
- broken role-based access control;
- multi-tenant data leaks;
- users accessing another organization’s data;
- insecure API routes;
- missing server-side validation;
- trusting client-side values too much;
- SQL injection or query risks;
- unsafe Supabase policies or missing RLS;
- unsafe file uploads;
- unsafe delete operations;
- missing audit logs for sensitive actions;
- broken financial calculations;
- race conditions;
- data loss risks;
- dangerous migrations;
- personal data or PII handled badly.

Classify each issue:

| Issue | Severity | Evidence | Impact | Fix |
|---|---|---|---|---|

Severity must be one of:

- Critical
- High
- Medium
- Low

---

# 10. Data Quality / Future Data Impact

This project stores customer and merchant operational data. Even if ML is not currently implemented, bad data now can create future reporting, billing, compliance, and analytics problems.

Analyze whether the latest changes make the data cleaner or dirtier.

Check for:

- duplicate organizations;
- duplicate customers;
- duplicate memberships;
- missing normalization;
- inconsistent slugs;
- inconsistent field names;
- inconsistent categories/statuses;
- mixed raw and cleaned data;
- missing timestamps;
- missing source metadata;
- missing audit trail;
- invalid or unvalidated values;
- PII stored unnecessarily;
- stale data;
- no retention policy;
- values that are useful for UI but bad for future reporting;
- data that cannot be trusted later.

Explain:

- what data became cleaner;
- what data became more dangerous;
- what would hurt future reporting/billing/analytics;
- what should be normalized now before the project grows.

---

# 11. Project Architecture Impact

Explain how the changes affect the architecture.

Check:

- Did Codex respect the existing architecture?
- Did it add files in the correct place?
- Did it create unnecessary abstractions?
- Did it over-centralize logic?
- Did it duplicate logic?
- Did it mix UI, business logic, database logic, and validation in the wrong place?
- Did it preserve separation between public pages, dashboard pages, admin pages, backend/API, database, and services?
- Did it create technical debt?

Give a clear architecture judgment:

- Clean
- Acceptable
- Fragile
- Messy
- Dangerous

Explain why.

---

# 12. Testing / Validation Results

Report exactly what was tested.

Use this table:

| Check | Command/Method | Result | Verified? |
|---|---|---|---|

Include if possible:

- git status;
- commit comparison;
- lint;
- typecheck;
- tests;
- build;
- local run;
- live deployment check;
- database migration check;
- Supabase/RLS check;
- manual auth flow check;
- manual organization onboarding check;
- dashboard route protection check;
- browser/mobile check;
- API route check.

If tests were not run, explain why and what risk remains.

Do not claim anything is verified unless it is actually verified.

---

# 13. Deployment Readiness

Decide whether this can be deployed safely.

Check:

- Does the build pass?
- Are required environment variables documented?
- Are migrations safe?
- Are database changes backward-compatible?
- Is the UI usable?
- Are core auth/onboarding/dashboard flows working?
- Are dangerous operations protected?
- Are financial/data operations correct?
- Are logs/errors clean?
- Are there any production blockers?

Give a final deployability rating from 0 to 10.

Explain:

- 10 = safe to deploy now;
- 7-9 = deployable with minor known risks;
- 4-6 = not ready, needs fixes;
- 1-3 = dangerous or broken.

---

# 14. Blocking Issues

List only the issues that must be fixed before production.

Use this format:

## Blocker 1 — [Title]

- Severity:
- Evidence:
- Why it blocks deployment:
- Exact fix needed:
- Files likely involved:
- How to verify the fix:

---

# 15. Non-Blocking Improvements

List improvements that are useful but not urgent.

Separate:

## Code Quality Improvements

1. ...

## UI/UX Improvements

1. ...

## Performance Improvements

1. ...

## Security Hardening

1. ...

## Testing Improvements

1. ...

## Data Quality Improvements

1. ...

## Documentation Improvements

1. ...

---

# 16. Questions Codex Failed to Answer

List anything Codex’s changes did not prove.

Examples:

- Does this work with real Supabase production data?
- Does this work for multiple users?
- Does this work for multiple organizations?
- Does this work when a user has no organization?
- Does this work when a user has multiple organizations?
- Does this work after refresh?
- Does this work on mobile?
- Does it survive bad input?
- Does duplicate slug handling work?
- Does route protection work after deployment?
- Does RLS actually block cross-tenant access?
- Does it preserve historical records?
- Does it avoid sending real SMS?

---

# 17. Recommended Next Actions

Give a prioritized action plan.

Use this format:

## Immediate Fixes

1. ...
2. ...

## Next Push

1. ...
2. ...

## Later Cleanup

1. ...
2. ...

---

# 18. Corrective Prompt for Codex

Write a precise follow-up prompt I can give to Codex to fix the remaining issues.

The prompt must:

- tell Codex to read the repo first;
- identify the root cause;
- make minimal safe changes;
- preserve the existing architecture;
- avoid fake fixes;
- avoid invented files, APIs, tables, or dependencies;
- validate with lint/build/tests/typecheck if available;
- list modified files;
- explain what was verified and what was not verified.

End the Codex prompt with this exact sentence:

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.

---

# 19. Final Summary for a Non-Technical Owner

Explain in simple terms:

- what Codex improved;
- what is still risky;
- whether I can trust the push;
- whether I should deploy;
- what I should ask Codex to fix next.

Be direct. Do not sugarcoat. If the project is not ready, say clearly that it is not ready.

---

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.

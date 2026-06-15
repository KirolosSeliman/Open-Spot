# Vercel Deployment Root Cause

## 1. Repository verified

- Expected repository: `KirolosSeliman/Open-Spot`
- Actual remote: `https://github.com/KirolosSeliman/Open-Spot.git`
- Repository root: `C:/Documents/Github Kirolos/2e chance RDV`
- Branch used: `codex/NouveauUITemplate`
- Latest commit tested before this fix: `73c872a81421b2aa6c1977682a2005e1d2578e91`

## 2. Vercel failing command

- Known prior Vercel failure stage: dependency installation, with `npm error Invalid Version:`
- Known later Vercel command from the reset note: `next build --webpack`
- Direct Vercel logs were not available from this workspace. The Vercel connector returned `403 Not authorized`, and `npx vercel@54.12.2 build --debug` could not be used without downloading and executing the Vercel CLI package in the local environment.

## 3. Exact local commands run

- `git status`
- `git branch --show-current`
- `git remote -v`
- `git rev-parse --show-toplevel`
- `node -v`
- `npm.cmd -v`
- Package-lock malformed-entry diagnostic:
  - `node -e "const fs=require('fs'); const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8')); let bad=false; for (const [name,pkg] of Object.entries(lock.packages||{})) { if (name && !pkg.link && !pkg.version) { console.log(name, pkg); bad=true; } } process.exit(bad ? 1 : 0);"`
- `Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue`
- `npm.cmd install`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd ls --depth=0`

PowerShell blocks `npm.ps1` on this machine, so `npm.cmd` was used for npm commands.

## 4. Exact failing local command

The first malformed-entry diagnostic passed before install. After `npm.cmd install`, `package-lock.json` was modified and the diagnostic failed with:

```text
node_modules/@img/sharp-wasm32/node_modules/@emnapi/runtime { optional: true }
```

That lockfile package entry had no `version`, which matches the package-lock shape that can produce npm's `Invalid Version` install failure.

## 5. Root cause classification

- Classification: package lock / package manager failure.
- Exact malformed entry: `packages["node_modules/@img/sharp-wasm32/node_modules/@emnapi/runtime"]`
- The entry was an optional transitive dependency under `@img/sharp-wasm32`.
- `npm install` created the entry with only `{ "optional": true }`, leaving out `version`, `resolved`, `integrity`, license, and dependency metadata.

## 6. Files inspected

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `src/app/layout.tsx`
- `src/lib/i18n/locale.ts`
- `src/lib/env/config.ts`
- `src/lib/supabase/server.ts`

The build-relevant app files did not require changes because local `next build --webpack` completed successfully through compilation, TypeScript, page data collection, static page generation, optimization, and trace collection.

## 7. Minimal fix chosen

`package-lock.json` was updated only for the malformed optional dependency entry, using registry metadata for `@emnapi/runtime@1.11.1`, which satisfies `@img/sharp-wasm32`'s `^1.7.0` dependency range.

The completed entry includes:

- `version`
- `resolved`
- `integrity`
- `license`
- `optional`
- `dependencies`

A small Vitest lockfile integrity test was added so future malformed non-link package entries fail `npm run test` before deployment.

## 8. Why the fix is safe

- No runtime application code changed.
- No auth, dashboard, SMS, Twilio, simulator, consent, STOP/opt-out, or manual merchant validation logic changed.
- No dependency versions in `package.json` changed.
- The lockfile was not regenerated wholesale.
- The fix only completes missing metadata for one optional transitive dependency entry.

## 9. Commands rerun after fix

- `Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue`: passed
- `npm.cmd install`: passed; emitted optional WASM peer dependency warnings, but no install failure
- `npm.cmd run lint`: passed
- `npm.cmd run typecheck`: passed
- `npm.cmd run test`: passed, 64 test files and 355 tests
- `npm.cmd run build`: passed; `next build --webpack` completed compilation, TypeScript, page data collection, static generation, optimization, and trace collection
- Package-lock malformed-entry diagnostic after install/build: passed

## 10. Final result

Local verification passed. The lockfile no longer contains any non-link package entry without a `version`, and the test suite now guards that condition.

## 11. Whether Vercel was redeployed

Pending push to `codex/NouveauUITemplate`.

## 12. Remaining risks

- Direct Vercel deployment logs are not available from this workspace because the connector is unauthorized for the project scope.
- A local Vercel CLI debug build was not run because it requires downloading and executing the Vercel CLI package.
- If Vercel continues to fail after this lockfile fix, the next required evidence is the new full Vercel build log for the pushed commit.

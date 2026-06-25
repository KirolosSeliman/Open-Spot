# Git Workflow - UI Redesign

`main` reste la branche stable de production.

`ui-redesign-main` est la branche centrale temporaire pour le nouveau UI. Toutes les branches UI doivent partir de `ui-redesign-main` et les PR UI doivent cibler `ui-redesign-main`.

## Creer Une Branche UI

```bash
git checkout ui-redesign-main
git pull origin ui-redesign-main
git checkout -b ui/nom-court-du-changement
```

Utiliser des noms explicites:

- `ui/hero-phone-section`
- `ui/dashboard-redesign`
- `ui/mobile-polish`
- `ui/auth-onboarding`
- `fix/vercel-build`
- `chore/repo-cleanup`

## Avant Chaque PR

Executer:

```bash
npm run build
npm run lint
npm run typecheck
npm run test
```

La PR ne doit pas etre ouverte si le build, le lint, le typecheck ou les tests echouent.

## Regles De Merge

Les PR UI ciblent `ui-redesign-main`, pas `main`.

`main` ne recoit pas de changements UI experimentaux. Quand le redesign est termine, teste, revu et valide, `ui-redesign-main` sera mergee dans `main` via une PR finale.

## A Ne Jamais Faire

- Ne pas force-push `main`.
- Ne pas changer la branche par defaut GitHub sans validation explicite.
- Ne pas supprimer une branche distante sans backup et validation explicite.
- Ne pas merger une migration Supabase dans une branche purement UI sans revue database.
- Ne pas presenter une reponse SMS positive comme une confirmation automatique.
- Ne pas casser la regle produit: un client qui repond `oui`, `yes` ou `1` devient seulement une reponse en attente de validation manuelle.

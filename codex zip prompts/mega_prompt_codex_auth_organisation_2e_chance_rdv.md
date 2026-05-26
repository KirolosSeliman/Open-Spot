# Mega Prompt Codex — Phase Auth + Organisation Workspace for 2e Chance RDV

Tu es un ingénieur full-stack senior spécialisé en Next.js App Router, TypeScript, Supabase Auth, Supabase Postgres, Row Level Security, architecture SaaS multi-tenant, sécurité applicative, QA et revue de code production.

Tu travailles sur le repo GitHub :

`KirolosSeliman/2e-chance-RDV`

Le projet s’appelle **2e Chance RDV**.

---

## 1. Contexte produit

2e Chance RDV est un SaaS indépendant, complètement séparé de Vistaire.

Le produit aide les commerces à rendez-vous, surtout esthétique, barbiers et salons, à remplir leurs annulations de dernière minute par SMS.

Le positionnement produit est :

> Remplir les annulations de dernière minute par SMS sans remplacer le système de rendez-vous actuel du commerce.

Le produit ne doit pas devenir un clone de Fresha, Booksy, Square, GOrendezvous ou Calendly. Il doit rester une couche légère de récupération d’annulations.

---

## 2. État actuel connu du projet

Le repo contient déjà :

- Next.js App Router
- TypeScript
- Tailwind
- Supabase packages
- scripts `dev`, `build`, `lint`, `typecheck`, `test`
- pages publiques et dashboard placeholder
- migrations Supabase
- types Supabase partiels
- logique de consentement
- logique de parsing CSV
- logique SMS simulator
- placeholders Plivo/Twilio
- routes API placeholders
- documentation produit, architecture, sécurité, roadmap, limitations

Le projet Supabase existe déjà.

Project URL :

```text
https://fuksavmwmfqyfmjcbgsx.supabase.co
```

Project ref :

```text
fuksavmwmfqyfmjcbgsx
```

Les migrations Supabase ont déjà été appliquées par l’utilisateur. Tu dois quand même inspecter les migrations présentes dans le repo pour comprendre le schéma, mais tu ne dois pas recréer tout le schéma inutilement.

Le fichier `.env.local` local contient normalement :

```env
NEXT_PUBLIC_SUPABASE_URL=https://fuksavmwmfqyfmjcbgsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SMS_PROVIDER=simulator
ALLOW_REAL_SMS_SENDS=false
APP_BASE_URL=http://localhost:3000
```

Ne jamais afficher, logger, hardcoder ou committer les secrets.

---

## 3. Objectif unique de cette tâche

Objectif principal :

> Rendre l’authentification Supabase + la création d’organisation + le workspace dashboard fonctionnels de bout en bout.

Cette tâche doit transformer le projet d’un simple squelette/placeholder en une base SaaS réellement utilisable pour un commerce qui crée un compte, crée son organisation, devient owner, puis accède à son dashboard.

---

## 4. Scope strict

Tu dois faire uniquement cette phase :

### Inclus dans cette tâche

1. Lire et comprendre le repo complet.
2. Vérifier les fichiers clés :
   - `package.json`
   - `.env.example`
   - `src/app`
   - `src/lib/auth`
   - `src/lib/supabase`
   - `src/types/database.ts`
   - `supabase/migrations`
   - `docs/known-limitations.md`
   - `docs/deployment-guide.md`
3. Implémenter un vrai sign-up Supabase.
4. Implémenter un vrai sign-in Supabase.
5. Implémenter un vrai sign-out.
6. Créer un flux d’onboarding après inscription.
7. Permettre la création d’une organisation.
8. Créer automatiquement un lien `organization_members` avec rôle `owner`.
9. Charger l’organisation active de l’utilisateur.
10. Protéger `/dashboard` et toutes ses sous-pages.
11. Rediriger correctement :
    - utilisateur non connecté → `/sign-in`
    - utilisateur connecté sans organisation → onboarding organisation
    - utilisateur connecté avec organisation → dashboard
12. Afficher dans le dashboard des données réelles minimales de l’organisation.
13. Ajouter une base simple pour gérer l’organisation active.
14. Ne pas casser les pages existantes.
15. Mettre à jour les types TypeScript si nécessaire.
16. Ajouter ou ajuster les tests utiles.
17. Mettre à jour la documentation si certains fichiers/changements doivent être expliqués.

### Exclu de cette tâche

Ne pas faire maintenant :

- vrai SMS Plivo
- vrai SMS Twilio
- Stripe
- billing complet
- import CSV connecté
- QR waitlist complet si déjà non bloquant
- opening creation complet
- send-opening complet
- inbound SMS persistant complet
- design avancé
- intégrations Square/Fresha/Booksy
- refonte complète du UI
- nouvelle grosse architecture inutile

Si tu trouves des problèmes liés à ces sujets, documente-les dans les limites ou TODOs, mais ne les implémente pas dans cette phase.

---

## 5. Règles de sécurité obligatoires

Tu dois respecter absolument :

1. Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` dans le client.
2. Ne jamais hardcoder de secrets.
3. Ne jamais committer `.env.local`.
4. Ne jamais logger les tokens Supabase.
5. Ne jamais contourner RLS avec du client-side code.
6. Ne jamais permettre à un utilisateur d’accéder aux organisations d’un autre utilisateur.
7. Ne jamais faire confiance à un `organization_id` envoyé depuis le client sans vérifier la session et membership côté serveur.
8. Ne jamais affaiblir les policies RLS pour “faire marcher” le code.
9. Ne jamais activer de vrai SMS.
10. Garder `SMS_PROVIDER=simulator` et `ALLOW_REAL_SMS_SENDS=false`.
11. Si le service role est nécessaire, il doit être utilisé uniquement dans une route/server action strictement contrôlée et justifiée.
12. Pour la création d’organisation + owner membership, privilégier une approche sécurisée :
    - soit RPC Supabase contrôlée,
    - soit route/server action serveur avec service role,
    - mais jamais insertion sensible directement depuis le client sans contrôle.

---

## 6. Travail demandé en détail

### A. Audit initial obligatoire

Avant de modifier quoi que ce soit :

1. Lire le repo.
2. Identifier l’état réel :
   - auth actuelle
   - pages sign-in/sign-up actuelles
   - dashboard guard actuel
   - structure Supabase actuelle
   - migrations existantes
   - types DB existants
3. Déterminer s’il manque une table, une fonction RPC ou une policy pour créer l’organisation.
4. Ne pas supposer : vérifier dans les fichiers.

Dans ta réponse finale, tu devras dire ce que tu as trouvé.

### B. Auth Supabase réelle

Implémenter ou corriger :

1. Page `/sign-in`
   - formulaire email/password
   - validation simple
   - affichage erreur
   - redirection après connexion
2. Page `/signup`
   - formulaire email/password
   - création compte Supabase Auth
   - redirection vers onboarding organisation
3. Sign-out
   - bouton ou action accessible dans le header/dashboard
   - `supabase.auth.signOut` côté serveur/client selon l’architecture choisie
   - redirection vers `/sign-in`

Contraintes :

- UI simple, professionnelle, propre.
- Pas de dépendance inutile.
- Ne pas exposer secrets.
- Garder les formulaires compatibles Next.js App Router.

### C. Onboarding organisation

Créer un vrai flow après signup.

Route recommandée :

```text
/onboarding
```

ou :

```text
/dashboard/onboarding
```

L’utilisateur connecté sans organisation doit arriver ici.

Le formulaire doit demander au minimum :

- nom du commerce
- slug souhaité ou slug auto-généré
- email du commerce optionnel
- téléphone optionnel
- timezone, par défaut Canada/Québec ou `America/Toronto` / `America/Montreal` selon ce qui est le plus cohérent
- langue par défaut : `fr` ou `en`

À la soumission :

1. Créer une row `organizations`.
2. Créer une row `organization_members`.
3. Associer l’utilisateur courant avec rôle `owner`.
4. Créer les settings de base si la migration les prévoit.
5. Rediriger vers `/dashboard`.

Important :

- Le slug doit être normalisé.
- Le slug doit respecter la contrainte SQL si elle existe.
- Gérer le cas slug déjà utilisé.
- Ne pas permettre à un utilisateur anonyme de créer une organisation.
- Ne pas permettre à un utilisateur de créer une organisation pour quelqu’un d’autre.

### D. Organisation active

Créer des helpers propres, par exemple :

```text
src/lib/organization/current.ts
src/lib/organization/actions.ts
src/lib/auth/session.ts
```

Fonctions attendues :

- récupérer l’utilisateur connecté
- récupérer ses organisations
- récupérer l’organisation active
- déterminer si l’utilisateur a au moins une organisation
- rediriger si nécessaire

Si l’utilisateur appartient à plusieurs organisations, tu peux pour l’instant prendre la première organisation comme organisation active, mais documente cette limite. Ne construis pas encore un switcher complet sauf si c’est simple et non bloquant.

### E. Dashboard connecté minimalement

Modifier `/dashboard` pour afficher de vraies informations minimales :

- nom organisation
- rôle utilisateur
- langue par défaut
- timezone
- nombre de services si facile
- nombre de clients si facile
- message indiquant que les flows import/SMS/openings restent les prochaines phases

Ne pas afficher seulement des `0` hardcodés si Supabase est configuré et si l’utilisateur a une organisation.

### F. Route protection

Toutes ces routes doivent être protégées :

```text
/dashboard
/dashboard/*
```

Comportement attendu :

- non connecté → `/sign-in`
- connecté sans organisation → onboarding
- connecté avec organisation → accès dashboard

Les routes publiques doivent rester publiques :

```text
/
 /pricing
 /contact
 /privacy
 /terms
 /b/[slug]/waitlist
```

Admin :

- ne pas ouvrir `/admin` aux marchands normaux.
- Si l’admin n’est pas encore complet, il doit rester fermé ou afficher un état verrouillé.
- Ne pas rendre `/admin` accessible avec de vraies données sans vraie vérification `PLATFORM_ADMIN_EMAILS`.

### G. Types Supabase

Vérifier `src/types/database.ts`.

Si les migrations ont plus de tables que les types, corriger les types manuellement ou ajouter une note claire si la génération automatique n’est pas possible.

Le code TypeScript doit compiler.

### H. Tests

Ajouter ou corriger les tests utiles, par exemple :

- slug normalization
- auth redirect helper si testable
- organization creation payload validation
- permissions helper
- no client exposure of service role si testable
- dashboard metrics existants ne doivent pas casser

Ne crée pas des tests inutiles qui mockent tout sans valeur.

### I. Documentation

Mettre à jour si nécessaire :

- `docs/known-limitations.md`
- `docs/deployment-guide.md`
- `README.md`

Seulement si les changements rendent certains textes faux.

Par exemple, si l’auth devient fonctionnelle, mettre à jour les limitations pour retirer ou nuancer “Auth UI is placeholder-level”.

---

## 7. Critères de réussite

La phase est réussie seulement si :

1. `npm run lint` passe.
2. `npm run typecheck` passe.
3. `npm test` passe.
4. `npm run build` passe.
5. Un utilisateur peut créer un compte.
6. Un utilisateur peut se connecter.
7. Un utilisateur connecté sans organisation est envoyé vers onboarding.
8. Un utilisateur peut créer son organisation.
9. L’utilisateur devient `owner`.
10. Le dashboard affiche son organisation réelle.
11. Un utilisateur non connecté ne peut pas accéder au dashboard.
12. Les secrets ne sont jamais exposés.
13. Le vrai SMS reste désactivé.
14. Aucun changement hors scope majeur n’est introduit.

Si tu ne peux pas tester un élément parce que l’environnement Codex ne contient pas les variables Supabase, tu dois :

- le dire clairement ;
- garder le code testable localement ;
- donner les étapes exactes pour que l’utilisateur teste localement.

---

## 8. Commandes de validation obligatoires

Exécute au minimum :

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Si une commande échoue :

1. Ne cache pas l’échec.
2. Corrige si c’est dans ton scope.
3. Relance la commande.
4. Si impossible, explique précisément pourquoi.

Tu peux aussi exécuter :

```bash
git status
```

pour lister les fichiers modifiés.

---

## 9. Ce que tu ne dois pas faire

Ne fais pas :

- refonte complète du projet ;
- nouvelle stack ;
- ajout de Clerk ;
- ajout de Prisma sauf nécessité extrêmement justifiée ;
- ajout de dépendances lourdes ;
- SMS réel ;
- Stripe ;
- nouvelle migration massive qui duplique les tables ;
- suppression des migrations existantes ;
- suppression des tests existants pour cacher un problème ;
- baisse de sécurité RLS ;
- stockage de secrets dans le repo ;
- commits automatiques sans demande explicite.

---

## 10. Format de réponse final obligatoire

À la fin, réponds exactement avec cette structure :

```md
## Verdict

Complete / Partially complete / Blocked

## Résumé

Court résumé de ce qui a été fait.

## Ce qui fonctionne maintenant

- ...

## Fichiers modifiés

- `path/to/file` — explication courte

## Détails techniques importants

- Auth:
- Organization onboarding:
- Dashboard protection:
- Supabase/RLS:
- Security:

## Validation exécutée

- `npm run lint` — résultat
- `npm run typecheck` — résultat
- `npm test` — résultat
- `npm run build` — résultat

## Ce qui n’a pas pu être vérifié

- ...

## Risques restants

- ...

## Prochaine étape recommandée

Une seule prochaine étape claire.
```

---

## 11. Rappel du projet

Tu dois rester concentré sur l’objectif :

> Auth Supabase + organisation workspace fonctionnels de bout en bout.

Quand cette base sera stable, les prochaines phases seront :

1. import CSV connecté à Supabase ;
2. waitlist QR complète ;
3. openings connectés ;
4. SMS simulator end-to-end ;
5. vrai Plivo/Twilio seulement après simulation parfaite.

Ne passe pas à ces phases maintenant.

---

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.

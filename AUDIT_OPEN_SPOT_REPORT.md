# Audit Open Spot / 2e Chance RDV

## Correctifs appliqués après audit

- Statut technique après correction : `npm run lint`, `npm test`, `npm run build`, `npm run typecheck` et `npm audit` passent.
- P0-01 corrigé : la création de compte public par email seul est désactivée côté UI et côté server action.
- P0-02 corrigé/mitigé : les envois opening, consentement, confirmation et scheduled SMS créent une ligne `sms_messages` avant l'appel provider; STOP non lié tente maintenant l'opt-out par numéro; le fallback inbound global ne choisit plus une organisation ambiguë.
- P0-03 corrigé : `/api/sms/send-opening` ne lit plus `organizationId` client et n'utilise plus service role; la route est désactivée en `410`.
- P0-04 reclassé : la migration `supabase/migrations/20260627190000_organization_sms_senders.sql` existe déjà et couvre les tables SMS sender/test runs avec RLS et révocations.
- P0-05 corrigé côté code : les placeholders `À compléter` sont supprimés; `LEGAL_CONTACT_EMAIL` et `LEGAL_BUSINESS_ADDRESS` sont obligatoires en production Vercel.
- P1 corrigés ou fortement réduits : consent request SMS autorisé uniquement pour `needs_consent`, route inbound legacy alignée sur la validation Twilio account-aware, rate limiting public ajouté, reset password self-service exposé, lint/typecheck/tests/build verts, parsing HELP/STOP/OUI durci, idempotence inbound ajoutée via migration unique.
- Point non vérifiable localement : les variables légales officielles et les migrations doivent encore être appliquées/configurées en environnement de production Supabase/Vercel avant client réel.

## A. Verdict global

- Prêt pour vrais clients : Non
- Niveau de risque : Critique
- Décision recommandée : Ne pas lancer
- Les 5 plus gros risques :
  1. P0-01 : création/activation de compte client possible avec seulement un email approuvé, sans lien d'invitation ni preuve de possession de l'email.
  2. P0-03 : route service-role non authentifiée acceptant un `organizationId` arbitraire sur l'endpoint SMS opening.
  3. P0-04 : tables SMS par organisation présentes dans les types/code mais sans migration SQL observée.
  4. P0-02 : un STOP peut ne pas être appliqué si la réponse SMS ne peut pas être reliée à un contexte sortant, notamment après désynchronisation Twilio -> DB.
  5. P0-05 : pages légales avec placeholders `À compléter`, bloquant conformité avant go-live.

Preuve importante sur la règle produit absolue : je n'ai pas trouvé de logique qui confirme automatiquement le premier répondant. Les réponses positives SMS mettent l'offre en `responded`, créent une demande `pending_merchant_validation`, et passent l'ouverture à `awaiting_validation` dans `src/lib/sms/inbound-handler.ts` lignes 732-823. La confirmation finale passe par le bouton manuel `Confirmer` dans `src/components/responses/OpeningResponseRowActions.tsx` lignes 46-59 puis par `src/app/api/openings/[id]/validate/route.ts` lignes 76-123 et le RPC `public.validate_opening_offer` dans `supabase/migrations/20260528191000_harden_validate_opening_offer_authorization.sql` lignes 53-108.

## B. Commandes exécutées

- Commande : `pwd`
  - Résultat : succès
  - Preuve ou erreur importante : `C:\Documents\Github Kirolos\2e chance RDV`
  - Impact : confirme le repo audité.

- Commande : `git status --short`
  - Résultat : succès
  - Preuve ou erreur importante : sortie vide lors de l'exécution directe.
  - Impact : aucun changement source préexistant visible au moment de l'audit final. Le snapshot initial fourni listait des fichiers `.next` non suivis, mais la commande exécutée ensuite ne les a pas listés.

- Commande demandée : `find . -maxdepth 3 -type f | sort`
  - Résultat : remplacée par `Glob` pour respecter les contraintes d'outillage Cursor.
  - Preuve ou erreur importante : 726 fichiers détectés dans le workspace.
  - Impact : structure inspectée sans utiliser `find`.

- Commande demandée : `cat package.json`, `cat tsconfig.json`, etc.
  - Résultat : remplacée par `ReadFile`.
  - Preuve ou erreur importante : `package.json`, `tsconfig.json`, `middleware.ts`, `next.config.ts` lus; `supabase/config.toml` absent.
  - Impact : stack identifiée sans afficher de secrets.

- Commande : `npm run lint`
  - Résultat : échec
  - Preuve ou erreur importante : 4 erreurs, 5 warnings. Exemples : `Date.now` appelé pendant le render dans `src/components/admin/audit/audit-filters.tsx:79`; `setMounted(true)` dans un effet dans `src/components/clients/clients-page-content.tsx:318`.
  - Impact : qualité CI non prête. À corriger avant client #1.

- Commande : `npm run typecheck`
  - Résultat : échec
  - Preuve ou erreur importante : multiples `TS6053` sur `.next/types/app/...` inclus par `tsconfig.json`.
  - Impact : typecheck local/CI instable; risque de masquer de vraies erreurs TypeScript.

- Commande : `npm run build`
  - Résultat : succès
  - Preuve ou erreur importante : `next build --webpack` compile et génère les routes app.
  - Impact : build production passe dans cet environnement.

- Commande : `npm test`
  - Résultat : échec
  - Preuve ou erreur importante : 10 tests échouent, dont `book-call-feature`, `dashboard-real-separation`, `waitlist-filters`, `organization-sms-sender`, `public-navigation`.
  - Impact : non prêt pour lancement; plusieurs tests couvrent précisément les workflows demandés.

- Commande : `npm audit`
  - Résultat : succès
  - Preuve ou erreur importante : `found 0 vulnerabilities`
  - Impact : aucune vulnérabilité npm connue détectée par cette commande.

## C. Fichiers et zones inspectés

Fichiers/dossiers réellement inspectés : `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `src/app/`, `src/app/api/`, `src/components/auth/`, `src/components/dashboard/`, `src/components/responses/`, `src/components/marketing/`, `src/components/admin/`, `src/lib/auth/`, `src/lib/organization/`, `src/lib/dashboard/`, `src/lib/responses/`, `src/lib/sms/`, `src/lib/openings/`, `src/lib/book-call/`, `src/lib/admin/`, `src/lib/supabase/`, `src/types/database.ts`, `supabase/migrations/`, `tests/unit/`, `docs/`, `public/`.

Dossiers demandés absents ou non observés comme dossiers racine directs : `pages/`, `utils/`, `hooks/`, `services/`, `server/`, `api/`, `migrations/`, `types/`, `scripts/`, `e2e`. Le projet utilise surtout `src/app`, `src/lib`, `src/components`, `supabase/migrations`, `src/types`.

## D. P0 — Bloquants avant premier client

- ID : P0-01
  - Titre : création de compte client possible par email seul
  - Gravité : P0
  - Fichier(s) : `src/components/auth/create-account-form.tsx`, `src/lib/auth/approved-client-account.ts`
  - Ligne(s) : `create-account-form.tsx` lignes 57-97; `approved-client-account.ts` lignes 149-184, 236-242, 270-278
  - Preuve dans le code : le formulaire public `/signup` demande seulement email + mot de passe. `createApprovedClientAccount()` vérifie qu'un `book_call_requests.email` est approuvé, puis crée/confirme l'utilisateur via admin ou met à jour son mot de passe, et active `organization_members`.
  - Pourquoi c'est dangereux : toute personne connaissant l'email du propriétaire approuvé peut potentiellement prendre le compte avant lui ou réinitialiser un utilisateur invité non actif.
  - Impact client/business : accès non autorisé au dashboard d'un commerce, données clients exposées, possibilité d'envoyer des SMS au nom du commerce.
  - Correction recommandée : supprimer le signup public par email seul; exiger un lien Supabase invite/recovery valide ou un token d'activation serveur à usage unique lié à `organization_id`, expiré et consommé.
  - Test de validation : tenter `/signup` avec email approuvé sans lien d'invitation; attendu : refus. Tester lien d'invitation valide; attendu : création mot de passe puis accès seulement à l'organisation liée.

- ID : P0-02
  - Titre : STOP peut ne pas être appliqué si la réponse SMS est non reliée
  - Gravité : P0
  - Fichier(s) : `src/lib/sms/inbound-handler.ts`, `src/lib/dashboard/actions.ts`, `src/lib/sms/opening-confirmation.ts`
  - Ligne(s) : `inbound-handler.ts` lignes 246-356; `actions.ts` lignes 1754-1799; `opening-confirmation.ts` lignes 227-264
  - Preuve dans le code : pour un inbound sans `context.organization_id` et sans `organizationSender`, la route retourne `received_unlinked` sans `sms_consents.upsert`. Les envois opening/confirmation appellent Twilio avant d'insérer `sms_messages`; si l'insertion échoue après l'envoi, la réponse suivante peut ne pas avoir de contexte sortant.
  - Pourquoi c'est dangereux : un client peut envoyer STOP et rester opt-in côté application si le contexte n'est pas retrouvé.
  - Impact client/business : non-respect opt-out, risque légal/compliance, perte de confiance immédiate.
  - Correction recommandée : persister un enregistrement `sms_messages` en état `pending_send` avant Twilio, envoyer avec l'id interne en métadonnées si possible, puis mettre à jour; pour les STOP non reliés, tenter une résolution par numéro client dans toutes les organisations possibles du sender, ou journaliser en file de remédiation P0 bloquante.
  - Test de validation : simuler SMS sortant envoyé mais sans ligne `sms_messages`, puis inbound STOP; attendu : consentement opt-out appliqué ou incident bloquant visible avec action admin.

- ID : P0-03
  - Titre : route service-role SMS opening non authentifiée avec `organizationId` arbitraire
  - Gravité : P0
  - Fichier(s) : `src/app/api/sms/send-opening/route.ts`
  - Ligne(s) : lignes 19-65
  - Preuve dans le code : la route crée un client `createSupabaseServiceClient()`, lit `organizationId` depuis la requête, charge la readiness SMS de cette organisation et ne vérifie ni session, ni rôle, ni secret serveur. Elle retourne actuellement `501`, mais la frontière d'autorisation est déjà incorrecte.
  - Pourquoi c'est dangereux : dès que la route est branchée, un appel externe pourrait agir sur n'importe quel tenant avec privilèges service-role.
  - Impact client/business : déclenchement SMS ou mutation cross-tenant possible au moment de l'activation de cette route.
  - Correction recommandée : supprimer la route si elle est morte, ou exiger authentification serveur + workspace dérivé côté session + permission `canManageOpenings/canSendSms`; ne jamais accepter `organizationId` client avec service role.
  - Test de validation : POST anonyme et POST user org A avec `organizationId` org B doivent échouer.

- ID : P0-04
  - Titre : tables SMS par organisation absentes des migrations
  - Gravité : P0
  - Fichier(s) : `src/types/database.ts`, `src/lib/sms/organization-sender.ts`, `src/lib/sms/organization-sms.ts`, `supabase/migrations/`
  - Ligne(s) : `organization-sms.ts` lignes 120-125; types autour de `organization_sms_senders` et `sms_setup_test_runs`
  - Preuve dans le code : le code charge `organization_sms_senders` et écrit/lit `sms_setup_test_runs`; recherche sous `supabase/` pour ces noms : aucun SQL de création observé.
  - Pourquoi c'est dangereux : l'envoi Twilio par organisation dépend de tables qui peuvent ne pas exister en prod.
  - Impact client/business : workflow SMS réel cassé à l'exécution; impossibilité de configurer/routage sender par commerce.
  - Correction recommandée : ajouter/appliquer migrations idempotentes pour ces tables, RLS, indexes, contraintes et politiques; vérifier live schema.
  - Test de validation : migration fresh DB + test send org scoped + inbound routing par sender.

- ID : P0-05
  - Titre : pages légales avec placeholders de contact/adresse
  - Gravité : P0
  - Fichier(s) : `src/lib/legal/constants.ts`, `src/components/legal/LegalContentBlocks.tsx`
  - Ligne(s) : `constants.ts` lignes 10-14
  - Preuve dans le code : `LEGAL_CONTACT_EMAIL = "À compléter"` et `LEGAL_ADDRESS = "À compléter, si applicable"`.
  - Pourquoi c'est dangereux : privacy/terms/SMS consent ne sont pas publiables avec données légales incomplètes.
  - Impact client/business : non-conformité de base avant acquisition et SMS consent.
  - Correction recommandée : remplacer par coordonnées officielles validées ou retirer les promesses légales dépendantes jusqu'à confirmation.
  - Test de validation : pages légales publiques ne contiennent plus `À compléter` et les contacts sont exploitables.

## E. P1 — Majeurs à corriger rapidement

- ID : P1-01
  - Titre : SMS de demande de consentement bloqué par la validation d'envoi
  - Gravité : P1
  - Fichier(s) : `src/lib/sms/consent-request.ts`, `src/lib/sms/organization-sms.ts`, `src/lib/sms/provider.ts`
  - Ligne(s) : `consent-request.ts` lignes 230-243; `organization-sms.ts` lignes 87-92; `provider.ts` lignes 71-80
  - Preuve dans le code : `sendConsentRequestSms()` passe `consentStatus: "needs_consent"` à `sendOrganizationSms()`. `sendOrganizationSms()` appelle `assertCanSendSms()`, qui rejette tout statut différent de `opted_in`.
  - Pourquoi c'est dangereux : le workflow d'obtention de consentement par SMS échoue systématiquement.
  - Impact client/business : activation liste d'attente ralentie; risque d'opérations manuelles et incohérentes avant lancement.
  - Correction recommandée : créer un chemin d'envoi explicite `consent_request` autorisé pour `needs_consent`, avec contenu strict, cooldown, max attempts et audit.
  - Test de validation : client `needs_consent` + numéro valide -> SMS de consentement envoyé/simulé; client `opted_out` -> aucune demande envoyée.

- ID : P1-02
  - Titre : lint/typecheck/tests non verts
  - Gravité : P1
  - Fichier(s) : `src/components/admin/audit/audit-filters.tsx`, `src/components/clients/clients-page-content.tsx`, `src/components/dashboard/appointments/new-appointment-form.tsx`, `tsconfig.json`, `tests/unit/*`
  - Ligne(s) : voir section B
  - Preuve dans le code/commandes : `npm run lint`, `npm run typecheck`, `npm test` échouent.
  - Pourquoi c'est dangereux : impossible de distinguer régression réelle et bruit; plusieurs tests échoués portent sur navigation publique, séparation dashboard, waitlist, SMS admin.
  - Impact client/business : risque de livrer une version instable.
  - Correction recommandée : réparer lint, exclure `.next` généré du typecheck ou nettoyer l'include, mettre à jour/fixer les tests.
  - Test de validation : `npm run lint && npm run typecheck && npm test && npm run build`.

- ID : P1-03
  - Titre : endpoint API d'envoi opening non implémenté
  - Gravité : P1
  - Fichier(s) : `src/app/api/sms/send-opening/route.ts`
  - Ligne(s) : 60-66
  - Preuve dans le code : la route retourne `501` avec `Opening send persistence is not enabled...`.
  - Pourquoi c'est dangereux : endpoint exposé mais inutilisable; confusion pour intégrations et tests.
  - Impact client/business : si une UI ou intégration appelle cette route, le workflow principal casse.
  - Correction recommandée : supprimer la route si morte ou la brancher sur le même service que `createOpeningAction`.
  - Test de validation : POST authentifié/autorisé vers l'endpoint attendu; résultat réel documenté.

- ID : P1-04
  - Titre : envoi Twilio non atomique avec persistance DB
  - Gravité : P1
  - Fichier(s) : `src/lib/dashboard/actions.ts`, `src/lib/sms/opening-confirmation.ts`
  - Ligne(s) : `actions.ts` lignes 1754-1799; `opening-confirmation.ts` lignes 227-264
  - Preuve dans le code : Twilio/simulator est appelé avant l'insertion `sms_messages`.
  - Pourquoi c'est dangereux : SMS envoyé mais non visible, réponse non associée au bon opening, STOP potentiellement non appliqué.
  - Impact client/business : conversations perdues et support manuel en prod.
  - Correction recommandée : pattern outbox DB : créer d'abord un message interne, puis envoyer, puis mettre à jour provider id/status.
  - Test de validation : injecter une erreur DB après provider send; attendu : aucun SMS réel envoyé ou ligne outbox réconciliable.

- ID : P1-05
  - Titre : absence de rate limiting applicatif observée sur routes publiques
  - Gravité : P1
  - Fichier(s) : `src/app/api/book-call-requests/route.ts`, `src/app/api/waitlist/route.ts`, `src/app/api/webhooks/twilio/inbound/route.ts`
  - Ligne(s) : `book-call-requests` lignes 34-128; `waitlist` lignes 7-52
  - Preuve dans le code : validation de taille/honeypot existe pour book-call, mais aucun throttling IP/phone/email n'est appliqué.
  - Pourquoi c'est dangereux : spam leads, abus waitlist, coûts SMS indirects, bruit admin.
  - Impact client/business : crédibilité et données polluées dès acquisition réelle.
  - Correction recommandée : limiter par IP + email + téléphone + organization slug; stocker tentatives ou utiliser edge/WAF.
  - Test de validation : 20 soumissions identiques rapides -> blocage clair après seuil.

- ID : P1-06
  - Titre : HELP/UNSTOP incomplets côté inbound
  - Gravité : P1
  - Fichier(s) : `src/lib/sms/inbound.ts`, `src/lib/sms/message-generator.ts`
  - Ligne(s) : `inbound.ts` lignes 11-41; `message-generator.ts` lignes 241-244, 289-292
  - Preuve dans le code : les SMS mentionnent HELP/AIDE dans les confirmations, mais `classifyInboundSmsBody()` ne classe pas HELP/AIDE. `unstop` n'est accepté que comme opt-in dans le contexte consentement.
  - Pourquoi c'est dangereux : conformité SMS incomplète et support absent pour mots clés attendus.
  - Impact client/business : demandes d'aide ignorées, confusion utilisateur.
  - Correction recommandée : classifier HELP/AIDE et router vers une réponse d'aide ou un événement admin; définir comportement UNSTOP.
  - Test de validation : inbound HELP/AIDE/UNSTOP -> statut attendu et audit.

- ID : P1-07
  - Titre : reset password public peu découvrable
  - Gravité : P1
  - Fichier(s) : `src/app/sign-in/page.tsx`, `src/lib/auth/resend-actions.ts`
  - Ligne(s) : `sign-in/page.tsx` lignes 133-160; `resend-actions.ts` lignes 21-98
  - Preuve dans le code : la page login affiche email/password/signup, mais pas de lien visible “mot de passe oublié”; l'action recovery existe.
  - Pourquoi c'est dangereux : activation/support client bloqués dès les premiers comptes.
  - Impact client/business : dépendance à l'admin pour renvoyer les liens.
  - Correction recommandée : ajouter un flux visible “Mot de passe oublié” limité aux emails approuvés.
  - Test de validation : propriétaire actif oublie son mot de passe -> reçoit recovery et peut revenir au dashboard.

- ID : P1-08
  - Titre : tests de séparation dashboard échouent sur code attendu obsolète
  - Gravité : P1
  - Fichier(s) : `tests/unit/dashboard-real-separation.test.ts`, `src/app/dashboard/responses/page.tsx`
  - Ligne(s) : log `npm test`, test attend `loadAppointmentResponseCalendar`; code utilise `loadAppointmentCalendarItems`.
  - Preuve dans le code : test échoué ligne 79 selon log.
  - Pourquoi c'est dangereux : la couverture de séparation réelle/demo n'est plus fiable.
  - Impact client/business : un risque multi-tenant pourrait passer inaperçu.
  - Correction recommandée : aligner le test sur le comportement réel et ajouter assertions de filtres `organization_id`.
  - Test de validation : suite unit verte + test qui échoue si `@/lib/dashboard/mock-data` revient dans routes authentifiées.

- ID : P1-09
  - Titre : limites coût/SMS non appliquées au moment de l'envoi
  - Gravité : P1
  - Fichier(s) : `src/lib/billing/sms-cost-controls.ts`, `src/lib/sms/organization-sms.ts`, `src/lib/dashboard/actions.ts`, `src/lib/sms/scheduled-messages.ts`
  - Ligne(s) : `organization-sms.ts` lignes 77-166; `actions.ts` lignes 1587-1846
  - Preuve dans le code : `canSendSmsWithinLimits()` existe, mais n'est pas appelé dans les chemins d'envoi opening, org send ou scheduled messages.
  - Pourquoi c'est dangereux : un commerce peut dépasser limites journalières/mensuelles ou fenêtre d'envoi sans blocage applicatif.
  - Impact client/business : coûts SMS non maîtrisés et risque spam opérationnel.
  - Correction recommandée : centraliser l'enforcement dans `sendOrganizationSms()` avant tout provider send, puis incrémenter compteur dans une transaction/outbox.
  - Test de validation : quota atteint -> aucun SMS provider appelé.

- ID : P1-10
  - Titre : route legacy inbound SMS moins robuste que la route Twilio canonique
  - Gravité : P1
  - Fichier(s) : `src/app/api/sms/inbound/route.ts`, `src/app/api/webhooks/twilio/inbound/route.ts`, `src/lib/sms/twilio.ts`
  - Ligne(s) : route canonique lignes 15-23 selon audit; verifier global dans `twilio.ts`
  - Preuve dans le code : `/api/webhooks/twilio/inbound` utilise validation account-aware; `/api/sms/inbound` délègue au handler par défaut avec token global/provider.
  - Pourquoi c'est dangereux : webhooks subaccount configurés sur l'ancienne route peuvent échouer ou être validés avec un mauvais modèle.
  - Impact client/business : réponses SMS perdues ou mutations service-role moins bien protégées.
  - Correction recommandée : déprécier `/api/sms/inbound` ou l'aligner sur la validation account-aware et documenter l'URL unique Twilio.
  - Test de validation : webhook subaccount valide passe sur route canonique; route legacy refuse ou redirige explicitement.

- ID : P1-11
  - Titre : fallback inbound non scoppé tenant si résolution sender échoue
  - Gravité : P1
  - Fichier(s) : `src/lib/sms/inbound-handler.ts`
  - Ligne(s) : lignes 220-231
  - Preuve dans le code : la recherche du dernier outbound par téléphone/from-to ne filtre pas `organization_id` quand l'organisation sender n'est pas résolue.
  - Pourquoi c'est dangereux : avec sender partagé, la dernière conversation d'un numéro peut appartenir à une autre organisation.
  - Impact client/business : réponse associée au mauvais commerce dans un cas de fallback.
  - Correction recommandée : supprimer fallback global en production multi-tenant ou le limiter à un sender/organization déterministe; journaliser incident si ambigu.
  - Test de validation : même numéro contacté par org A et B avec sender partagé -> inbound ne doit jamais muter l'autre org.

- ID : P1-12
  - Titre : déduplication inbound non garantie par contrainte unique DB
  - Gravité : P1
  - Fichier(s) : `src/lib/sms/inbound-handler.ts`, `supabase/migrations/20260525180000_phase_2_multi_tenant_foundation.sql`
  - Ligne(s) : handler lignes 121-188; migration index lignes 306-308
  - Preuve dans le code : le handler vérifie `provider_message_id` avant insert, mais la migration observée crée un index, pas une contrainte unique.
  - Pourquoi c'est dangereux : deux webhooks concurrents du même MessageSid peuvent passer la vérification avant insertion.
  - Impact client/business : double rank, double booking request, audit bruité.
  - Correction recommandée : unique index partiel sur inbound `(provider, provider_message_id, direction)` et handler `on conflict do nothing`.
  - Test de validation : deux POST simultanés même MessageSid -> une seule mutation métier.

- ID : P1-13
  - Titre : onboarding marchand inexistant hors activation mot de passe
  - Gravité : P1
  - Fichier(s) : `src/app/onboarding/page.tsx`, `src/components/onboarding/`, `src/lib/organization/current.ts`
  - Ligne(s) : `onboarding/page.tsx` lignes 5-7
  - Preuve dans le code : `/onboarding` redirige seulement vers la destination post-auth; pas de `src/app/onboarding/[token]/page.tsx`, pas de composants onboarding observés.
  - Pourquoi c'est dangereux : premier client dépend d'une configuration admin et n'a pas de parcours guidé pour finaliser son compte/commerce.
  - Impact client/business : activation confuse et support manuel.
  - Correction recommandée : soit documenter officiellement activation invite-only et supprimer les attentes onboarding, soit ajouter parcours minimal de complétion business/SMS/billing.
  - Test de validation : nouveau marchand invité sait quoi faire jusqu'au dashboard utilisable sans aide.

## F. P2 — Améliorations importantes

- ID : P2-01
  - Titre : observabilité prod insuffisante
  - Gravité : P2
  - Fichier(s) : `src/app/api/webhooks/twilio/status/route.ts`, `src/lib/sms/webhook-events.ts` trouvé par imports
  - Preuve : logs DB/audit existent, mais pas d'alerting/monitoring externe détecté.
  - Correction recommandée : alertes sur `invalid_signature`, `status_unmatched`, `persistence_failed`, taux d'échec Twilio, STOP unlinked.

- ID : P2-02
  - Titre : timezone fallback incohérent dans génération fallback SMS
  - Gravité : P2
  - Fichier(s) : `src/lib/sms/message-generator.ts`, `src/lib/dashboard/actions.ts`
  - Preuve : `sendOpeningSmsAlerts()` calcule des labels timezone-aware pour templates, mais le fallback `generateOpeningSmsMessage()` formate sans passer `organization.timezone`.
  - Correction recommandée : ajouter `timezone` à `OpeningSmsInput`.

- ID : P2-03
  - Titre : UI mélange encore anglais/français dans le dashboard
  - Gravité : P2
  - Fichier(s) : `src/app/dashboard/cancellations/[id]/page.tsx`
  - Preuve : labels visibles `Appointment details`, `SMS preview`, `Prepared offers`, `Offer state`, `Manually validate this respondent`.
  - Correction recommandée : passer ces libellés dans `dashboard-copy`.

- ID : P2-04
  - Titre : composants marketing/CSS très volumineux
  - Gravité : P2
  - Fichier(s) : `src/components/marketing/lunera-open-spot-template.tsx`, `src/app/globals.css`
  - Preuve : composant landing > 2000 lignes; CSS global > 7000 lignes.
  - Correction recommandée : découpage ciblé après stabilisation lancement, pas une refonte.

- ID : P2-05
  - Titre : pas d'e2e réel observé
  - Gravité : P2
  - Fichier(s) : `tests/unit/`
  - Preuve : 88 tests unitaires trouvés; pas de dossier `e2e` observé.
  - Correction recommandée : ajouter e2e minimal auth -> dashboard -> opening -> reply webhook -> manual confirm.

- ID : P2-06
  - Titre : affichage d'identifiants provider dans UI client
  - Gravité : P2
  - Fichier(s) : `src/app/dashboard/cancellations/[id]/page.tsx`
  - Preuve : `Twilio Message SID / Provider message ID` rendu lignes 390-395.
  - Correction recommandée : masquer par défaut ou réserver aux admins/support.

## G. P3 — Mineurs / nettoyage

- Corriger les libellés sans accents : `Creez`, `Acces`, `reinitialisation`, etc.
- Nettoyer les tests source-string trop fragiles, ex. `book-call-feature.test.ts` échoue sur ordre de props JSX.
- Clarifier `APP_BASE_URL` vs `NEXT_PUBLIC_APP_URL` dans `src/lib/env/config.ts` et `src/lib/sms/runtime-status.ts`.
- Supprimer ou documenter les routes alias dupliquées `/login` -> `/sign-in`.
- Nettoyer warnings unused imports signalés par ESLint.

## H. Audit sécurité détaillé

### Auth

- Ce qui est prouvé OK : middleware utilise `supabase.auth.getUser()` pour routes privées; login passe par `signInWithPassword`; signup public Supabase brut est désactivé dans `signUpAction`.
- Ce qui est risqué : `/signup` maison crée/active un compte par email approuvé seulement; reset password peu visible; `set-password` dépend d'une session Supabase mais le signup parallèle contourne le lien.
- Ce qui est inconnu : configuration Supabase Auth prod, expiry des liens, domaines redirect.
- Actions recommandées : bloquer signup email-only, imposer token invitation/recovery, ajouter flux reset visible.

### Authorization

- Ce qui est prouvé OK : la plupart des server actions utilisent `getActiveOrganizationWorkspace()` puis filtrent par `organization_id`; validation manuelle vérifie rôle et offre `responded`.
- Ce qui est risqué : routes publiques avec service role doivent rester très limitées; endpoint `send-opening` service-role non utilisable.
- Ce qui est inconnu : état exact des migrations appliquées en prod.
- Actions recommandées : tests e2e multi-tenant et tests SQL/RLS appliqués sur DB réelle/staging.

### Admin/client roles

- Ce qui est prouvé OK : admin pages appellent `requireCurrentPlatformAdmin()`; super admin/support access sont modélisés.
- Ce qui est risqué : `requireCurrentPlatformAdmin()` retourne `unconfigured` sans redirect; certaines pages doivent vérifier explicitement avant de charger.
- Ce qui est inconnu : contenu réel de `PLATFORM_ADMIN_EMAILS`.
- Actions recommandées : faire échouer fermé toute page admin si `access.status !== "authorized"` sauf page diagnostic safe.

### Multi-tenant

- Ce qui est prouvé OK : RLS de base utilise `private.is_org_member(organization_id)`; queries lues filtrent massivement par `organization_id`.
- Ce qui est risqué : client avec plusieurs organisations prend la première membership active; pas de switcher.
- Ce qui est inconnu : migrations prod et données orphelines.
- Actions recommandées : tests croisés user A org A ne lit/modifie jamais org B.

### Supabase/RLS

- Ce qui est prouvé OK : RLS activé sur tables principales dans `20260525180000`; anon révoqué dans `20260528173500`; lead tables publiques révoquent anon/authenticated.
- Ce qui est risqué : service role très utilisé côté serveur; tout bug de route publique contourne RLS.
- Ce qui est inconnu : advisors Supabase réels non exécutés.
- Actions recommandées : exécuter advisors Supabase en staging; vérifier RLS activé sur toutes tables récentes.

### API routes

- Ce qui est prouvé OK : Twilio signature vérifiée; cron exige `CRON_SECRET`.
- Ce qui est risqué : absence rate limiting; `/api/sms/send-opening` 501; routes publiques utilisent service role.
- Ce qui est inconnu : WAF/Vercel protections.
- Actions recommandées : rate limiting + tests webhook invalid signature.

### Secrets/env vars

- Ce qui est prouvé OK : `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_AUTH_TOKEN`, `CRON_SECRET` sont listés server-only; je n'ai pas affiché de valeur secrète.
- Ce qui est risqué : build utilise `.env.local`; impossible de conclure sur séparation dev/prod.
- Ce qui est inconnu : valeurs réelles et rotation.
- Actions recommandées : vérifier Vercel envs, retirer secrets locaux du repo si présents, activer rotation.

### XSS/input validation

- Ce qui est prouvé OK : pas de `dangerouslySetInnerHTML` trouvé; formulaires clés ont validation.
- Ce qui est risqué : erreurs brutes Supabase parfois renvoyées à UI admin/client.
- Ce qui est inconnu : sanitization de toutes notes internes.
- Actions recommandées : messages utilisateurs génériques, détails en logs internes.

### Logs/errors

- Ce qui est prouvé OK : audit logs et webhook events existent.
- Ce qui est risqué : pas d'alerting externe observé.
- Ce qui est inconnu : monitoring prod.
- Actions recommandées : alertes P0 SMS/compliance.

## I. Audit SMS / Twilio / conformité

### Consentement

Les envois opening/reminder exigent `opted_in`, mais les demandes de consentement sont actuellement bloquées par `assertCanSendSms()`. Corriger P1-01.

### STOP / opt-out

STOP est classé et appliqué quand le contexte est lié. Risque P0 si inbound non lié : pas d'upsert consentement dans le fallback sans org/sender.

### Webhooks

Inbound et status Twilio existent et sont en runtime `nodejs`. Les événements invalides sont journalisés.

### Signature Twilio

`validateTwilioWebhookRequestForAccountSid()` vérifie signature parent ou subaccount via AccountSid. Point positif.

### Réponses OUI / YES / 1

`classifyInboundSmsBody()` classe `oui`, `yes`, `1` en `waitlist_positive`. Le handler met l'offre en `responded`, pas `selected`.

### Dédoublonnage

Idempotence inbound via `provider_message_id` existe. Contrainte unique `opening_offers(opening_id, customer_id)` existe.

### Association réponse → bon commerce

Association par sender dédié/messaging service puis dernier outbound context. Bon design, mais dépend de la persistance outbound.

### Rate limiting

Non observé.

### Erreurs Twilio

Status callbacks gèrent `failed`, `undelivered`, erreurs code/message. UI affiche les échecs.

### Logs

`audit_logs`, `sms_messages`, `platform_sms_webhook_events` sont utilisés. Alerting absent.

### Risques légaux

P0 STOP non relié; P1 HELP non géré; P1 consent request cassé.

## J. Audit workflows produit

1. Landing → Book a call
   - Fonctionne : Partiellement
   - Points de friction : pas de rate limit; confirmation SMS plateforme à vérifier; tests book-call échouent.
   - Risques : spam, perte de confiance.
   - États manquants : limites abus.
   - Tests requis : soumission valide, spam honeypot, payload trop gros, erreur Supabase.

2. Admin → création client
   - Fonctionne : Partiellement
   - Points de friction : conversion existe, invitation existe, mais activation publique email-only est dangereuse.
   - Risques : prise de compte.
   - États manquants : verrouillage token.
   - Tests requis : impossible de créer compte sans invitation.

3. Client → activation compte
   - Fonctionne : Non, dans l'état actuel de sécurité
   - Points de friction : deux chemins concurrents, invitation et signup public.
   - Risques : P0-01.
   - États manquants : token d'activation consommable.
   - Tests requis : lien expiré, lien valide, email approuvé sans lien.

4. Client → connexion/dashboard
   - Fonctionne : Partiellement
   - Points de friction : reset password peu visible.
   - Risques : support manuel.
   - États manquants : forgot password.
   - Tests requis : login client, logout, no workspace, route privée.

5. Client → création opportunité SMS
   - Fonctionne : Partiellement
   - Points de friction : dépend SMS runtime + persistence + consent.
   - Risques : envoi non atomique.
   - États manquants : outbox/retry.
   - Tests requis : no eligible recipients, partial Twilio failure, DB failure after provider.

6. SMS envoyé → réponse client
   - Fonctionne : Partiellement
   - Points de friction : bon si contexte outbound existe.
   - Risques : STOP/réponse non liée.
   - États manquants : remédiation unlinked.
   - Tests requis : YES, STOP, duplicate webhook, unknown inbound.

7. Réponses → confirmation manuelle
   - Fonctionne : Oui, selon code lu
   - Points de friction : UI mélange FR/EN.
   - Risques : erreurs humaines si libellés confus.
   - États manquants : confirmation modal possible.
   - Tests requis : seul `responded` confirmable, second confirm refusé, autres offres rejetées.

## K. Audit UX/UI

- Ce qui nuit à la crédibilité : tests public navigation échouent; textes anglais dans dashboard français; lint React compiler.
- Ce qui semble template/générique : `lunera-open-spot-template` et classes `lunera` restent dans le code, même si le contenu visible est Open Spot.
- Ce qui est confus : `/signup` dit “Créer un compte” alors que le produit est censé être invitation/acceptation.
- Ce qui est incohérent FR/EN : page cancellation detail mélange anglais/français.
- Ce qui manque en mobile : tests public-navigation mobile échouent selon `npm test`.
- Ce qui doit être corrigé avant client #1 : signup sécurisé, tests publics verts, libellés dashboard principaux en français.

## L. Audit data / DB / multi-tenant

- Schéma : tables principales présentes : organizations, members, customers, consents, waitlist, openings, offers, booking_requests, sms_messages, appointments, scheduled_messages.
- Relations : FKs et contraintes importantes présentes; unique confirmed booking per opening existe.
- RLS : activé sur tables principales; politiques basées sur membership.
- Contraintes : phone E.164, consent timestamps, unique phone per org.
- Index : plusieurs index sur statuts/dates; indexes SMS/platform présents.
- Risques d'accès croisé : pas de route vulnérable directe trouvée; plus gros risque = activation publique par email et service-role routes.
- Risques de doublons : offres dédupliquées par opening/customer; booking unique confirmed/completed.
- Données sensibles : téléphones et SMS bodies stockés; service role très utilisé.
- Recommandations : test staging multi-tenant obligatoire et advisors Supabase.

## M. Audit code quality / architecture

- Structure : Next App Router, server actions, lib domain modules. Structure globalement cohérente.
- Typage : `strict` activé, mais typecheck échoue à cause de `.next/types`.
- Duplication : routes legacy/aliases et composants marketing volumineux.
- Dette technique : tests source-string fragiles; CSS global énorme.
- Erreurs : lint/test/typecheck rouges.
- Maintenabilité : business logic dans `src/lib` assez claire, mais SMS outbox manque.
- Risques de régression : élevés tant que CI n'est pas verte.

## N. Production readiness

- Build : succès.
- Lint : échec.
- Typecheck : échec.
- Tests : échec.
- Env vars : nombreuses variables critiques; valeurs non affichées. `supabase/config.toml` absent.
- Logs : DB/audit présents.
- Monitoring : non observé.
- Rollback : non observé.
- Staging/prod : non prouvé.
- Performance : pas d'audit Lighthouse; CSS/landing volumineux.
- Domaine/déploiement : build détecte `.env.local`; configuration Vercel non inspectée.

## O. Matrice de tests à exécuter avant client #1

- ID : T-P0-01
  - Priorité : P0
  - Objectif : empêcher takeover signup
  - Étapes : convertir une demande, ne pas ouvrir l'invitation, tenter `/signup` avec l'email.
  - Résultat attendu : refus sans token.
  - Gravité si échec : P0.

- ID : T-P0-02
  - Priorité : P0
  - Objectif : STOP toujours appliqué
  - Étapes : envoyer STOP avec contexte lié, contexte manquant, duplicate webhook.
  - Résultat attendu : consentement `opted_out` ou incident bloquant remédiable.
  - Gravité si échec : P0.

- ID : T-P0-03
  - Priorité : P0
  - Objectif : confirmation manuelle seulement
  - Étapes : créer opening, simuler YES du premier client.
  - Résultat attendu : offre `responded`, booking `pending_merchant_validation`, aucun `confirmed`.
  - Gravité si échec : P0.

- ID : T-P0-04
  - Priorité : P0
  - Objectif : multi-tenant isolation
  - Étapes : user A org A tente IDs org B sur pages/actions/API validate.
  - Résultat attendu : 403/404 ou aucune donnée.
  - Gravité si échec : P0.

- ID : T-P1-01
  - Priorité : P1
  - Objectif : auth/reset
  - Étapes : invite, set password, logout, reset password.
  - Résultat attendu : parcours sans intervention admin.
  - Gravité si échec : P1/P0 selon blocage.

- ID : T-P1-02
  - Priorité : P1
  - Objectif : SMS send
  - Étapes : client opt-in, opening, send Twilio simulator/real.
  - Résultat attendu : `sms_messages` persisté avant/après provider et offers `sent`.
  - Gravité si échec : P1.

- ID : T-P1-03
  - Priorité : P1
  - Objectif : SMS reply
  - Étapes : inbound OUI/YES/1.
  - Résultat attendu : rank, `responded`, visible dashboard.
  - Gravité si échec : P1.

- ID : T-P1-04
  - Priorité : P1
  - Objectif : webhook duplicate
  - Étapes : rejouer même MessageSid.
  - Résultat attendu : idempotent, pas de double rank/booking.
  - Gravité si échec : P1.

- ID : T-P1-05
  - Priorité : P1
  - Objectif : mobile
  - Étapes : landing, book-call, dashboard responses sur 390px.
  - Résultat attendu : pas d'overflow, CTA utilisables.
  - Gravité si échec : P1.

- ID : T-P1-06
  - Priorité : P1
  - Objectif : build production
  - Étapes : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
  - Résultat attendu : tout vert.
  - Gravité si échec : P1.

## P. Checklist prêt pour premier client

### Must-have avant client #1

- Corriger P0-01 signup/activation.
- Corriger P0-02 STOP unlinked/outbox SMS.
- Corriger P0-03 route service-role SMS non authentifiée.
- Corriger P0-04 migrations manquantes pour sender SMS par organisation.
- Corriger P0-05 placeholders légaux.
- Corriger P1-01 consent request.
- Rendre lint/typecheck/tests/build verts.
- Ajouter rate limiting public.
- Tester multi-tenant sur staging DB réelle.
- Tester Twilio inbound/status signature en environnement public.

### Acceptable après client #1

- Refactor landing/CSS volumineux.
- Ajouter analytics produit avancées.
- Masquer davantage les IDs provider.
- Améliorer i18n complète.

### À ne pas faire maintenant

- Refonte complète du dashboard.
- Nouveau système de réservation complet.
- Automatisation de confirmation du premier répondant.
- Migration multi-org switcher si non nécessaire au premier client.

## Q. Plan d'action priorisé

1. Corriger signup/activation email-only
   - Gravité : P0
   - Fichiers probables : `src/lib/auth/approved-client-account.ts`, `src/components/auth/create-account-form.tsx`, `src/app/signup/page.tsx`
   - Pourquoi maintenant : risque d'accès non autorisé.
   - Test de validation : email approuvé sans token refusé.
   - Risque si ignoré : takeover commerce.

2. Introduire outbox SMS et STOP unlinked remediation
   - Gravité : P0
   - Fichiers probables : `src/lib/dashboard/actions.ts`, `src/lib/sms/opening-confirmation.ts`, `src/lib/sms/inbound-handler.ts`
   - Pourquoi maintenant : conformité STOP.
   - Test de validation : DB failure après provider ne perd pas STOP/réponse.
   - Risque si ignoré : opt-out ignoré.

3. Verrouiller ou supprimer `/api/sms/send-opening`
   - Gravité : P0
   - Fichiers probables : `src/app/api/sms/send-opening/route.ts`
   - Pourquoi maintenant : route service-role avec `organizationId` client.
   - Test de validation : anonyme/user autre org refusé.
   - Risque si ignoré : action SMS cross-tenant dès activation.

4. Ajouter/appliquer migrations SMS sender par organisation
   - Gravité : P0
   - Fichiers probables : `supabase/migrations/*`, `src/types/database.ts`, `src/lib/sms/organization-sender.ts`
   - Pourquoi maintenant : send org-scoped dépend de tables absentes.
   - Test de validation : DB fresh + setup sender + test run + inbound route.
   - Risque si ignoré : SMS réel cassé en production.

5. Remplacer les placeholders légaux
   - Gravité : P0
   - Fichiers probables : `src/lib/legal/constants.ts`
   - Pourquoi maintenant : consentement et pages légales non publiables.
   - Test de validation : aucune page légale publique ne contient `À compléter`.
   - Risque si ignoré : conformité insuffisante au lancement.

6. Réparer demande de consentement SMS
   - Gravité : P1
   - Fichiers probables : `src/lib/sms/consent-request.ts`, `src/lib/sms/organization-sms.ts`, `src/lib/sms/provider.ts`
   - Pourquoi maintenant : activation liste d'attente.
   - Test de validation : needs_consent reçoit demande; opted_out non.
   - Risque si ignoré : onboarding SMS cassé.

7. Rendre CI verte
   - Gravité : P1
   - Fichiers probables : fichiers lint, `tsconfig.json`, tests unitaires.
   - Pourquoi maintenant : confiance de release.
   - Test de validation : lint/typecheck/test/build.
   - Risque si ignoré : régressions invisibles.

8. Ajouter rate limiting public
   - Gravité : P1
   - Fichiers probables : `src/app/api/book-call-requests/route.ts`, `src/app/api/waitlist/route.ts`
   - Pourquoi maintenant : trafic réel.
   - Test de validation : abus bloqué.
   - Risque si ignoré : spam/coûts/données polluées.

9. Compléter HELP/UNSTOP et durcir parsing STOP/OUI
   - Gravité : P1
   - Fichiers probables : `src/lib/sms/inbound.ts`, `src/lib/sms/inbound-handler.ts`
   - Pourquoi maintenant : conformité minimale SMS et robustesse des réponses.
   - Test de validation : HELP/AIDE/UNSTOP/`STOP all`/`OUI merci` classés correctement.
   - Risque si ignoré : support/compliance incomplet et réponses valides ignorées.

10. Ajouter/reset password visible
   - Gravité : P1
   - Fichiers probables : `src/app/sign-in/page.tsx`, `src/lib/auth/resend-actions.ts`
   - Pourquoi maintenant : activation client.
   - Test de validation : recovery autonome.
   - Risque si ignoré : support manuel.

## R. Questions critiques restantes

- Les migrations Supabase listées sont-elles toutes appliquées en production/staging ?
- Supabase Auth désactive-t-il vraiment l'inscription publique standard ?
- Quel domaine exact est utilisé pour `APP_BASE_URL`, `NEXT_PUBLIC_APP_URL` et les webhooks Twilio ?
- Twilio est-il configuré en sender dédié par commerce ou sender partagé pour le premier client ?
- Existe-t-il un WAF/rate limiting Vercel externe non visible dans le repo ?

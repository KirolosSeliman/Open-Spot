# Platform Admin Dashboard

`/platform-admin` est l'espace interne read-only pour opérer Open Spot: commerces inscrits, activité SMS, santé des comptes et montants estimés dus.

## Accès

L'espace est protégé côté serveur:

- un utilisateur non connecté est redirigé vers `/sign-in`;
- un utilisateur connecté qui n'a pas de ligne active dans `platform_admins` reçoit une 404;
- un platform admin désactivé reçoit une 404;
- le service role Supabase est utilisé uniquement côté serveur après vérification de session.

## Bootstrap du premier admin

Après déploiement de la migration, insérer manuellement le premier admin depuis Supabase SQL Editor ou un outil serveur sécurisé:

```sql
insert into public.platform_admins (user_id, role, active)
values ('YOUR_SUPABASE_AUTH_USER_ID', 'platform_owner', true);
```

Ne jamais mettre un vrai user ID dans une migration commitée.

## Rôles

- `platform_owner`: propriétaire plateforme.
- `support`: support interne.
- `readonly`: lecture seule.

La V1 du dashboard est read-only pour tous les rôles.

## Sécurité

- Ne pas ajouter de lien `/platform-admin` dans la navigation business.
- Ne pas utiliser `NEXT_PUBLIC_*` pour des secrets.
- Ne pas exposer `SUPABASE_SERVICE_ROLE_KEY` côté client.
- Ne pas ajouter d'impersonation sans audit et validation dédiée.
- Ne pas ajouter d'actions destructives depuis cet espace.

## Tests manuels recommandés

1. Non connecté: visiter `/platform-admin`, attendu redirect `/sign-in`.
2. Connecté business normal: visiter `/platform-admin`, attendu 404.
3. Connecté business owner sans ligne `platform_admins`: attendu 404.
4. Platform admin actif: attendu accès à l'overview.
5. Vérifier `/dashboard`: aucun lien vers `/platform-admin`.
6. Vérifier `/platform-admin/businesses`: liste, recherche, filtres URL.
7. Vérifier `/platform-admin/businesses/<id>`: détail read-only, aucun bouton dangereux.
8. Vérifier `/platform-admin/billing`: montants affichés comme estimations seulement.
9. Vérifier `/platform-admin/sms`: métriques SMS read-only, aucun secret affiché.

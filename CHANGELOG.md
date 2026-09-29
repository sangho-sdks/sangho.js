# Changelog

Tous les changements notables sont documentés ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Ce projet respecte le [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Unreleased]

### Added

- **Marketplace / Connect** : `sangho.connect.accounts` — `create` (idempotent par `external_id`, `claim_token` renvoyé une seule fois), `retrieve`, `list`, `reissueClaimToken` et `createKycSession` (KYC hébergé par Sangho, `POST /connect/accounts/{id}/kyc-session/`). Types `ConnectAccount`, `CreatedConnectAccount`, `KycSession`…
- Événements webhook `account.updated` et `kyc.updated` (payload = compte Connect) ; union discriminée `WebhookEvent` (`AccountUpdatedEvent`, `KycUpdatedEvent`) ; `constructEvent` retourne un événement typé (`data.object`).
- `Sangho.constructEvent` accepte une liste de secrets (rotation) et plusieurs valeurs `v1` dans l'en-tête ; erreurs typées `SanghoWebhookSignatureError` (`reason` : `malformed` / `expired` / `mismatch`) ; helper de test `generateTestHeader`.
- **Idempotence (SDK-02)** : toutes les méthodes `create` acceptent `options?: { idempotencyKey }` (type `RequestOptions`).
- `SanghoConflictError` : 409 de conflit d'état métier (ex : `account_not_claimed`, `account_disabled`) ; `SanghoIdempotencyError` reste réservée à l'absence de code ou à `IDEMPOTENCY_CONFLICT`.
- `sangho.account.retrieve()` — `GET /account`, introspection de l'app liée à la clé secrète.
- `sangho.sandbox.reset()` — `POST /reset`, purge des données sandbox (clé test uniquement).
- Les erreurs `SanghoError` (et sous-classes) exposent désormais `.type` (catégorie large, une des 9 valeurs `SanghoErrorType`, ex : `VALIDATION_ERROR`) EN PLUS de `.code` qui devient le code métier précis renvoyé par le backend (ex : `AMOUNT_TOO_SMALL`, `CURRENCY_NOT_IN_PLAN`) — voir `README.md#gestion-des-erreurs`.
- Les erreurs `429` et `5xx` sont désormais réellement retryées avec backoff exponentiel (respectant `maxRetries`) ; un `429` respecte en priorité le délai `retry_after` renvoyé par le serveur. Les `4xx` restants (400/401/403/404/409/422) ne sont jamais retryés.

- **Paiement sécurisé / répartition (Connect)** : `connect.payments` (`retrieve`, `release`, `refund` {scope `product` | `full` | `amount`}, `freeze`, `unfreeze`, `simulatePayment` sandbox), `connect.accounts.balance()` et `connect.accounts.payouts.create/list`. La clé d'idempotence (`options.idempotencyKey`) est OBLIGATOIRE sur `release`, `refund` et `payouts.create` (rejet immédiat sans appel réseau).
- `checkoutSessions.create({ …, connect: ConnectSplit })` (compte, mode `escrow`/`instant`, commission, `reserve_rate`, `external_reference`) et `connect_payment` dans la réponse.
- Événements webhook typés : `account.verified`, `account.restricted`, `payment.succeeded/failed`, `funds.released/frozen/unfrozen`, `refund.succeeded`, `clawback.succeeded`, `payout.paid/failed` (`data.object` = `ConnectAccount`, `ConnectPayment` ou `ConnectPayout`). Types `ConnectPayment`, `ConnectBalance`, `ConnectPayout`, `DecimalString` exportés.

### Changed

- Les réponses d'erreur Connect au format `{ "error": { "code", "message" } }` sont lues comme le format plat des autres routes.
- `constructEvent` : le type de retour est `WebhookEvent` (auparavant `{ id, type, created, data: T }`) ; un en-tête illisible ou un horodatage expiré lève `SanghoWebhookSignatureError` (sous-classe de `SanghoError`) au lieu d'une `SanghoError` générique.
- README : exemples webhook corrigés (`event.data.object`).
- **Breaking** : `ListResponse<T>` expose désormais `data: T[]` au lieu de `results: T[]`, conformément à la pagination réelle de l'API. Tout code utilisant `.results` sur une liste doit passer à `.data`.
- **Breaking** : `CurrencyCode` n'est plus restreint à `"XAF" | "XOF"` — le type couvre désormais l'ensemble des codes ISO 4217 actifs standards (`ISO_4217_CURRENCIES` dans `types/common.ts`). Cela reflète uniquement la validité ISO 4217 du code, pas ce qu'un marchand a le droit d'utiliser : chaque plan Sangho entitle un sous-ensemble de devises, et le backend rejette à l'exécution toute devise hors plan (`SanghoError` avec `.code === "CURRENCY_NOT_IN_PLAN"`, ou `"INVALID_CURRENCY"` si le code n'est pas un ISO 4217 reconnu).
- **Breaking** : `SanghoError.code` ne vaut plus une des 10 catégories basses (`"authentication_error"`, `"api_error"`, ...) — c'est maintenant le code métier précis du backend (`raw.code`), typé `string` (catalogue ouvert, côté backend). La catégorie large vit désormais dans le nouveau champ `.type` (`SanghoErrorType`, 9 valeurs UPPERCASE). Le type `SanghoErrorCode` a été retiré ; utiliser `SanghoErrorType`.
- **Breaking** : renommage du package `sangho` → `@sanghosdk`.
- `checkoutSessions.retrieve()` n'exige plus une clé secrète — le backend autorise explicitement la clé publique sur cette action (page de confirmation navigateur).
- `security.*` appelle désormais les bonnes routes (`/security/me/`, `/security/update_me/`) et existe réellement à l'exécution en tant que `sangho.security` (elle n'existait pas auparavant malgré son typage).

### Non fait

- SDK-05 (reste) : liaison OAuth2 d'un compte existant et en-tête `Sangho-Account` (non exposés par le backend) ; gestion des clients OAuth (`SANGHO_CLIENT_ID` / `SANGHO_SECRET`) depuis l'API.
- SDK-07 : `dispute.*`, `payment_intent.processing`, `refund.succeeded` non ajoutés au catalogue (à confirmer côté backend) ; typage des `data.object` des autres événements.
- SDK-03 (suppression d'`InterfaceOnly`, `strict: true`), SDK-08 (unités monétaires), SDK-13 (auto-pagination) : hors périmètre de cette mise à jour.

### Deprecated

### Removed

- `customers.listTransactions` : la route `/customers/{id}/transactions/` n'existe pas côté API (elle répondait 404) et l'API n'a pas de filtre `customer` sur les transactions. `customers.listPaymentMethods` passe désormais par `GET /payment-methods/?customer=<id>`.
- Suppression des fichiers de test `tests/unit/payouts.test.ts` et `tests/unit/sandbox.test.ts` : ils testaient un module « Payouts » qui n'existe ni dans le SDK ni comme endpoint public de l'API.

### Fixed

- `LICENSE` (MIT) ajouté et publié avec le paquet (il était déclaré mais absent).
- `SanghoNotFoundError` ne construit plus un message dupliqué/incohérent sur les 404 — elle relaie désormais tel quel le message renvoyé par le backend.
- `SanghoRateLimitError` lit correctement `retry_after` (au lieu de `retry_later`, qui n'existe pas côté backend).
- La comparaison du code d'erreur `public_key_not_allowed` est désormais insensible à la casse (le backend envoie parfois `PUBLIC_KEY_NOT_ALLOWED`).
- Revert d'une régression non publiée qui rendait `success_url` optionnel sur `checkoutSessions.create()` alors que le backend l'exige toujours.

### Security

- Retrait des clés API committées en clair et de `NODE_TLS_REJECT_UNAUTHORIZED=0` dans `tests/playground.ts`.
- `SanghoOptions.baseURL` refuse désormais un protocole non-HTTPS (sauf `localhost`/`127.0.0.1`), pour éviter d'envoyer une clé API en clair par erreur de configuration.

---

## [1.0.0] - 2026-04-01

### Added

- Version initiale du SDK
- Support de toutes les ressources : apps, customers, products, paymentIntents,
  checkoutSessions, invoices, transactions, refunds, subscriptions,
  paymentMethods, webhooks, paymentLinks, addresses, partners
- Gestion complète des erreurs (auth, validation, rate limit, réseau)
- Pagination via ListResponse

# @sanghosdk/js — SDK JavaScript / TypeScript officiel

SDK officiel de [Sangho](https://sangho.ga), la plateforme de paiement B2B pour l'Afrique francophone.

[![npm](https://img.shields.io/npm/v/@sanghosdk/js)](https://www.npmjs.com/package/@sanghosdk/js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Docs](https://img.shields.io/badge/docs-docs.sangho.ga-navy)](https://docs.sangho.ga)

---

## Installation

```bash
npm install @sanghosdk/js
# ou
pnpm add @sanghosdk/js
# ou
yarn add @sanghosdk/js
```

> Ce SDK est un client **serveur** (Node.js ≥ 18). Il n'y a pas de build navigateur/CDN —
> pour le paiement côté client, redirigez vers l'URL de checkout hébergée retournée par l'API
> (`session.url` / `intent.url`), comme documenté ci-dessous.

---

## Clés API

| Préfixe       | Environnement | Usage                          |
|---------------|---------------|--------------------------------|
| `sk_prod_`    | Production    | Serveur uniquement             |
| `sk_test_`    | Sandbox       | Serveur uniquement (tests)     |
| `pk_prod_`    | Production    | Navigateur (checkout public)   |
| `pk_test_`    | Sandbox       | Navigateur (checkout tests)    |

> ⚠️ **Ne jamais exposer `sk_prod_` ou `sk_test_` dans du code client (navigateur, app mobile).**

---

## Démarrage rapide

```typescript
import { Sangho } from "@sanghosdk/js"

// Initialisation (côté serveur — clé secrète)
const sangho = new Sangho("sk_prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxx")

// Créer un client
const customer = await sangho.customers.create({
  email: "jean.ondo@example.ga",
  name: "Jean Ondo",
  phone: "+24107000001",
  currency: "XAF",
})

// Créer un PaymentIntent
const intent = await sangho.paymentIntents.create({
  amount: 50_000,    // 500.00 XAF (en centimes)
  currency: "XAF",
  customer: customer.id,
  description: "Commande #1234",
})

// Confirmer le paiement
const confirmed = await sangho.paymentIntents.confirm(intent.id, {
  payment_method: "meth_xxx",
})

console.log(confirmed.status) // "succeeded" | "requires_action" | ...
```

---

## Modules disponibles

### Customers

```typescript
// Créer
const customer = await sangho.customers.create({ email, name, phone, currency })

// Récupérer
const customer = await sangho.customers.retrieve("cust_xxx")

// Mettre à jour
const customer = await sangho.customers.update("cust_xxx", { phone: "+24107000002" })

// Supprimer
await sangho.customers.delete("cust_xxx")

// Lister (avec filtres)
const { data, count } = await sangho.customers.list({
  page: 1,
  page_size: 20,
  status: "active",
  currency: "XAF",
})

// Transactions d'un client
const txns = await sangho.customers.listTransactions("cust_xxx")

// Modes de paiement d'un client
const methods = await sangho.customers.listPaymentMethods("cust_xxx")
```

### Products

```typescript
const product = await sangho.products.create({
  name: "Abonnement Premium",
  type: "subscription",
  unit_amount: 15_000,
  currency: "XAF",
})

await sangho.products.update(product.id, { name: "Abonnement Premium+" })

await sangho.products.delete("prod_xxx") // archive côté backend (soft delete)
```

### Payment Intents

```typescript
// Créer et confirmer en une étape
const intent = await sangho.paymentIntents.create({
  amount: 10_000,
  currency: "XAF",
  customer: "cust_xxx",
  confirm: true,
  payment_method: "meth_xxx",
})

// Capture manuelle
await sangho.paymentIntents.capture("pi_xxx", { amount_to_capture: 8_000 })

// Annuler
await sangho.paymentIntents.cancel("pi_xxx", {
  cancellation_reason: "requested_by_customer",
})
```

### Transactions

```typescript
// Lecture seule
const txn = await sangho.transactions.retrieve("trans_xxx")

const { data } = await sangho.transactions.list({
  status: "succeeded",
  currency: "XAF",
  created_after: "2024-01-01T00:00:00Z",
  min_amount: 1_000,
})
```

### Refunds

```typescript
// Remboursement partiel
const refund = await sangho.refunds.create({
  transaction: "trans_xxx",
  amount: 5_000,
  reason: "requested_by_customer",
})

await sangho.refunds.cancel("refd_xxx")
```

### Invoices

```typescript
const invoice = await sangho.invoices.create({
  customer: "cust_xxx",
  currency: "XAF",
  line_items: [
    { description: "Consultation", quantity: 2, unit_amount: 25_000 },
    { description: "Frais de déplacement", quantity: 1, unit_amount: 10_000 },
  ],
  tax_rate: 18, // 18% TVA
  due_date: "2024-12-31",
})

await sangho.invoices.send(invoice.id)

// Télécharger le PDF
const { url } = await sangho.invoices.getPdfUrl(invoice.id)
```

### Payment Links

```typescript
const link = await sangho.paymentLinks.create({
  currency: "XAF",
  line_items: [{ product: "prod_xxx", quantity: 1 }],
  success_url: "https://monsite.com/merci",
  usage_limit: 100,
})

console.log(link.url) // https://checkout.sangho.ga/pay/link_xxx
```

### Checkout Sessions

```typescript
const session = await sangho.checkoutSessions.create({
  mode: "payment",
  currency: "XAF",
  line_items: [{ product: "prod_xxx", quantity: 1 }],
  success_url: "https://monsite.com/success",
  cancel_url: "https://monsite.com/cancel",
  expires_in: 3600, // 1 heure
})

// Rediriger le client vers session.url
```

### Subscriptions

```typescript
const sub = await sangho.subscriptions.create({
  customer: "cust_xxx",
  currency: "XAF",
  unit_amount: 15_000,
  interval: "month",
  trial_period_days: 14,
})

await sangho.subscriptions.pause("sub_xxx")
await sangho.subscriptions.resume("sub_xxx")
await sangho.subscriptions.cancel("sub_xxx", { cancel_at_period_end: true })
```

### Webhooks

```typescript
const webhook = await sangho.webhooks.create({
  url: "https://monserveur.com/webhooks/sangho",
  events: [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "customer.created",
    "invoice.paid",
  ],
})

// Régénérer le secret
const { secret } = await sangho.webhooks.rollSecret(webhook.id)

// Voir les livraisons
const deliveries = await sangho.webhooks.listDeliveries(webhook.id, {
  status: "failed",
})

// Rejouer une livraison
await sangho.webhooks.retryDelivery(webhook.id, "wdl_xxx")
```

### Vérification des signatures webhook

```typescript
import { Sangho, SanghoWebhookSignatureError } from "@sanghosdk/js"

// Express
app.post(
  "/webhooks/sangho",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // Pendant la rotation d'un secret, passez un tableau : [nouveauSecret, ancienSecret]
      const event = await Sangho.constructEvent(
        req.body,
        req.headers["sangho-signature"] as string,
        process.env.SANGHO_WEBHOOK_SECRET!
      )

      switch (event.type) {
        case "payment_intent.succeeded":
          await handleSuccessfulPayment(event.data.object)
          break
        case "kyc.updated":
        case "account.updated":
          await syncSellerAccount(event.data.object) // typé : ConnectAccount
          break
      }

      res.json({ received: true })
    } catch (err) {
      if (err instanceof SanghoWebhookSignatureError) {
        // err.reason : "malformed" | "expired" | "mismatch"
        return res.status(err.statusCode ?? 400).send(`Signature refusée (${err.reason})`)
      }
      res.status(400).send(`Webhook error: ${err.message}`)
    }
  }
)
```

Pour tester votre endpoint, `generateTestHeader(corps, secret)` produit un en-tête `Sangho-Signature` valide.

### Marketplace / Connect

Une plateforme (ex. une place de marché) crée un compte Sangho par vendeur ; Sangho reste seul responsable du paiement et du **KYC**
(la plateforme ne collecte ni ne stocke aucune pièce d'identité). Toutes ces méthodes exigent une clé secrète
**et** que l'App appelante ait le statut **Partenaire Plateforme** — accordé manuellement par Sangho (revue
back-office) après une demande faite depuis le dashboard, pas une simple histoire de clé ou de plan tarifaire.
Une App marchande ordinaire (B2C, sans ce statut) reçoit un 403 `SanghoPlatformPartnerRequiredError` :

```typescript
import { Sangho, SanghoPlatformPartnerRequiredError } from "@sanghosdk/js"

try {
  await sangho.connect.accounts.list()
} catch (err) {
  if (err instanceof SanghoPlatformPartnerRequiredError) {
    // Cette App n'a pas (encore) le statut Partenaire Plateforme.
  }
}
```

```typescript
import { Sangho, SanghoConflictError } from "@sanghosdk/js"

const sangho = new Sangho(process.env.SANGHO_SECRET_KEY!)

// 1. Créer le compte du vendeur — idempotent par `external_id` (même réponse qu'il existe déjà ou non)
const account = await sangho.connect.accounts.create(
  { external_id: "seller-42", email: "ada@example.com", business_name: "Boutique Ada" },
  { idempotencyKey: "connect-account-seller-42" }
)
// account.status === "pending_claim" ; `claim_token` n'est renvoyé QU'À la création :
// envoyez-le au vendeur par e-mail (lien de réclamation Sangho), sans le stocker ni le journaliser.
// Perdu ou expiré : await sangho.connect.accounts.reissueClaimToken(account.id) (l'ancien est invalidé)

// 2. Une fois le compte réclamé par le vendeur, lancer le KYC hébergé par Sangho
try {
  const session = await sangho.connect.accounts.createKycSession(account.id, {
    return_url: "https://maplateforme.com/wallet/",   // https obligatoire
    refresh_url: "https://maplateforme.com/wallet/",
  })
  // Redirigez le vendeur : window.location.assign(session.url)  (lien valable environ une heure)
} catch (err) {
  if (err instanceof SanghoConflictError && err.code === "account_not_claimed") {
    // le vendeur n'a pas encore réclamé son compte
  }
}

// 3. Le résultat arrive par webhook : `kyc.updated` et `account.updated` (payload = compte à jour)
const event = await Sangho.constructEvent(rawBody, signatureHeader, webhookSecret)
if (event.type === "kyc.updated") {
  const { charges_enabled, payouts_enabled, kyc_level } = event.data.object
  // n'exposez les produits du vendeur que si charges_enabled est vrai
}

// Relecture (resynchronisation périodique, mode dégradé)
const current = await sangho.connect.accounts.retrieve(account.id)
```

Statuts : `pending_claim` → `linked` (réclamé) → `active` (KYC validé) ; `restricted` (capacités limitées) et `disabled`
(désactivé par Sangho) coupent les encaissements.

### Idempotence

Toutes les méthodes `create` acceptent `{ idempotencyKey }` en dernier argument : rejouer un appel avec la **même** clé et le même corps
renvoie la même réponse ; la même clé avec un corps différent lève `SanghoIdempotencyError` (409). Sans clé, le SDK en génère une
nouvelle à chaque appel.

---

## Gestion des erreurs

```typescript
import {
  Sangho,
  SanghoAuthError,
  SanghoValidationError,
  SanghoNotFoundError,
  SanghoRateLimitError,
  SanghoError,
} from "@sanghosdk/js"

try {
  const customer = await sangho.customers.create({ email: "invalid" })
} catch (err) {
  if (err instanceof SanghoValidationError) {
    console.error("Erreurs de validation:", err.fieldErrors)
    // { email: ["Enter a valid email address."] }
  } else if (err instanceof SanghoAuthError) {
    console.error("Clé API invalide ou expirée")
  } else if (err instanceof SanghoNotFoundError) {
    console.error("Ressource introuvable")
  } else if (err instanceof SanghoRateLimitError) {
    console.error(`Limite de taux dépassée. Réessayez dans ${err.retryAfter}s`)
  } else if (err instanceof SanghoError) {
    console.error(err.type);       // Catégorie — ex. 'VALIDATION_ERROR'
    console.error(err.code);       // Code métier précis — ex. 'AMOUNT_TOO_SMALL'
    console.error(err.statusCode); // Code HTTP
  } else {
    throw err
  }
}
```

---

## Options avancées

```typescript
const sangho = new Sangho("sk_test_xxx", {
  timeout: 10_000,      // Timeout en ms (défaut : 30 000)
  maxRetries: 5,        // Nombre de retries auto (défaut : 3)
  baseURL: "https://api.staging.sangho.ga/v1",  // URL custom (staging)
})
```

---

## Sécurité

- La clé API est transmise uniquement via le header `Authorization: Bearer`
- Chaque requête POST génère automatiquement une `Idempotency-Key` unique (UUID v4)
- Les retries auto n'ont lieu que pour les erreurs `429` et `5xx` (jamais `4xx`), en respectant `Retry-After` pour les `429`
- La vérification de signature webhook utilise HMAC-SHA256 avec protection anti-replay (5 min)
- Les clés publiques (`pk_`) sont rejetées côté SDK si utilisées pour des opérations réservées aux clés secrètes (`sk_`)

---

## Compatibilité

Ce SDK est un client **serveur** — il n'y a pas de build navigateur/UMD ni de CDN.

| Environnement | Support |
|---|---|
| Node.js ≥ 18 | ✅ natif (ESM + CJS) |
| Deno | ✅ via `npm:` |
| Bun | ✅ |
| TypeScript ≥ 5.0 | ✅ types complets |

---

## Licence

MIT © [Sangho](https://sangho.ga)

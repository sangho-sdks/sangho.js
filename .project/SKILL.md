---
name: sangho-sdk-js
description: >
  Build, audit, and extend the Sangho JavaScript/TypeScript SDK. Use this skill
  whenever the user works on sangho-sdk-js — creating a new resource module,
  auditing type alignment between backend Django serializers and TypeScript types,
  adding missing actions, fixing bugs in existing modules, or generating backend
  view/serializer completions. Also trigger when the user mentions any of:
  SanghoError, HttpClient, BaseModule, assertSecretKey, ListResponse, DRFOptions,
  or any resource name (apps, customers, products, payment-intents, checkout-sessions,
  invoices, webhooks, subscriptions, transactions, refunds, payment-methods,
  addresses, payment-links, partners).
---

# Sangho SDK — JavaScript/TypeScript

A payment SDK for the Sangho API, built for Africa (XAF-first). Mirrors the
Django REST Framework backend: one module per resource, strict type alignment,
no invented fields.

---

## Architecture

```
sangho-sdk-js/
├── core/
│   ├── http.ts          HttpClient — fetch wrapper, error mapping
│   └── errors.ts        SanghoError hierarchy
├── modules/
│   ├── base.ts          BaseModule (holds HttpClient)
│   └── {resource}.ts    One class per resource
├── types/
│   ├── common.ts        ListParams, ListResponse, Timestamps, DRFOptions…
│   ├── resources/       One file per resource
│   └── properties/      One interface per resource (contract)
└── index.ts             Main Sangho class, exposes public objects
```

---

## Non-negotiable conventions

Every module MUST follow these rules exactly — no exceptions:

### Module class

```typescript
export class {Resource}Module extends BaseModule {
  public {resource} = {
    list:     (criteria?: {Resource}Criteria)       => this._list(criteria),
    retrieve: (id: string)                          => this._retrieve(id),
    create:   (payloads: CreatePayloads)            => this._create(payloads),
    update:   (id: string, payloads: Payloads)      => this._update(id, payloads),
    delete:   (id: string)                          => this._delete(id),
    // custom actions…
    options:  ()                                    => this._options(),
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _list(criteria?: {Resource}Criteria): Promise<ListResponse<{Resource}>> {
    this.http.assertSecretKey("{resource}.list");
    return this.http.get<ListResponse<{Resource}>>("/resource/", criteria);
  }
  // … one protected _method() per entry above
}
```

**Rules:**
- Public object `this.{resource}` exposes all methods — never call protected methods directly
- All protected methods prefixed with `_` (e.g., `_list`, `_create`, `_options`)
- Never use `async/await` — return Promises directly
- Never add `requireId()` — removed from all modules
- Never use `implements SomeProperties` — removed
- Always add `options()` — every module has it
- `assertSecretKey("resource.method")` on every protected method except `_options()`

### Type naming

| File | What goes here |
|---|---|
| `CreatePayloads` | Fields for POST |
| `Payloads` | Fields for PATCH (all optional) |
| `{Resource}Criteria` | GET query filters — always `extends ListParams` |
| Action-specific payloads | `ConfirmPayloads`, `CapturePayloads`, `CancelPayloads`… |

**Never use** `Create{Resource}Params`, `Update{Resource}Params`, `{Resource}ListParams` — these are old naming conventions, always rename them.

### Return types

| Backend response | TypeScript type |
|---|---|
| HTTP 200 + object | `Promise<{Resource}>` |
| HTTP 200 + list | `Promise<ListResponse<{Resource}>>` |
| HTTP 204 no content | `Promise<void>` |
| HTTP 200 soft-delete (returns object) | `Promise<{Resource}>` |
| `{ url, expires_at }` | Explicit inline type |

**Never** return `Promise<{ id: string; deleted: true }>` — DRF returns 204 for real deletes.

### Currency rule

All monetary amounts are XAF. Type monetary fields as `number` (not `AmountInCents`
alias when redundant). Type `currency` as the literal `"XAF"` on interface fields,
not `CurrencyCode`.

---

## 5-point audit checklist

When given backend code (view + serializer + model) and existing SDK code to audit,
always work through these 5 points in order before writing any code:

1. **Methods** — Does the public object expose every backend endpoint?
   Check `http_method_names`, `@action` decorators, and `destroy()`/`update()` overrides.
   Add missing ones; remove phantom ones (actions that return 404).

2. **Type alignment** — Does every TypeScript field correspond to a real
   `serializer.Meta.fields` entry? Cross-check the model fields, `SerializerMethodField`
   getters, and `to_representation()` injections. Remove invented fields; add missing ones.

3. **Docstrings** — Every method in the properties file needs a JSDoc block:
   `@param`, `@returns`, `@example`. Add them to any method missing documentation.

4. **`options()`** — Every module must expose `options()` → `Promise<DRFOptions>`.
   Add it if missing.

5. **Criteria filtering** — `list()` must accept a `{Resource}Criteria extends ListParams`
   that maps exactly to the backend `get_queryset()` filter params. Add or remove
   criteria fields to match exactly.

After the audit, produce a visual diff (using the visualizer tool), then output
the corrected files.

---

## Backend → SDK alignment rules

### Serializer getters

**Only add a `SerializerMethodField` getter when:**
- The field is a ForeignKey (return `.id`)
- The field is computed (`SerializerMethodField` in Django)
- The field is stored in `metadata` JSONField (no real column)
- Adding `object` type string

**Never add a getter for:**
- Regular model fields (CharField, IntegerField, BooleanField, DateTimeField,
  URLField, JSONField with direct column) — DRF handles these automatically.

### `destroy()` behavior mapping

| Backend `destroy()` behavior | SDK return type |
|---|---|
| Hard delete, HTTP 204 | `Promise<void>` |
| Soft delete sets flag, HTTP 204 | `Promise<void>` |
| Soft delete returns object, HTTP 200 | `Promise<{Resource}>` |
| Aliases `archive()` / `cancel()`, HTTP 200 | `Promise<{Resource}>` |

### Actions naming

Match the backend `url_path` exactly:
- `url_path="archive"` → `_archive()` in module, `archive()` in public object
- `url_path="mark-uncollectible"` → `_markUncollectible()` / `markUncollectible()`
- `url_path="set-default"` → `_setDefault()` / `setDefault()`
- `url_path="roll-secret"` → `_rollSecret()` / `rollSecret()`
- `url_path="retry"` → `_retryDelivery()` / `retryDelivery()`

---

## Resource index

| Resource | Prefix | Module class | Read-only? |
|---|---|---|---|
| Apps | `app_` | `AppsModule` | No |
| Addresses | (int) | `AddressesModule` | No |
| Customers | `cust_` | `CustomersModule` | No |
| Products | `prod_` | `ProductsModule` | No |
| PaymentLinks | `link_` | `PaymentLinksModule` | No |
| PaymentIntents | `pi_` | `PaymentIntentsModule` | No |
| CheckoutSessions | `sess_` | `CheckoutSessionsModule` | No |
| Invoices | `inv_` | `InvoicesModule` | No |
| Transactions | `trans_` | `TransactionsModule` | Partial (no create/delete) |
| Refunds | `refd_` | `RefundsModule` | No |
| Subscriptions | `sub_` | `SubscriptionsModule` | No |
| PaymentMethods | `meth_` | `PaymentMethodsModule` | Partial (no create) |
| Webhooks | `wh_` | `WebhooksModule` | No |
| Partners | (uuid) | `PartnersModule` | Yes |

---

## Error hierarchy

```
SanghoError (base)
├── SanghoAuthError          401
├── SanghoPublicKeyError     403 code=public_key_not_allowed
├── SanghoPermissionError    403 other
├── SanghoNotFoundError      404
├── SanghoValidationError    422  (has .fieldErrors)
├── SanghoRateLimitError     429  (has .retryAfter)
├── SanghoIdempotencyError   409
├── SanghoNetworkError       no response
└── SanghoTimeoutError       AbortController fired
```

`handleResponse()` discriminates 403 by `raw.code`:
- `"public_key_not_allowed"` → `SanghoPublicKeyError`
- anything else → `SanghoPermissionError`

Both classes accept `raw?: SanghoErrorResponse` — always pass it so `.raw`
is never `undefined`.

---

## Security / middleware notes

The backend `EnhancedSecurityMiddleware` validates:
1. API key (Bearer or `X-Secret-Key` / `X-Public-Key` headers)
2. Host whitelist (`app.allowed_hosts`) — localhost/127.0.0.1/::1 are always allowed
3. App status (disabled, scheduled for deletion)

In local development (`NODE_TLS_REJECT_UNAUTHORIZED=0` is common), requests arrive
without `Origin` header. The middleware falls back to `_get_clean_host()` which
returns the server's own hostname. Adding `localhost` to `allowed_hosts` or the
backend's `LOCAL_HOSTS` frozenset resolves this.

---

## Common mistakes to avoid

- **Phantom actions**: never add SDK methods for `@action` decorators that don't
  exist in the backend view (e.g., `activate`/`deactivate` that were replaced by
  `archive`/`restore`).
- **`SanghoList` vs `ListResponse`**: always use `ListResponse<T>` — `SanghoList`
  is an older alias with a different shape (`data` instead of `results`).
- **`async` keyword**: never put `async` on module methods — they return Promises
  from `this.http.*` which are already Promise-returning.
- **`implements` keyword**: remove from all module classes.
- **Currency fields in `CreatePayloads`**: if the backend fixes currency to XAF
  in `perform_create`, don't include `currency` in `CreatePayloads` — or mark it
  as optional with a note.
- **`metadata` fields in types**: only include metadata-stored fields as top-level
  typed fields if the serializer getter exposes them; otherwise they live in the
  opaque `metadata: Metadata` field.

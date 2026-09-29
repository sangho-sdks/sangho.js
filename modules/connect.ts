import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import { SanghoError } from "@/core/errors";
import type { RequestOptions } from "@/types/common";
import type {
  ConnectAccount,
  ConnectAccountList,
  ConnectBalance,
  ConnectPayment,
  ConnectPayout,
  ConnectPayoutList,
  CreatedConnectAccount,
  CreateConnectAccountPayloads,
  CreateConnectPayoutPayloads,
  CreateKycSessionPayloads,
  KycSession,
  RefundConnectPaymentPayloads,
} from "@/types/resources/connect";

/** Options des écritures d'argent : la clé d'idempotence est OBLIGATOIRE (un rejeu ne doit jamais dupliquer l'opération). */
export type RequiredIdempotency = RequestOptions & { idempotencyKey: string };

function requireKey(method: string, options?: RequestOptions): string {
  const key = options?.idempotencyKey;
  if (!key || typeof key !== "string") {
    throw new SanghoError(
      `"${method}" exige une clé d'idempotence stable (options.idempotencyKey), ex : \`release-\${orderId}\`.`,
      "VALIDATION_ERROR"
    );
  }
  return key;
}

/**
 * Marketplace / Connect — réservé aux Apps ayant le statut **Partenaire
 * Plateforme** (approuvé manuellement par Sangho depuis le back-office, après
 * une demande faite sur le dashboard). Une clé secrète valide ne suffit pas :
 * une App marchande ordinaire (B2C) reçoit un 403
 * `SanghoPlatformPartnerRequiredError` sur n'importe quelle méthode ci-dessous.
 */
export class ConnectModule extends BaseModule {
  public connect = {
    accounts: {
      create: (payloads: CreateConnectAccountPayloads, options?: RequestOptions) => this._createAccount(payloads, options),
      retrieve: (id: string) => this._retrieveAccount(id),
      list: () => this._listAccounts(),
      reissueClaimToken: (id: string) => this._reissueClaimToken(id),
      createKycSession: (id: string, payloads: CreateKycSessionPayloads, options?: RequestOptions) =>
        this._createKycSession(id, payloads, options),
      balance: (id: string) => this._balance(id),
      payouts: {
        create: (id: string, payloads: CreateConnectPayoutPayloads, options: RequiredIdempotency) =>
          this._createPayout(id, payloads, options),
        list: (id: string) => this._listPayouts(id),
      },
    },
    payments: {
      retrieve: (id: string) => this._retrievePayment(id),
      release: (id: string, options: RequiredIdempotency) => this._paymentAction(id, "release", {}, options),
      refund: (id: string, payloads: RefundConnectPaymentPayloads, options: RequiredIdempotency) =>
        this._paymentAction(id, "refund", payloads, options),
      freeze: (id: string, options?: RequestOptions) => this._paymentAction(id, "freeze", {}, options),
      unfreeze: (id: string, options?: RequestOptions) => this._paymentAction(id, "unfreeze", {}, options),
      simulatePayment: (id: string) => this._paymentAction(id, "simulate-payment", {}),
    },
  };

  public constructor(protected http: HttpClient) {
    super(http);
  }

  protected _createAccount(payloads: CreateConnectAccountPayloads, options?: RequestOptions): Promise<CreatedConnectAccount> {
    this.http.assertSecretKey("connect.accounts.create");
    return this.http.post<CreatedConnectAccount>("/connect/accounts/", payloads, options?.idempotencyKey);
  }

  protected _retrieveAccount(id: string): Promise<ConnectAccount> {
    this.http.assertSecretKey("connect.accounts.retrieve");
    return this.http.get<ConnectAccount>(`/connect/accounts/${id}/`);
  }

  protected _listAccounts(): Promise<ConnectAccountList> {
    this.http.assertSecretKey("connect.accounts.list");
    return this.http.get<ConnectAccountList>("/connect/accounts/");
  }

  protected _reissueClaimToken(id: string): Promise<{ id: string; claim_token: string }> {
    this.http.assertSecretKey("connect.accounts.reissueClaimToken");
    return this.http.post<{ id: string; claim_token: string }>(`/connect/accounts/${id}/claim-token/`, {});
  }

  protected _createKycSession(id: string, payloads: CreateKycSessionPayloads, options?: RequestOptions): Promise<KycSession> {
    this.http.assertSecretKey("connect.accounts.createKycSession");
    return this.http.post<KycSession>(`/connect/accounts/${id}/kyc-session/`, payloads, options?.idempotencyKey);
  }

  protected _balance(id: string): Promise<ConnectBalance> {
    this.http.assertSecretKey("connect.accounts.balance");
    return this.http.get<ConnectBalance>(`/connect/accounts/${id}/balance/`);
  }

  protected _createPayout(id: string, payloads: CreateConnectPayoutPayloads, options: RequiredIdempotency): Promise<ConnectPayout> {
    this.http.assertSecretKey("connect.accounts.payouts.create");
    let key: string;
    try { key = requireKey("connect.accounts.payouts.create", options); } catch (e) { return Promise.reject(e); }
    return this.http.post<ConnectPayout>(`/connect/accounts/${id}/payouts/`, payloads, key);
  }

  protected _listPayouts(id: string): Promise<ConnectPayoutList> {
    this.http.assertSecretKey("connect.accounts.payouts.list");
    return this.http.get<ConnectPayoutList>(`/connect/accounts/${id}/payouts/`);
  }

  protected _retrievePayment(id: string): Promise<ConnectPayment> {
    this.http.assertSecretKey("connect.payments.retrieve");
    return this.http.get<ConnectPayment>(`/connect/payments/${id}/`);
  }

  /** release / refund : clé obligatoire ; freeze / unfreeze : facultative (déjà idempotents côté serveur) ; simulate-payment : sandbox. */
  protected _paymentAction(id: string, action: string, payloads: object, options?: RequestOptions): Promise<ConnectPayment> {
    this.http.assertSecretKey(`connect.payments.${action}`);
    let key: string | undefined;
    try {
      key = action === "release" || action === "refund" ? requireKey(`connect.payments.${action}`, options) : options?.idempotencyKey;
    } catch (e) {
      return Promise.reject(e);
    }
    return this.http.post<ConnectPayment>(`/connect/payments/${id}/${action}/`, payloads, key);
  }
}

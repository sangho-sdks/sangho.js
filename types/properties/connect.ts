import type { RequestOptions } from "@/types/common";
import type { RequiredIdempotency } from "@/modules/connect";
import type {
  ConnectAccount,
  ConnectAccountList,
  ConnectBalance,
  ConnectPayment,
  ConnectPayout,
  ConnectPayoutList,
  CreateConnectPayoutPayloads,
  RefundConnectPaymentPayloads,
  CreatedConnectAccount,
  CreateConnectAccountPayloads,
  CreateKycSessionPayloads,
  KycSession,
} from "@/types/resources/connect";

export type ConnectProperties = {
  accounts: {
    /**
     * Crée (ou retrouve) le compte Sangho d'un vendeur de la plateforme — IDEMPOTENT par `external_id`. La réponse a la même forme
     * que le compte existe déjà ou non (anti-énumération) ; `claim_token` n'est renvoyé qu'à la création.
     */
    create(payloads: CreateConnectAccountPayloads, options?: RequestOptions): Promise<CreatedConnectAccount>;
    /** Lit un compte : statut, capacités et niveau KYC (resynchronisation, mode dégradé). */
    retrieve(id: string): Promise<ConnectAccount>;
    /** Liste les comptes de la plateforme (environnement de la clé). */
    list(): Promise<ConnectAccountList>;
    /** Réémet le jeton de réclamation d'un compte encore `pending_claim` ; l'ancien est invalidé. */
    reissueClaimToken(id: string): Promise<{ id: string; claim_token: string }>;
    /**
     * Lance le KYC hébergé par Sangho (le compte doit avoir été réclamé, sinon 409 `account_not_claimed`). Le résultat revient par
     * les événements `kyc.updated` / `account.updated`.
     */
    createKycSession(id: string, payloads: CreateKycSessionPayloads, options?: RequestOptions): Promise<KycSession>;

    /** Soldes du compte : `available`, `held` (séquestre), `frozen`, `reserve`, `negative` (dette), `paid_out`. Source de vérité de l'affichage. */
    balance(id: string): Promise<ConnectBalance>;
    payouts: {
      /**
       * Demande un retrait (refusé : 409 `payouts_disabled` sans KYC, `negative_balance`, `insufficient_available`).
       * `options.idempotencyKey` OBLIGATOIRE : un rejeu renvoie le même retrait. Événements `payout.paid` / `payout.failed`.
       */
      create(id: string, payloads: CreateConnectPayoutPayloads, options: RequiredIdempotency): Promise<ConnectPayout>;
      /** Retraits du compte (100 derniers). */
      list(id: string): Promise<ConnectPayoutList>;
    };
  };
  payments: {
    /** Lit un paiement Connect (`cpay_xxx`) : mode, montants, commission, état. */
    retrieve(id: string): Promise<ConnectPayment>;
    /**
     * Libère les fonds bloqués (ou gelés) vers le disponible du vendeur ; commission retenue, réserve rendue. Idempotent ;
     * `options.idempotencyKey` OBLIGATOIRE. Événement `funds.released`. Erreur : 409 `not_releasable`.
     */
    release(id: string, options: RequiredIdempotency): Promise<ConnectPayment>;
    /**
     * Rembourse le client (`scope` : `product` | `full` | `amount`). `options.idempotencyKey` OBLIGATOIRE : un rejeu ne rembourse pas deux fois.
     * Événements `refund.succeeded` (+ `clawback.succeeded` en cas de reprise).
     */
    refund(id: string, payloads: RefundConnectPaymentPayloads, options: RequiredIdempotency): Promise<ConnectPayment>;
    /** Gèle les fonds bloqués (litige). Événement `funds.frozen`. */
    freeze(id: string, options?: RequestOptions): Promise<ConnectPayment>;
    /** Dégèle les fonds. Événement `funds.unfrozen`. */
    unfreeze(id: string, options?: RequestOptions): Promise<ConnectPayment>;
    /** SANDBOX uniquement (403 `sandbox_only` en live) : simule l'encaissement pour tester tous les scénarios sans processeur. */
    simulatePayment(id: string): Promise<ConnectPayment>;
  };
};

// =============================================================================
// sangho-sdk-js — @/types/properties/terminal.ts
// =============================================================================
import type {
    TerminalReader,
    TerminalSession,
    OfflineTransaction,
    CreateReaderPayloads,
    CreateSessionPayloads,
    PresentPaymentPayloads,
    SessionStatus,
    SyncPayloads,
    SyncResponse,
    ReaderCriteria,
    SessionCriteria,
} from "@/types/resources/terminal";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";


export type ReadersProperties = {
    /**
     * Liste tous les terminaux enregistrés pour l'application authentifiée.
     * Les résultats sont paginés et filtrables par statut ou type.
     *
     * @param criteria - Filtres optionnels
     * @returns Liste paginée des terminaux
     *
     * @example
     * // Tous les terminaux
     * const all = await sangho.terminal.readers.list()
     *
     * // Seulement les terminaux Android en ligne
     * const actifs = await sangho.terminal.readers.list({
     *   reader_type: "android",
     *   status:      "online",
     * })
     */
    list(criteria?: ReaderCriteria): Promise<ListResponse<TerminalReader>>;

    /**
     * Récupère un terminal par son identifiant.
     *
     * @param id - Identifiant du terminal (préfixe `rdr_`)
     * @returns Les données complètes du terminal
     *
     * @example
     * const reader = await sangho.terminal.readers.retrieve("rdr_xxx")
     * console.log(reader.status)        // "online" | "offline" | "disabled"
     * console.log(reader.reader_type)   // "android" | "firmware" | "virtual"
     */
    retrieve(id: string): Promise<TerminalReader>;

    /**
     * Enregistre un nouveau terminal physique ou virtuel.
     * À appeler **une seule fois** lors du provisionnement du device.
     * Le `reader_token` retourné doit être stocké dans le keystore sécurisé
     * de l'appareil (Android Keystore, HSM firmware, etc.).
     *
     * @param payloads - Données d'enregistrement
     * @returns Le terminal créé avec son `reader_token` initial (valide 24h)
     *
     * @example
     * // Provisionnement d'un terminal Android Sunmi T2
     * const reader = await sangho.terminal.readers.create({
     *   label:         "Caisse 1 — Libreville",
     *   serial_number: "SN-SUNMI-T2-001",
     *   reader_type:   "android",
     *   location:      "Magasin Owendo, Libreville",
     *   metadata:      { store_id: "store_owendo" },
     * })
     *
     * // Stocker reader.reader_token dans le keystore Android sécurisé
     * await secureStorage.set("reader_token", reader.reader_token)
     */
    create(payloads: CreateReaderPayloads, options?: RequestOptions): Promise<TerminalReader>;

    /**
     * Met à jour les informations d'un terminal (mise à jour partielle).
     * Utile pour changer le label ou déplacer un terminal vers une autre localisation.
     *
     * @param id       - Identifiant du terminal
     * @param payloads - Champs à modifier (tous optionnels)
     * @returns Le terminal mis à jour
     *
     * @example
     * const reader = await sangho.terminal.readers.update("rdr_xxx", {
     *   label:    "Caisse 2 — Owendo",
     *   location: "Magasin Port, Libreville",
     * })
     */
    update(id: string, payloads: Partial<CreateReaderPayloads>): Promise<TerminalReader>;

    /**
     * Désactive définitivement un terminal.
     * Un terminal désactivé ne peut plus créer de sessions ni signaler son heartbeat.
     * Opération irréversible depuis le SDK — la réactivation se fait via le dashboard.
     *
     * @param id - Identifiant du terminal à désactiver
     * @returns Le terminal avec `status: "disabled"`
     *
     * @example
     * // Terminal volé ou hors service
     * await sangho.terminal.readers.disable("rdr_xxx")
     */
    disable(id: string): Promise<TerminalReader>;

    /**
     * Renouvelle le `reader_token` d'un terminal.
     * Le token a une durée de vie de **24h** ; à appeler automatiquement
     * au démarrage de l'application POS si `reader_token_expires` est dépassé.
     *
     * @param id - Identifiant du terminal
     * @returns Nouveau `reader_token` et sa date d'expiration `reader_token_expires`
     *
     * @example
     * const { reader_token, reader_token_expires } = await sangho.terminal.readers.refreshToken("rdr_xxx")
     * await secureStorage.set("reader_token", reader_token)
     * await secureStorage.set("reader_token_expires", reader_token_expires)
     */
    refreshToken(id: string): Promise<{ reader_token: string; reader_token_expires: string }>;

    /**
     * Signale que le terminal est actif (keep-alive).
     * À appeler en tâche de fond **toutes les 30 secondes**.
     * Met à jour `last_seen_at` et maintient le statut `"online"`.
     * Un terminal sans heartbeat depuis > 2 min passe automatiquement en `"offline"`.
     *
     * @param id - Identifiant du terminal
     * @returns Statut courant et timestamp de dernière activité
     *
     * @example
     * // Background worker — toutes les 30s
     * setInterval(async () => {
     *   const { status, last_seen_at } = await sangho.terminal.readers.heartbeat("rdr_xxx")
     *   if (status === "offline") reinitialiserConnexion()
     * }, 30_000)
     */
    heartbeat(id: string): Promise<{ status: string; last_seen_at: string }>;

    /**
     * Retourne les métadonnées DRF du endpoint `/terminal/readers/` :
     * actions autorisées, schéma de champs, filtres disponibles.
     */
    options(): Promise<DRFOptions>;
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type SessionsProperties = {
    /**
     * Liste les sessions de paiement terminal.
     * Filtrables par statut ou par terminal.
     *
     * @param criteria - Filtres optionnels
     * @returns Liste paginée des sessions
     *
     * @example
     * // Sessions en attente sur un terminal donné
     * const pending = await sangho.terminal.sessions.list({
     *   reader: "rdr_xxx",
     *   status: "pending",
     * })
     */
    list(criteria?: SessionCriteria): Promise<ListResponse<TerminalSession>>;

    /**
     * Récupère une session de paiement terminal par son identifiant.
     *
     * @param id - Identifiant de la session (préfixe `tsess_`)
     * @returns Les données complètes de la session
     *
     * @example
     * const session = await sangho.terminal.sessions.retrieve("tsess_xxx")
     * console.log(session.status)   // "pending" | "succeeded" | ...
     * console.log(session.amount)   // montant en XAF
     */
    retrieve(id: string): Promise<TerminalSession>;

    /**
     * Crée une nouvelle session de paiement sur un terminal.
     * Déclenche l'affichage du montant sur l'écran du terminal.
     * La session expire automatiquement après le délai configuré (`expires_at`).
     *
     * @param payloads - Données de la session (reader, amount requis)
     * @returns La session créée avec son `client_secret` (utilisé par le POS)
     *
     * @example
     * const session = await sangho.terminal.sessions.create({
     *   reader:      "rdr_xxx",
     *   amount:      15_000,        // 15 000 XAF
     *   description: "Vente caisse 1",
     *   category:    "product",
     *   metadata:    { order_id: "ORD-2024-001" },
     * })
     *
     * // Afficher le montant sur le terminal
     * afficherEcran(`Montant : ${session.amount} XAF — Présentez votre carte`)
     */
    create(payloads: CreateSessionPayloads, options?: RequestOptions): Promise<TerminalSession>;

    /**
     * Notifie le backend que le client a présenté un moyen de paiement.
     * Le `nonce` est fourni par le SDK constructeur du terminal (Sunmi, PAX, Ingenico…)
     * après lecture NFC/EMV — il ne doit **jamais** contenir le PAN brut.
     *
     * Authentification : accepte la `sk_xxx` **ou** le `reader_token` du terminal
     * (permission `IsTerminalToken` côté backend).
     *
     * @param id       - Identifiant de la session
     * @param payloads - Type de moyen de paiement et nonce constructeur
     * @returns La session mise à jour (status → `"payment_method_presented"`)
     *
     * @example
     * // Après lecture NFC depuis le SDK Sunmi
     * const nonce = await sunmiSDK.readNFC()   // ex: "emv_nonce_xxx"
     *
     * await sangho.terminal.sessions.presentPaymentMethod("tsess_xxx", {
     *   payment_method_type: "card",
     *   nonce,
     * })
     *
     * // Mobile Money (MTN, Airtel)
     * await sangho.terminal.sessions.presentPaymentMethod("tsess_xxx", {
     *   payment_method_type: "mobile_money",
     *   nonce: "mm_nonce_yyy",
     * })
     */
    presentPaymentMethod(id: string, payloads: PresentPaymentPayloads): Promise<TerminalSession>;

    /**
     * Interroge le statut courant d'une session (polling léger).
     * À appeler en boucle (~1,5s d'intervalle) jusqu'à obtenir un statut terminal.
     *
     * **Statuts terminaux** : `succeeded` | `failed` | `canceled` | `timed_out`
     * **Statuts transitoires** : `pending` | `payment_method_presented` | `processing`
     *
     * @param id - Identifiant de la session
     * @returns Statut de la session + statut du PaymentIntent associé
     *
     * @example
     * async function attendreResultat(sessionId: string): Promise<SessionStatus> {
     *   const debut = Date.now()
     *   while (Date.now() - debut < 30_000) {
     *     const s = await sangho.terminal.sessions.pollStatus(sessionId)
     *     if (["succeeded", "failed", "canceled", "timed_out"].includes(s.status)) {
     *       return s
     *     }
     *     await sleep(1_500)
     *   }
     *   await sangho.terminal.sessions.cancel(sessionId)
     *   throw new Error("Timeout dépassé")
     * }
     *
     * const result = await attendreResultat("tsess_xxx")
     * if (result.status === "succeeded") imprimerRecu(result)
     * else afficherEcran(`Refusé : ${result.failure_reason}`)
     */
    pollStatus(id: string): Promise<SessionStatus>;

    /**
     * Annule une session de paiement en cours.
     * Seules les sessions en statut `pending` ou `payment_method_presented`
     * peuvent être annulées. Une session `processing` ou `succeeded` ne peut plus l'être.
     *
     * @param id - Identifiant de la session à annuler
     * @returns La session avec `status: "canceled"`
     *
     * @example
     * // Annulation par le caissier
     * await sangho.terminal.sessions.cancel("tsess_xxx")
     * afficherEcran("Paiement annulé")
     */
    cancel(id: string): Promise<TerminalSession>;

    /**
     * Retourne les métadonnées DRF du endpoint `/terminal/sessions/`.
     */
    options(): Promise<DRFOptions>;
};

// ─── Offline ──────────────────────────────────────────────────────────────────

export type OfflineProperties = {
    /**
     * Synchronise un batch de transactions capturées hors-ligne avec le backend.
     * À appeler dès que la connectivité réseau est rétablie.
     *
     * Chaque transaction est identifiée par son `local_id` (généré par le POS).
     * Le backend retourne le résultat individuel de chaque transaction
     * (`synced` | `conflict` | `failed`).
     *
     * ⚠️  Le `card_token` doit être un token constructeur — **jamais le PAN brut**.
     *
     * @param payloads - Tableau des transactions à synchroniser
     * @returns Nombre de transactions synchronisées + détail par `local_id`
     *
     * @example
     * const queue: OfflineTransactionPayload[] = [
     *   {
     *     local_id:             "LOCAL-001",
     *     amount:               8_500,
     *     payment_method_type:  "card",
     *     card_token:           "tok_constructeur_xxx",
     *     captured_at:          "2024-11-15T10:23:00Z",
     *     reader_id:            "rdr_xxx",
     *     metadata:             { order_id: "ORD-001" },
     *   },
     * ]
     *
     * const result = await sangho.terminal.offline.sync({ transactions: queue })
     * console.log(`${result.synced} / ${queue.length} synchronisées`)
     *
     * result.results
     *   .filter(r => r.sync_status === "failed")
     *   .forEach(r => console.error(`Échec ${r.local_id} : ${r.error}`))
     */
    sync(payloads: SyncPayloads): Promise<SyncResponse>;

    /**
     * Liste les transactions offline enregistrées pour cette application.
     * Filtrables par `sync_status` pour retrouver les transactions en échec.
     *
     * @param criteria - Filtres optionnels (`sync_status`, `page`)
     * @returns Liste paginée des transactions offline
     *
     * @example
     * // Transactions en conflit à résoudre manuellement
     * const conflits = await sangho.terminal.offline.list({ sync_status: "conflict" })
     *
     * // Toutes les transactions non encore synchronisées
     * const pending = await sangho.terminal.offline.list({ sync_status: "pending" })
     */
    list(criteria?: { sync_status?: string; page?: number }): Promise<ListResponse<OfflineTransaction>>;

    /**
     * Retourne les métadonnées DRF du endpoint `/terminal/offline/sync/`.
     */
    options(): Promise<DRFOptions>;
};

// ─── TerminalProperties ───────────────────────────────────────────────────────

export type TerminalProperties = {
    /**
     * Gestion des terminaux physiques (Android, firmware, virtuels).
     *
     * Un **terminal** représente un appareil de paiement enregistré :
     * caisse Android (Sunmi, PAX), firmware embarqué (Ingenico, Verifone),
     * ou terminal virtuel pour les tests.
     *
     * Cycle de vie d'un terminal :
     * ```
     * create() → heartbeat() (toutes 30s) → refreshToken() (toutes 24h) → disable()
     * ```
     *
     * @example
     * // Provisionnement initial
     * const reader = await sangho.terminal.readers.create({
     *   label:         "Caisse 1 — Libreville",
     *   serial_number: "SN-SUNMI-T2-001",
     *   reader_type:   "android",
     * })
     */
    readers: ReadersProperties;

    /**
     * Gestion des sessions de paiement terminal.
     *
     * Une **session** représente une tentative de paiement initiée depuis
     * un terminal physique. Elle orchestre le cycle :
     * ```
     * create() → presentPaymentMethod() → pollStatus() → [succeeded | failed | cancel()]
     * ```
     *
     * @example
     * // Flux complet de paiement terminal
     * const session = await sangho.terminal.sessions.create({ reader: "rdr_xxx", amount: 15_000 })
     * await sangho.terminal.sessions.presentPaymentMethod(session.id, { payment_method_type: "card", nonce })
     * const result = await pollJusquaResultat(session.id)
     */
    sessions: SessionsProperties;

    /**
     * Synchronisation des transactions capturées hors-ligne.
     *
     * Quand la connexion réseau est indisponible (zone blanche, coupure),
     * le terminal capture les paiements localement puis les synchronise
     * avec `sync()` dès le retour du réseau.
     *
     * ```
     * [réseau absent] capturer localement → stocker en queue locale
     * [réseau rétabli] offline.sync({ transactions: queue })
     * ```
     *
     * @example
     * // Au retour du réseau
     * const result = await sangho.terminal.offline.sync({ transactions: localQueue })
     * console.log(`${result.synced} transactions synchronisées`)
     */
    offline: OfflineProperties;
};
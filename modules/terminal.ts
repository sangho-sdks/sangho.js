// @/modules/terminal.ts

import { HttpClient } from "@/core/http";
import { BaseModule } from "./base";
import type { ListResponse, DRFOptions, RequestOptions } from "@/types/common";
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

export class TerminalModule extends BaseModule {
    public terminal = {
        // ── Readers ───────────────────────────────────────────────────────
        readers: {
            list: (criteria?: ReaderCriteria) => this._listReaders(criteria),
            retrieve: (id: string) => this._retrieveReader(id),
            create: (payloads: CreateReaderPayloads, options?: RequestOptions) => this._createReader(payloads, options),
            update: (id: string, payloads: Partial<CreateReaderPayloads>) => this._updateReader(id, payloads),
            disable: (id: string) => this._disableReader(id),
            refreshToken: (id: string) => this._refreshToken(id),
            heartbeat: (id: string) => this._heartbeat(id),
            options: () => this._readerOptions(),
        },
        // ── Sessions ──────────────────────────────────────────────────────
        sessions: {
            list: (criteria?: SessionCriteria) => this._listSessions(criteria),
            retrieve: (id: string) => this._retrieveSession(id),
            create: (payloads: CreateSessionPayloads, options?: RequestOptions) => this._createSession(payloads, options),
            presentPaymentMethod: (id: string, payloads: PresentPaymentPayloads) => this._presentPayment(id, payloads),
            pollStatus: (id: string) => this._pollStatus(id),
            cancel: (id: string) => this._cancelSession(id),
            options: () => this._sessionOptions(),
        },
        // ── Offline sync ──────────────────────────────────────────────────
        offline: {
            sync: (payloads: SyncPayloads) => this._syncOffline(payloads),
            list: (criteria?: { sync_status?: string; page?: number }) => this._listOffline(criteria),
            options: () => this._offlineOptions(),
        },
    };

    public constructor(protected http: HttpClient) {
        super(http);
    }

    // ── Reader methods ──────────────────────────────────────────────────────────

    protected _listReaders(criteria?: ReaderCriteria): Promise<ListResponse<TerminalReader>> {
        this.http.assertSecretKey("terminal.readers.list");
        return this.http.get<ListResponse<TerminalReader>>("/terminal/readers/", criteria);
    }

    protected _retrieveReader(id: string): Promise<TerminalReader> {
        this.http.assertSecretKey("terminal.readers.retrieve");
        return this.http.get<TerminalReader>(`/terminal/readers/${id}/`);
    }

    protected _createReader(payloads: CreateReaderPayloads, options?: RequestOptions): Promise<TerminalReader> {
        this.http.assertSecretKey("terminal.readers.create");
        return this.http.post<TerminalReader>("/terminal/readers/", payloads, options?.idempotencyKey);
    }

    protected _updateReader(
        id: string,
        payloads: Partial<CreateReaderPayloads>
    ): Promise<TerminalReader> {
        this.http.assertSecretKey("terminal.readers.update");
        return this.http.patch<TerminalReader>(`/terminal/readers/${id}/`, payloads);
    }

    protected _disableReader(id: string): Promise<TerminalReader> {
        this.http.assertSecretKey("terminal.readers.disable");
        return this.http.delete<TerminalReader>(`/terminal/readers/${id}/`);
    }

    protected _refreshToken(id: string): Promise<{ reader_token: string; reader_token_expires: string }> {
        this.http.assertSecretKey("terminal.readers.refreshToken");
        return this.http.post<{ reader_token: string; reader_token_expires: string }>(
            `/terminal/readers/${id}/refresh-token/`, {}
        );
    }

    protected _heartbeat(id: string): Promise<{ status: string; last_seen_at: string }> {
        this.http.assertSecretKey("terminal.readers.heartbeat");
        return this.http.post<{ status: string; last_seen_at: string }>(
            `/terminal/readers/${id}/heartbeat/`, {}
        );
    }

    protected _readerOptions(): Promise<DRFOptions> {
        return this.http.options<DRFOptions>("/terminal/readers/");
    }

    // ── Session methods ─────────────────────────────────────────────────────────

    protected _listSessions(criteria?: SessionCriteria): Promise<ListResponse<TerminalSession>> {
        this.http.assertSecretKey("terminal.sessions.list");
        return this.http.get<ListResponse<TerminalSession>>("/terminal/sessions/", criteria);
    }

    protected _retrieveSession(id: string): Promise<TerminalSession> {
        this.http.assertSecretKey("terminal.sessions.retrieve");
        return this.http.get<TerminalSession>(`/terminal/sessions/${id}/`);
    }

    protected _createSession(payloads: CreateSessionPayloads, options?: RequestOptions): Promise<TerminalSession> {
        this.http.assertSecretKey("terminal.sessions.create");
        return this.http.post<TerminalSession>("/terminal/sessions/", payloads, options?.idempotencyKey);
    }

    protected _presentPayment(
        id: string,
        payloads: PresentPaymentPayloads
    ): Promise<TerminalSession> {
        // Utilise assertSecretKey OU le reader_token — géré côté backend (IsTerminalToken)
        this.http.assertSecretKey("terminal.sessions.presentPaymentMethod");
        return this.http.post<TerminalSession>(
            `/terminal/sessions/${id}/present-payment-method/`, payloads
        );
    }

    protected _pollStatus(id: string): Promise<SessionStatus> {
        this.http.assertSecretKey("terminal.sessions.pollStatus");
        return this.http.get<SessionStatus>(`/terminal/sessions/${id}/status/`);
    }

    protected _cancelSession(id: string): Promise<TerminalSession> {
        this.http.assertSecretKey("terminal.sessions.cancel");
        return this.http.post<TerminalSession>(`/terminal/sessions/${id}/cancel/`, {});
    }

    protected _sessionOptions(): Promise<DRFOptions> {
        return this.http.options<DRFOptions>("/terminal/sessions/");
    }

    // ── Offline methods ─────────────────────────────────────────────────────────

    protected _syncOffline(payloads: SyncPayloads): Promise<SyncResponse> {
        this.http.assertSecretKey("terminal.offline.sync");
        return this.http.post<SyncResponse>("/terminal/offline/sync/", payloads);
    }

    protected _listOffline(
        criteria?: { sync_status?: string; page?: number }
    ): Promise<ListResponse<OfflineTransaction>> {
        this.http.assertSecretKey("terminal.offline.list");
        return this.http.get<ListResponse<OfflineTransaction>>(
            "/terminal/offline/sync/", criteria
        );
    }

    protected _offlineOptions(): Promise<DRFOptions> {
        return this.http.options<DRFOptions>("/terminal/offline/sync/");
    }
}
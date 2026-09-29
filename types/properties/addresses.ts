import type { RequestOptions } from "@/types/common";
import type {
    CompanyAddress,
    CreatePayloads,
    Payloads,
    AddressCriteria
} from "@/types/resources/addresses";
import { DRFOptions } from "../common";

export type AddressesProperties = {
    /**
     * Liste toutes les adresses de l'entreprise liée à l'app.
     * Filtre par `type` et/ou `is_active` si `criteria` est fourni,
     * sinon retourne toutes les adresses.
     *
     * @param criteria - Filtres optionnels (type, is_active)
     * @returns Tableau des adresses correspondantes
     *
     * @example
     * const all     = await sangho.addresses.list()
     * const billing = await sangho.addresses.list({ type: "billing" })
     * const active  = await sangho.addresses.list({ is_active: true })
     */
    list(criteria?: AddressCriteria): Promise<CompanyAddress[]>;

    /**
     * Récupère une adresse par son identifiant.
     *
     * @param id - Identifiant de l'adresse
     * @returns L'adresse correspondante
     *
     * @example
     * const addr = await sangho.addresses.retrieve("123")
     */
    retrieve(id: string): Promise<CompanyAddress>;

    /**
     * Crée une nouvelle adresse pour l'entreprise liée à l'app.
     * Si `type` vaut `"main"`, les autres adresses principales
     * sont automatiquement reclassées en `"branch"` (backend).
     *
     * @param payloads - `line1`, `city`, `postal_code`, `country` requis
     * @returns L'adresse créée
     *
     * @example
     * const addr = await sangho.addresses.create({
     *   type: "billing",
     *   line1: "123 Avenue Léon MBA",
     *   city: "Libreville",
     *   postal_code: "00000",
     *   country: "GA",
     * })
     */
    create(payloads: CreatePayloads, options?: RequestOptions): Promise<CompanyAddress>;

    /**
     * Met à jour partiellement une adresse (PATCH).
     * L'adresse principale (`type: "main"`) ne peut pas être désactivée
     * via `delete` — mais ses autres champs restent modifiables ici.
     *
     * @param id      - Identifiant de l'adresse
     * @param payloads - Champs à modifier (tous optionnels)
     * @returns L'adresse mise à jour
     *
     * @example
     * await sangho.addresses.update("123", { city: "Port-Gentil" })
     */
    update(id: string, payloads: Payloads): Promise<CompanyAddress>;

    /**
     * Désactive une adresse (soft delete — `is_active: false`).
     * Le backend retourne HTTP 204 sans corps.
     * L'adresse principale (`type: "main"`) ne peut pas être supprimée.
     *
     * @param id - Identifiant de l'adresse
     *
     * @example
     * await sangho.addresses.delete("123")
     */
    delete(id: string): Promise<void>;
    /**
      * Retourne les métadonnées DRF du endpoint `/addresses/` :
      * actions autorisées, schéma de champs, formats acceptés.
      * N'exige pas d'authentification (découverte de schéma).
      */
    options(): Promise<DRFOptions>;
};
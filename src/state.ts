/**
 * Holds the compressed dataset for the current entry point.
 * `index.ts` registers the full dataset, `lite.ts` the lite one; `core.ts`
 * reads it lazily on first use.
 * @internal
 */

export interface CompressedPayload {
    gzip: string;
}

let payload: CompressedPayload | null = null;

/** @internal */
export function setPayload(p: CompressedPayload): void {
    payload = p;
}

/** @internal */
export function getPayload(): CompressedPayload {
    if (!payload) {
        throw new Error('airport-data-js: dataset not registered. Import from "airport-data-js" or "airport-data-js/lite".');
    }
    return payload;
}

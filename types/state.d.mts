/**
 * Holds the compressed dataset for the current entry point.
 * `index.ts` registers the full dataset, `lite.ts` the lite one; `core.ts`
 * reads it lazily on first use.
 * @internal
 */
export interface CompressedPayload {
    gzip: string;
}
/** @internal */
export declare function setPayload(p: CompressedPayload): void;
/** @internal */
export declare function getPayload(): CompressedPayload;
/**
 * Releases the compressed payload once the rows have been built.
 * @internal
 */
export declare function clearPayload(): void;

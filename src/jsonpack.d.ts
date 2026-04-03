declare module 'jsonpack' {
    export function pack(data: unknown): string;
    export function unpack(data: string): unknown;
}

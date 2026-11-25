/**
 * Dispatches the JSON Schema tool definitions from `airport-data-js/tools` to the
 * library functions, flattening the arguments the way the schemas describe them.
 *
 * Lives in the main entry point (which has the dataset registered) rather than in
 * `airport-data-js/tools`, so the tools bundle stays small.
 */
type Args = Record<string, unknown>;
/**
 * Executes a tool by name with arguments shaped like its JSON Schema
 * (see `airport-data-js/tools`). Flattened tool arguments are mapped back to the
 * function signatures, so no hand-mapping is needed.
 *
 * @param name - One of the names in `airportTools`.
 * @param args - Arguments for the tool.
 * @returns Whatever the underlying function returns.
 * @throws If the tool name is unknown or the arguments are invalid.
 *
 * @example
 * ```typescript
 * import { executeTool } from 'airport-data-js';
 *
 * const airports = await executeTool('search', { query: 'New York', limit: 3 });
 * const airport = await executeTool('getAirportByIata', { iataCode: 'LHR' });
 * ```
 */
export declare function executeTool(name: string, args?: Args): Promise<unknown>;
export {};

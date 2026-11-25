/**
 * @module airport-data/tools
 *
 * Pre-built JSON Schema tool definitions for all airport-data functions.
 * Use these with LLM tool-calling frameworks like OpenAI function calling,
 * Anthropic tool use, Vercel AI SDK, or LangChain.
 *
 * @example
 * ```typescript
 * import { airportTools } from 'airport-data-js/tools';
 *
 * // OpenAI function calling
 * const response = await openai.chat.completions.create({
 *     model: 'gpt-5',
 *     messages: [...],
 *     tools: airportTools.map(t => ({ type: 'function', function: t })),
 * });
 *
 * // Anthropic tool use
 * const response = await anthropic.messages.create({
 *     model: 'claude-sonnet-4-5',
 *     messages: [...],
 *     tools: airportTools.map(t => ({
 *         name: t.name,
 *         description: t.description,
 *         input_schema: t.parameters,
 *     })),
 * });
 * ```
 */
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
            items?: {
                type: string;
                pattern?: string;
            };
            default?: unknown;
            minimum?: number;
            maximum?: number;
            pattern?: string;
            minItems?: number;
            maxItems?: number;
        }>;
        required: string[];
        additionalProperties?: false;
    };
}
/**
 * Tool definitions with `additionalProperties: false`, so frameworks can reject
 * arguments that are not part of the schema.
 */
export declare const airportTools: ToolDefinition[];

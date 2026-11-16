/**
 * @module airport-data
 * @description A comprehensive TypeScript library for airport data lookup by IATA, ICAO,
 * city, country, continent, timezone, coordinates, and more. Includes LLM-friendly typed interfaces.
 *
 * This entry point ships the full dataset. Use `airport-data-js/lite` for a smaller
 * bundle without the website, Wikipedia, and flight-tracker URL fields.
 */

import airportsPayload from './airports.data.json';
import { setPayload } from './state';

setPayload(airportsPayload);

export * from './core';

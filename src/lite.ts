/**
 * @module airport-data/lite
 * @description Same API as `airport-data-js`, backed by a smaller dataset that omits
 * the `wikipedia`, `website`, `flightradar24_url`, `radarbox_url` and `flightaware_url`
 * fields. `getAirportLinks` therefore returns an object with every link undefined.
 */

import airportsPayload from './airports.lite.data.json';
import { setPayload } from './state';

setPayload(airportsPayload);

export * from './core';

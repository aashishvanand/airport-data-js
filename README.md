# Airports - Node.js Usage Instructions

This document provides step-by-step instructions on how to use the `airport-data-js` library in a Node.js environment.

## Table of Contents

1. [Setting Up](#setting-up)
2. [Integrating the Library](#integrating-the-library)
3. [Fetching Data](#fetching-data)
4. [Error Handling](#error-handling)
5. [Additional Notes](#additional-notes)

## Setting Up

1. **Install NodeJS**
    Ensure you have [Node.js](https://nodejs.org/) installed.

2. **Initialize a new Node.js project (if you haven't already):**

    ```bash
    npm init -y
    ```

3. **Install the `airport-data-js` library:**

    ```bash
    npm install airport-data-js
    ```

## Integrating the Library

1. **Import the library in your Node.js script:**

    ```javascript
    const airports = require('airport-data-js');
    ```

## Fetching Data

Use the available methods to fetch airport data:

1. **By IATA Code:**

    ```javascript
    const dataByIata = await airports.getAirportByIata('MAA');
    console.log(dataByIata);
    ```

2. **By ICAO Code:**

    ```javascript
    const dataByIcao = await airports.getAirportByIcao('VOMM');
    console.log(dataByIcao);
    ```

3. **By City Code:**

    ```javascript
    const dataByCity = await airports.getAirportByCityCode('NYC');
    console.log(dataByCity);
    ```

... and so on for other methods.

## Error Handling

Each method returns a promise. Handle errors using `try/catch`:

```javascript
try {
    const data = await airports.getAirportByIata('AAA');
    console.log(data);
} catch (error) {
    console.error('Failed to fetch data:', error.message);
}
```

## Additional Notes

- The library fetches data based on the provided codes. Ensure the codes are valid and in the expected format.
- For any issues or further documentation, refer to the main [README.md](./README.md).

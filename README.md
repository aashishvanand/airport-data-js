# Airport Data React Sample

This project is a React application that demonstrates the usage of the `airport-data-js` library. It allows users to search for airport information using IATA codes.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.


## Prerequisites

Before you begin, ensure you have met the following requirements:
- You have installed Node.js and npm/yarn.
- You have a basic understanding of React.js.

## Installation

To install the Airport Data React Sample, follow these steps:

1. Clone the repository or download the ZIP file to your local machine.
2. Navigate to the project directory.
3. Install the dependencies using npm or yarn:

```sh
npm install
```

## Usage

To start the development server, use the following command:

```sh
npm start
```

This command runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits.

## Integrating the Library

In the React application, you can import the library as follows:

```javascript
import { getAirportByIata, getAirportByIcao, getAirportByCityCode } from 'airport-data-js';
```

Fetching Data
You can use the available methods to fetch airport data:

By IATA Code:
```javascript
const dataByIata = await getAirportByIata('MAA');
console.log(dataByIata);
```

By ICAO Code:
```javascript
const dataByIcao = await getAirportByIcao('VOMM');
console.log(dataByIcao);
```

By City Code:

```javascript
const dataByCity = await getAirportByCityCode('NYC');
console.log(dataByCity);
```

## Testing

To run the tests for the application, use the following command:

```sh
npm test
```

This command launches the test runner in the interactive watch mode.

## Contributing

To contribute to the Airport Data React Sample, follow these steps:

1. Fork this repository.
2. Create a new branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`.
4. Push to the original branch: `git push origin <project_name>/<location>`.
5. Create the pull request.
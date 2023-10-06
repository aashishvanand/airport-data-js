module.exports = {
    testEnvironment: 'node',
    transform: {
      '^.+\\.js?$': 'babel-jest',
    },
    moduleFileExtensions: ['js'],
    testMatch: ['**/?(*.)+(spec|test).js'],
    testPathIgnorePatterns: ['/node_modules/'],
  };
  
module.exports = {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
      '\\.bin$': '<rootDir>/__mocks__/fileMock.js'
  }
};
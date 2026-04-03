module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        module: "commonjs",
        moduleResolution: "node",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true
      }
    }],
    "^.+\\.jsx?$": "babel-jest"
  }
};

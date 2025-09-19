module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/styleMock.js'
  }
};

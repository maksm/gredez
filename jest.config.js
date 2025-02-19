module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/tests/mocks/fileMock.js',
    '\\.(css|less|scss)$': '<rootDir>/src/tests/mocks/styleMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', 'e2e'],
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest'
  },
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  verbose: true
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*\\.js',
    '.*\\.ignore\\.ts'
  ],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'babel',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/types.ts',
    '!**/node_modules/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/lib/**',
    '!**/logs/**',
    '!**/package/**'
  ],
  coverageReporters: [
    'text',
    'json'
  ]
}

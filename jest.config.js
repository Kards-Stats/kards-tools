module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*\\.js'
  ],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
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
    'clover'
  ]
}

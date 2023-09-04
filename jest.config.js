module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/test', '<rootDir>/int'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleNameMapper: {
        '@lambda-types': '<rootDir>/lib/lambda-types',
        'jwt-verifier': '<rootDir>/layers/jwt-verifier/nodejs/node_modules/jwt-verifier',
    },
}

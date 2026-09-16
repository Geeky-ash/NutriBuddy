module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-haptics$': '<rootDir>/tests/mocks/expo-haptics.ts',
    '^expo-secure-store$': '<rootDir>/tests/mocks/expo-secure-store.ts',
    '^expo-image-picker$': '<rootDir>/tests/mocks/expo-image-picker.ts',
    '^expo-web-browser$': '<rootDir>/tests/mocks/expo-web-browser.ts',
    '^expo-auth-session$': '<rootDir>/tests/mocks/expo-auth-session.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};

// Jest 테스트 설정 파일

// 전역 테스트 설정
process.env.NODE_ENV = 'test';

// Firebase Admin 모킹 설정
jest.mock('firebase-admin', () => {
  return {
    initializeApp: jest.fn(),
    auth: jest.fn(() => ({
      createCustomToken: jest.fn(),
      updateUser: jest.fn(),
      createUser: jest.fn()
    }))
  };
});

// Firebase Functions 모킹 설정
jest.mock('firebase-functions', () => {
  return {
    https: {
      HttpsError: class HttpsError extends Error {
        constructor(code, message) {
          super(message);
          this.code = code;
        }
      }
    },
    logger: {
      log: jest.fn(),
      error: jest.fn()
    }
  };
});

// 콘솔 출력 억제 (필요시)
// console.log = jest.fn();
// console.error = jest.fn();
const test = require('firebase-functions-test')();
const admin = require('firebase-admin');

// Mock 설정
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    createCustomToken: jest.fn().mockResolvedValue('mock-firebase-token'),
    updateUser: jest.fn(),
    createUser: jest.fn()
  }))
}));

jest.mock('axios');
const axios = require('axios');

describe('인증 모듈 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate 함수', () => {
    const { authenticate } = require('../auth/auth');
    
    test('유효하지 않은 토큰일 때 에러 발생', async () => {
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await authenticate({ provider: 'KAKAO', token: '' }, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('지원하지 않는 provider일 때 에러 발생', async () => {
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await authenticate({ provider: 'UNKNOWN', token: 'test-token' }, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('공통 모듈 테스트', () => {
    const { updateOrCreateUser } = require('../auth/common');
    
    test('필수 필드가 없을 때 에러 발생', async () => {
      await expect(
        updateOrCreateUser('KAKAO', null, 'displayName', 'email@test.com', 'photoURL')
      ).rejects.toThrow();
    });
  });
});

test.cleanup();
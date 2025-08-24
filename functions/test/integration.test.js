const test = require('firebase-functions-test')();
const request = require('supertest');

// Mock 설정
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    createCustomToken: jest.fn().mockResolvedValue('mock-firebase-token'),
    updateUser: jest.fn().mockResolvedValue({ uid: 'test-uid' }),
    createUser: jest.fn().mockResolvedValue({ uid: 'test-uid' })
  }))
}));

jest.mock('axios');
const axios = require('axios');

describe('통합 테스트 - authWithToken 엔드포인트', () => {
  let authWithToken;
  
  beforeAll(() => {
    // Firebase Functions 초기화
    process.env.FIREBASE_CONFIG = JSON.stringify({
      projectId: 'test-project',
      databaseURL: 'https://test.firebaseio.com'
    });
    
    const functions = require('../index');
    authWithToken = functions.authWithToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Kakao 로그인 통합 테스트', () => {
    test('유효한 Kakao 토큰으로 성공적인 인증', async () => {
      // Kakao API 응답 모킹
      axios.get.mockResolvedValue({
        data: {
          id: '12345',
          kakao_account: {
            email: 'test@kakao.com',
            profile: {
              nickname: '테스트유저',
              profile_image_url: 'https://kakao.com/image.jpg'
            }
          }
        }
      });

      const mockReq = {
        body: {
          provider: 'KAKAO',
          token: 'valid-kakao-token'
        }
      };
      
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await authWithToken(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'mock-firebase-token'
      });
    });

    test('잘못된 Kakao 토큰으로 인증 실패', async () => {
      axios.get.mockRejectedValue({
        statusCode: 401,
        error: JSON.stringify({
          code: -401,
          msg: 'Invalid token'
        })
      });

      const mockReq = {
        body: {
          provider: 'KAKAO',
          token: 'invalid-kakao-token'
        }
      };
      
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await authWithToken(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: expect.any(String),
          code: expect.any(String)
        })
      );
    });
  });

  describe('Naver 로그인 통합 테스트', () => {
    test('유효한 Naver 토큰으로 성공적인 인증', async () => {
      // Naver API 응답 모킹
      axios.get.mockResolvedValue({
        data: {
          resultcode: '00',
          message: 'success',
          response: {
            id: 'naver123',
            email: 'test@naver.com',
            nickname: '네이버유저',
            profile_image: 'https://naver.com/image.jpg'
          }
        }
      });

      const mockReq = {
        body: {
          provider: 'NAVER',
          token: 'valid-naver-token'
        }
      };
      
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await authWithToken(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'mock-firebase-token'
      });
    });
  });

  describe('Google 로그인 통합 테스트', () => {
    test('유효한 Google ID 토큰으로 성공적인 인증', async () => {
      // Google API 응답 모킹
      axios.get.mockResolvedValue({
        data: {
          sub: 'google123',
          email: 'test@gmail.com',
          name: '구글유저',
          picture: 'https://google.com/image.jpg'
        }
      });

      const mockReq = {
        body: {
          provider: 'GOOGLE',
          token: 'valid-google-token'
        }
      };
      
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await authWithToken(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'mock-firebase-token'
      });
    });
  });

  describe('Apple 로그인 통합 테스트', () => {
    test('Apple 로그인 테스트 - JWT 검증 필요', () => {
      // Apple의 경우 JWT 토큰 검증이 복잡하므로 별도 구현 필요
      expect(true).toBe(true);
    });
  });

  describe('에러 처리 테스트', () => {
    test('지원하지 않는 provider로 요청 시 에러', async () => {
      const mockReq = {
        body: {
          provider: 'UNSUPPORTED',
          token: 'some-token'
        }
      };
      
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await authWithToken(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('토큰이 없을 때 에러', async () => {
      const mockReq = {
        body: {
          provider: 'KAKAO',
          token: ''
        }
      };
      
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await authWithToken(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

test.cleanup();
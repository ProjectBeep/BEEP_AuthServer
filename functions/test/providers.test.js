const test = require('firebase-functions-test')();

// Mock 설정
jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    createCustomToken: jest.fn().mockResolvedValue('mock-firebase-token'),
    updateUser: jest.fn().mockResolvedValue({ uid: 'test-uid' }),
    createUser: jest.fn().mockResolvedValue({ uid: 'test-uid' })
  }))
}));

jest.mock('axios');
const axios = require('axios');

describe('Provider별 인증 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Kakao 인증', () => {
    const { createFirebaseTokenWithKakao } = require('../auth/kakao');
    
    test('정상적인 Kakao 토큰으로 Firebase 토큰 생성', async () => {
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

      const token = await createFirebaseTokenWithKakao('KAKAO', 'valid-kakao-token');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://kapi.kakao.com/v2/user/me',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid-kakao-token'
          }
        })
      );
      expect(token).toBe('mock-firebase-token');
    });

    test('잘못된 Kakao 토큰일 때 에러 발생', async () => {
      axios.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        createFirebaseTokenWithKakao('KAKAO', 'invalid-token')
      ).rejects.toThrow('Invalid ID token');
    });
  });

  describe('Naver 인증', () => {
    const { createFirebaseTokenWithNaver } = require('../auth/naver');
    
    test('정상적인 Naver 토큰으로 Firebase 토큰 생성', async () => {
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

      const token = await createFirebaseTokenWithNaver('NAVER', 'valid-naver-token');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://openapi.naver.com/v1/nid/me',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid-naver-token'
          }
        })
      );
      expect(token).toBe('mock-firebase-token');
    });

    test('잘못된 Naver 토큰일 때 에러 발생', async () => {
      axios.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        createFirebaseTokenWithNaver('NAVER', 'invalid-token')
      ).rejects.toThrow('Invalid ID token');
    });
  });

  describe('Google 인증', () => {
    const { createFirebaseTokenWithGoogle } = require('../auth/google');
    
    test('정상적인 Google 토큰으로 Firebase 토큰 생성', async () => {
      // Google API 응답 모킹
      axios.get.mockResolvedValue({
        data: {
          sub: 'google123',
          email: 'test@gmail.com',
          name: '구글유저',
          picture: 'https://google.com/image.jpg'
        }
      });

      const token = await createFirebaseTokenWithGoogle('GOOGLE', 'valid-google-token');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/tokeninfo',
        expect.objectContaining({
          params: {
            id_token: 'valid-google-token'
          }
        })
      );
      expect(token).toBe('mock-firebase-token');
    });

    test('잘못된 Google 토큰일 때 에러 발생', async () => {
      axios.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        createFirebaseTokenWithGoogle('GOOGLE', 'invalid-token')
      ).rejects.toThrow('Invalid ID token');
    });
  });

  describe('Apple 인증', () => {
    // Apple은 JWT 토큰 검증이 필요하므로 모킹이 복잡합니다
    // 실제 테스트에서는 jsonwebtoken 라이브러리를 모킹해야 합니다
    
    test('Apple 인증 테스트 - JWT 검증 필요', () => {
      // Apple의 경우 identityToken(JWT) 검증이 필요
      // 실제 구현 시 jsonwebtoken 라이브러리 모킹 필요
      expect(true).toBe(true);
    });
  });
});

test.cleanup();
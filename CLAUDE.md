# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 언어
모든 진행 과정과 설명은 한국어로 작성합니다.

## 프로젝트 개요
BEEP AuthServer는 Firebase Cloud Functions 기반의 소셜 로그인 인증 서버입니다. Kakao, Naver, Google, Apple 로그인을 지원하며, 각 소셜 플랫폼의 액세스 토큰을 Firebase 커스텀 토큰으로 변환합니다.

## 주요 명령어

### 개발 환경 실행
```bash
# functions 디렉토리에서 실행
cd functions
npm run serve  # Firebase 에뮬레이터로 로컬 실행
```

### 린트
```bash
cd functions
npm run lint  # ESLint 실행
```

### 배포
```bash
cd functions
npm run deploy  # Firebase Functions에 배포
```

### 로그 확인
```bash
cd functions
npm run logs  # Firebase Functions 로그 확인
```

### 테스트 실행
```bash
cd functions
npm test           # 모든 테스트 실행
npm run test:watch # 파일 변경 시 자동 테스트
npm run test:coverage # 코드 커버리지 포함 테스트
```

## 아키텍처

### 핵심 구조
- **엔트리포인트**: `functions/index.js` - `authWithToken` 엔드포인트를 노출하며 asia-northeast3 리전에서 실행
- **인증 로직**: `functions/auth/auth.js` - provider별 인증 처리를 라우팅하고 에러 핸들링
- **공통 모듈**: `functions/auth/common.js` - Firebase 사용자 생성/업데이트 로직
- **Provider별 모듈**: 
  - `functions/auth/kakao.js` - Kakao 로그인 처리
  - `functions/auth/naver.js` - Naver 로그인 처리
  - `functions/auth/google.js` - Google 로그인 처리
  - `functions/auth/apple.js` - Apple 로그인 처리 (identityToken 사용)

### 인증 플로우
1. 클라이언트가 소셜 플랫폼에서 액세스 토큰 획득
2. `authWithToken` 엔드포인트로 provider와 token 전송
3. provider별 모듈에서 토큰 검증 및 사용자 정보 조회
4. Firebase Admin SDK로 커스텀 토큰 생성
5. 커스텀 토큰 반환 또는 에러 응답

### 에러 처리
- Firebase 에러: origin = "firebase"
- Provider별 에러: origin = provider 이름 (소문자)
- 알 수 없는 에러: origin = "unknown"

## 환경 설정
- `.env` 파일이 필요하며 `.gitignore`에 포함됨
- `functions/adminKey.json` - Firebase Admin SDK 키 (gitignore됨)
- 각 소셜 플랫폼별 API 키 설정 필요

## 배포 환경
- Firebase Cloud Functions (Node.js 18)
- Region: asia-northeast3
- 엔드포인트: https://authWithToken-f3yfujosoa-du.a.run.app

## 주의사항
- Apple 로그인의 경우 accessToken 대신 identityToken(JWT) 사용
- 모든 provider 값은 대문자 (KAKAO, NAVER, GOOGLE, APPLE)
- 배포 전 항상 ESLint로 코드 검증 필요
### Compose Desktop 인증용 서버 입니다.


### 링크

- **카카오 로그인**
- POST: https://asia-northeast3-beep-3fcc2.cloudfunctions.net/kakaoCustomAuth
- Content-Type: application/json
- Body
```json
{
    "data": {
        "token": "${accessToken}"
    }
}
```

### 배포 방법

- firebase deploy --only functions

### 추가한 모듈 인증 실패할 경우

> Detailed stack trace: Error: Cannot find module 'request-promise'

```javascript
npm install --save request request-promise
```

### Playstore HashKey 얻기

> release.keystore 와 playstore 에 올라간 인증서는 다르기 때문에 추가해야한다

```
keytool -printcert -file ./deployment_cert.der

"${PRINTCERT}" 에는 SHA-1 인증서 지문 값을 입력해야 한다

echo "${PRINTCERT}" | xxd -r -p | openssl base64
```

## API

<details>
    <summary>토큰 로그인</summary>

#### Request

> provider 값 (KAKAO, NAVER, GOOGLE)

- POST: https://authWithToken-f3yfujosoa-du.a.run.app
- Content-Type: application/json
- Body
```json
{
    "provider": "",
    "token": "${accessToken}",
}
```

#### Response

```json
{
    "result": {
        "token": ""
    }
}
```
</details>

### Error Handling

> origin 값 (firebase, kakao, naver, google)

```json
{
    "origin": "",
    "code": "",
    "message": "",
}
```



### 테스트 방법

- firebase emulators:start --only functions

### 배포 방법

- firebase deploy --only functions

### 추가한 모듈 인증 실패할 경우

> Detailed stack trace: Error: Cannot find module 'request-promise'

```javascript
npm install --save request request-promise
```

- package.json 에 추가 되었는지 확인하기
- functions 경로의 package.json 인지 확인하기

### Playstore HashKey 얻기

> release.keystore 와 playstore 에 올라간 인증서는 다르기 때문에 추가해야한다

```
keytool -printcert -file ./deployment_cert.der

"${PRINTCERT}" 에는 SHA-1 인증서 지문 값을 입력해야 한다

echo "${PRINTCERT}" | xxd -r -p | openssl base64
```

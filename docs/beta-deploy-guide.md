# 링크 하나 베타 배포 가이드

이 문서는 친구들이 cmd나 같은 와이파이 없이 URL 하나로 `MOBA Esports Manager Lite`에 접속하도록 Render에 배포하는 절차다.

## 배포 구조

```text
친구 브라우저
  -> Render Web Service
     -> React 정적 파일
     -> /api 저장 API
        -> MongoDB Atlas
```

production에서는 Express 서버 하나가 `dist/`의 Vite 빌드 결과와 `/api` 저장 API를 함께 제공한다.

## Codex가 준비한 것

- `npm run build`가 클라이언트 빌드와 서버 빌드를 모두 수행한다.
- `npm run start`가 `dist-server/server/index.js`를 실행한다.
- production 서버는 `/api`가 아닌 모든 경로를 React 앱의 `index.html`로 돌려보낸다.
- 배포판 저장 API는 브라우저별 `betaOwnerId`를 자동 생성해 친구들의 저장 목록이 서로 섞이지 않게 한다.
- 로컬 개발/테스트에서는 기존처럼 `local-dev` ownerId를 사용한다.

## Render에서 할 일

Render Dashboard에서 기존 실습 Project를 재사용하거나 비운 뒤 `New Web Service`를 만든다.

설정값:

```text
Runtime: Node
Build Command: npm install --include=dev && npm run build
Start Command: npm run start
```

권장 이름:

```text
moba-esports-manager-lite-beta
```

## Environment Variables

Render의 Web Service 설정 화면에서 아래 값을 넣는다.

```text
NODE_ENV=production
NODE_VERSION=20.19.0
MONGODB_URI=실제 MongoDB Atlas URI
MONGODB_DB_NAME=moba_esports_manager_beta
VITE_API_BASE_URL=/api
```

선택값:

```text
CLIENT_DIST_DIR=dist
```

넣지 않아도 기본값은 `dist`다.

주의:

- 실제 `MONGODB_URI`는 GitHub, PR, 문서, 채팅에 올리지 않는다.
- `MONGODB_DB_NAME`은 베타용 DB 이름을 쓰는 것을 권장한다.
- `VITE_SAVE_OWNER_ID`는 비워둔다. 비워두면 브라우저마다 beta ownerId가 자동 생성된다.

## MongoDB Atlas에서 할 일

Render 서버가 Atlas에 접속할 수 있어야 한다.

베타 단계에서는 Atlas에서 다음을 확인한다.

1. Atlas Project 선택
2. `Network Access`
3. `IP Access List`
4. `Add IP Address`
5. 베타용으로 `0.0.0.0/0` 허용

정식 운영 전에는 더 좁은 접근 정책과 별도 DB user를 검토한다.

## 배포 후 확인

Render 배포가 끝나면 `https://...onrender.com` 주소가 생긴다.

확인할 URL:

```text
https://...onrender.com
https://...onrender.com/api/health
https://...onrender.com/api/health/database
https://...onrender.com/roster/main
https://...onrender.com/saves
```

확인할 동작:

- 첫 화면이 열린다.
- `/api/health`가 빠르게 열린다.
- `/api/health/database`에서 MongoDB 연결 상태를 확인할 수 있다.
- 커리어를 시작할 수 있다.
- 데이터 저장 화면에서 저장할 수 있다.
- 새로고침 후 불러오기가 된다.
- `/roster/main` 같은 직접 URL이 새로고침 후에도 깨지지 않는다.

## 친구에게 보낼 안내

```text
MOBA Esports Manager Lite 베타 링크야.

주소:

PC/노트북 Chrome 또는 Edge에서 접속해줘.
모바일 세로 화면은 아직 지원하지 않아.

저장 데이터는 브라우저별로 분리되지만, 같은 브라우저를 여러 명이 같이 쓰면 저장 목록이 같이 보일 수 있어.
```

## 문제 해결

### 화면은 뜨는데 저장이 안 됨

우선 확인:

- `https://...onrender.com/api/health/database`가 성공하는지
- Render Environment Variables에 `MONGODB_URI`가 있는지
- MongoDB Atlas Network Access가 열려 있는지
- `MONGODB_DB_NAME` 오타가 없는지

### `/roster/main` 직접 접속이 404

production 서버가 React fallback을 못 잡는 상태다.

확인:

- Render Start Command가 `npm run start`인지
- `NODE_ENV=production`인지
- `npm run build`가 성공했는지

### Render 배포가 build 단계에서 실패

Render 로그에서 실패한 명령을 확인한다.

로컬에서 먼저 실행:

```bat
npm.cmd run build
```

로컬에서 통과하고 Render에서만 실패하면 Node 버전이나 환경변수를 확인한다.

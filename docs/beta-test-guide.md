# 베타 테스트 가이드

이 문서는 친구들에게 `MOBA Esports Manager Lite`를 베타 테스트로 열기 위한 실행 안내, 테스트 시나리오, 피드백 수집 기준이다.

친구에게 직접 전달할 짧은 안내서는 [MOBA Esports Manager Lite 베타 테스트 안내](./beta-tester-guide.md)를 사용한다.

현재 권장 방식은 Render Web Service에 배포한 뒤 친구들에게 URL 하나를 전달하는 것이다. 배포 절차는 [링크 하나 베타 배포 가이드](./beta-deploy-guide.md)를 따른다.

아래의 cmd 3개와 Cloudflare Quick Tunnel 방식은 배포가 막혔을 때를 위한 보조/로컬 테스트 방식이다. 친구들이 같은 와이파이를 쓰지 않는 상황을 기본으로 한다.

## 베타 목표

이번 베타의 목적은 기능 완성도 발표가 아니라, 실제 플레이어가 처음 만졌을 때 어디서 막히고 어떤 화면이 헷갈리는지 확인하는 것이다.

핵심 확인 항목:

- 처음 들어왔을 때 무엇을 해야 하는지 이해되는가
- 좌측 메뉴와 상단 진행 버튼의 의미가 바로 읽히는가
- 로스터 구성, 전략/훈련, 경기 진행, 대회 확인 흐름이 자연스러운가
- 저장/불러오기 화면을 찾을 수 있는가
- 16:9 PC 화면에서 글자 잘림, 겹침, 과도한 스크롤이 없는가
- 2026에서 2027/2028까지 이어지는 장기 흐름이 게임처럼 느껴지는가

## 지원 환경

권장 환경:

- PC 또는 노트북
- Chrome 또는 Edge 최신 버전
- 1280x720 이상 가로 화면

지원하지 않는 환경:

- 모바일 세로 화면
- 너무 작은 브라우저 폭
- Safari/iOS 중심 테스트

현재 앱에는 작은 세로 화면에서 PC/큰 가로 화면 사용을 안내하는 오버레이가 들어가 있다.

## 베타 운영자가 준비할 것

필수:

- 개발 PC 1대
- 인터넷 연결
- Node.js와 npm 설치 완료
- MongoDB Atlas 접속 가능한 `.env.local`
- `cloudflared` 설치 또는 실행 가능한 상태

권장:

- Chrome 또는 Edge
- 친구에게 보낼 피드백 양식
- 테스트 중 오류가 나면 찍을 스크린샷 폴더

## 실행 전 파일 확인

프로젝트 폴더:

```text
C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite
```

`.env.local` 위치:

```text
C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite\.env.local
```

베타 기본 `.env.local` 예시:

```text
MONGODB_URI=실제 MongoDB URI
MONGODB_DB_NAME=moba_esports_manager
PORT=4000
HOST=127.0.0.1
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
VITE_API_BASE_URL=/api
```

주의:

- 실제 `MONGODB_URI`는 GitHub, PR, 문서, 채팅에 올리지 않는다.
- `VITE_API_BASE_URL=/api`로 두면 공개 터널 주소 하나로 프론트와 저장 API를 같이 테스트할 수 있다.
- 같은 와이파이 테스트를 하지 않는다면 PC 내부 IP 설정은 필요 없다.

## 베타 실행 방식 요약

베타를 열 때는 cmd 창 3개를 사용한다.

1. cmd 1번: Express API 서버
2. cmd 2번: Vite 클라이언트
3. cmd 3번: Cloudflare Quick Tunnel

친구에게는 cmd 3번에 출력되는 `https://....trycloudflare.com` 주소만 보내면 된다.

## cmd 창 여는 법

Windows에서 다음 순서로 연다.

1. `Win + R`을 누른다.
2. `cmd`를 입력한다.
3. Enter를 누른다.
4. 같은 방식으로 cmd 창을 총 3개 연다.

각 cmd 창에서 프로젝트 폴더로 이동한다.

```bat
cd /d C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite
```

## 베타 실행 전 점검

처음 열기 전, cmd 하나에서 아래 명령을 순서대로 실행한다.

```bat
npm.cmd run build
npm.cmd test
npm.cmd run server:check
```

모두 통과하면 베타를 열어도 된다.

`server:check`가 실패하면 보통 `.env.local`의 MongoDB URI, Atlas IP Access List, DB user 비밀번호 문제다.

## cmd 1번: API 서버 실행

cmd 1번에서 실행:

```bat
cd /d C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite
npm.cmd run dev:server
```

정상 상태:

- 창을 닫지 않는다.
- 서버 로그가 계속 켜져 있어야 한다.
- 오류가 나면 친구 접속 전에 먼저 해결한다.

내 PC에서 API 상태 확인:

```text
http://127.0.0.1:4000/api/health
```

브라우저에서 위 주소를 열었을 때 JSON이 보이면 API 서버가 살아 있다.

## cmd 2번: 클라이언트 실행

cmd 2번에서 실행:

```bat
cd /d C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite
npm.cmd run dev:client -- --host 127.0.0.1
```

정상 상태:

- Vite가 `http://127.0.0.1:5173` 주소를 출력한다.
- 창을 닫지 않는다.
- 내 PC 브라우저에서 아래 주소를 열어 앱이 뜨는지 먼저 확인한다.

```text
http://127.0.0.1:5173
```

내 PC에서 저장 화면까지 확인한다.

```text
http://127.0.0.1:5173/saves
```

## cmd 3번: 외부 공개 주소 열기

친구가 같은 와이파이를 쓰지 않는다면 `127.0.0.1` 주소를 보내면 안 된다.

cmd 3번에서 Cloudflare Quick Tunnel을 연다.

```bat
cd /d C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite
cloudflared tunnel --url http://127.0.0.1:5173
```

정상 상태:

- 터미널 출력 중 `https://무작위이름.trycloudflare.com` 형태의 주소가 나온다.
- 그 주소를 친구에게 보낸다.
- cmd 3번 창을 닫으면 공개 주소도 꺼진다.

친구에게 보내는 주소 예시:

```text
https://random-words.trycloudflare.com
```

주의:

- Quick Tunnel 주소는 임시 주소다. 실행할 때마다 바뀔 수 있다.
- 발표/베타 중 cmd 1번, 2번, 3번을 모두 켜둬야 한다.
- 개발 PC가 절전 모드로 들어가면 접속이 끊긴다.
- 무료 Quick Tunnel은 개발/테스트용이다. 장기 운영용 배포는 별도 hosting으로 전환해야 한다.

## cloudflared 확인

cmd에서 먼저 확인:

```bat
where cloudflared
```

정상이라면 `cloudflared.exe` 경로가 출력된다.

설치되어 있지 않다면 Cloudflare 공식 문서의 `cloudflared` 설치 안내를 따라 설치한다. 설치 후 새 cmd 창을 열고 다시 확인한다.

## 친구에게 보내기 전 운영자 최종 확인

운영자 PC에서 다음 4개를 확인한다.

1. `http://127.0.0.1:4000/api/health`가 열린다.
2. `http://127.0.0.1:5173`에서 앱이 열린다.
3. `https://....trycloudflare.com` 공개 주소에서 앱이 열린다.
4. 공개 주소에서 커리어 시작 또는 `/saves` 저장 목록 조회가 된다.

4번이 안 되면 `VITE_API_BASE_URL=/api`인지 확인하고 cmd 2번을 껐다가 다시 켠다.

## 베타 운영 중 절대 하지 말 것

- cmd 1번, 2번, 3번 창 닫기
- PC 절전 모드 진입
- 같은 저장 슬롯을 여러 친구에게 동시에 덮어쓰게 하기
- 실제 MongoDB URI를 친구에게 보내기
- GitHub나 PR에 `.env.local` 올리기

## 저장 데이터 주의

Render 배포판은 브라우저별 `betaOwnerId`를 자동 생성한다.

즉, 서로 다른 친구가 각자 자기 브라우저로 접속하면 저장 목록이 섞이지 않는다. 같은 PC/같은 브라우저를 여러 명이 같이 쓰는 경우에는 저장 목록이 같이 보일 수 있다.

그래도 피드백 수집을 쉽게 하려면 저장명에 이름을 넣는 것을 권장한다.

```text
이름-선택팀-날짜
민수-T1-0608
지훈-KT-0608
```

로그인 기반 사용자 계정은 아직 없으므로, 브라우저를 초기화하거나 localStorage를 지우면 해당 브라우저의 beta ownerId가 바뀔 수 있다.

## 친구에게 보낼 짧은 안내문

```text
MOBA Esports Manager Lite 베타 테스트 부탁!

아래 주소로 접속하면 돼.
주소:

권장 환경은 PC/노트북 Chrome 또는 Edge야.
모바일 세로 화면은 아직 지원하지 않아.

목표는 버그 찾기보다, 처음 만졌을 때 뭐가 헷갈리고 어떤 화면이 재밌는지 알려주는 거야.

해볼 것:
1. 커리어 시작
2. 좋아하는 LCK 팀으로 로스터 구성
3. 전략/훈련 설정
4. 진행 버튼으로 경기 몇 번 진행
5. 대회 현황, 시즌 캘린더, 데이터 저장 화면 확인
6. 가능하면 시즌 요약이나 스토브리그까지 훑어보기

저장할 때는 저장명을 "이름-팀-날짜"로 해줘.
피드백은 "어느 화면에서 / 뭘 하다가 / 뭐가 이상했는지" 위주로 적어줘.
스크린샷이 있으면 최고.
```

## 10분 빠른 테스트 시나리오

목표: 첫인상과 기본 조작 확인

1. 첫 화면에서 커리어를 시작한다.
2. 로스터 구성 화면에서 포지션별 선수를 1명씩 채운다.
3. 예산 초과나 포지션 누락 메시지가 이해되는지 본다.
4. 메인 허브에 진입한 뒤 좌측 메뉴를 훑는다.
5. `전략 / 훈련`에서 전략과 훈련 강도를 바꾼다.
6. `대회 현황`과 `시즌 캘린더`를 한 번씩 연다.
7. `데이터 저장`에서 저장 버튼이 어디 있는지 찾는다.

기록할 것:

- 처음에 무엇을 해야 하는지 바로 알았는가
- 메뉴 이름이 이해되는가
- 글자가 잘리거나 겹친 화면이 있었는가

## 30분 기본 플레이 시나리오

목표: 한 세션 플레이 흐름 확인

1. 커리어 시작 후 로스터를 확정한다.
2. 메인 허브에서 다음 경기 정보를 확인한다.
3. 전략/훈련을 조정한다.
4. 진행 버튼으로 최소 3경기 이상 진행한다.
5. 경기 결과 후 선수 폼/피로도/사기 변화가 납득되는지 본다.
6. LCK Cup 또는 현재 대회 현황에서 순위/일정/브래킷을 확인한다.
7. 시즌 캘린더에서 다음 대회 흐름을 확인한다.
8. 데이터 저장 화면에서 수동 저장 후 새로고침/불러오기 흐름을 확인한다.

기록할 것:

- 진행 버튼과 플레이 버튼의 차이가 이해되는가
- 경기 결과가 너무 랜덤하거나 너무 뻔하게 느껴지는가
- 대회 현황이 “지금 시즌이 어디쯤인지” 알려주는가

## 장기 흐름 테스트 시나리오

목표: 3시즌 목표의 체감 확인

가능하면 자동 진행을 많이 눌러 다음 지점까지 확인한다.

- First Stand 또는 MSI 진입
- Asian Games 선택 모달
- Worlds 진입
- 시즌 요약
- 스토브리그
- 다음 시즌 LCK Cup

기록할 것:

- 시즌이 길게 흘러간다는 느낌이 있는가
- 중간에 무엇을 해야 하는지 모르는 날이 있는가
- 시즌 요약이 결산 화면처럼 느껴지는가
- 스토브리그 협상 UI가 이해되는가

## 피드백 양식

테스터 정보:

```text
이름:
테스트 날짜:
사용 브라우저:
화면 크기 또는 기기:
플레이 시간:
선택 팀:
도달한 지점:
```

5점 척도:

```text
첫 화면 이해도:
메뉴 이해도:
로스터 구성 편의성:
전략/훈련 화면 이해도:
경기 진행 재미:
대회 현황 이해도:
시즌 캘린더 이해도:
스토브리그 이해도:
저장/불러오기 이해도:
전체 UI 가독성:
다시 해보고 싶은 정도:
```

좋았던 점:

```text

```

헷갈렸던 점:

```text

```

버그/이상한 화면:

```text
화면:
한 행동:
예상한 결과:
실제로 나온 결과:
재현 가능 여부:
스크린샷 첨부 여부:
```

우선적으로 고쳤으면 하는 것:

```text

```

## 현재 베타에서 알려줘야 할 제한사항

- 모바일 세로 화면은 지원하지 않는다.
- Render 배포판은 브라우저별 beta ownerId로 저장을 분리하지만, 정식 로그인 계정은 아직 없다.
- 같은 PC/같은 브라우저를 여러 명이 같이 쓰면 저장 목록이 같이 보일 수 있다.
- Cloudflare Quick Tunnel 보조 방식은 베타 운영자가 cmd 창을 켜둔 동안에만 동작한다.
- 2026 LCK 1군 선수 사진은 베타 편의를 위한 임시 asset이며, 일부는 최신 증명사진과 다를 수 있다.
- 로그인, 사용자별 저장, 온라인 멀티플레이, AI-유저 트레이드 협상은 아직 없다.
- 실제 League of Legends 경기 수준의 정교한 밴픽/챔피언 메타는 후속 목표다.

## 베타 후 정리 방식

피드백은 다음 4개로 분류한다.

1. 치명적 버그
   - 진행 불가, 저장 불가, 화면 진입 불가, 흰 화면
2. 사용성 문제
   - 메뉴 이해 어려움, 버튼 위치 헷갈림, 정보 부족
3. 밸런스 문제
   - 경기 결과, 선수 능력치, 팀 격차, 연봉/예산 감각
4. 나중에 해도 되는 아이디어
   - 새 기능, 이벤트, 트레이드, 뉴스, 그래픽 개선

베타 직후에는 치명적 버그와 사용성 문제를 먼저 처리하고, 밸런스와 새 아이디어는 별도 후속 목록으로 분리한다.

## 참고

- Cloudflare Quick Tunnel은 개발/테스트용 임시 공개 주소를 만드는 용도다.
- Quick Tunnel은 `cloudflared tunnel --url http://localhost:8080` 형태로 로컬 서버를 공개 URL에 연결한다.
- 운영용 장기 배포는 Quick Tunnel이 아니라 별도 호스팅/정식 터널로 전환해야 한다.
- 공식 문서: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Cloudflare Tunnel setup 문서: https://developers.cloudflare.com/tunnel/setup/

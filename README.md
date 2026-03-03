# eBookRadar Page

정적(프론트엔드-only) 웹사이트로 데일리 마크다운 뉴스레터를 제공합니다.

## 페이지 구성

- `index.html`: 히어로 + 최근 7일 뉴스레터
- `newsletters.html`: 전체 뉴스레터 목록
- `newsletter.html?date=YYYY-MM-DD`: 날짜별 상세 뉴스레터

## 데이터 구조

- `content/index.json`
  - 뉴스레터 메타 정보(`date`, `title`, `file`)를 관리합니다.
  - 정적 호스팅 환경에서 디렉토리 자동 스캔이 불가능하므로 목록 인덱스가 필요합니다.
- `content/*.md`
  - 실제 뉴스레터 본문입니다.

## 신규 뉴스레터 추가 방법

1. `content/YYYY-MM-DD.md` 파일 추가
2. `content/index.json`에 항목 추가
3. 배포

## 로컬 확인

정적 서버로 실행해야 `fetch`가 정상 동작합니다.

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173` 접속

## index.json 자동 갱신

`content/*.md` 파일을 스캔해서 `content/index.json`을 자동으로 갱신하는 스크립트가 포함되어 있습니다.

```bash
node scripts/update-newsletter-index.js
```

- 마크다운 파일명 규칙: `YYYY-MM-DD.md`
- 제목 규칙: 각 마크다운의 첫 `#` 제목(H1) 우선, 없으면 기존 `index.json` 제목 또는 기본 제목 사용
- 정렬 규칙: 날짜 내림차순

GitHub Actions 워크플로(`.github/workflows/update-newsletter-index.yml`)는 위 스크립트를 실행하고, 변경이 있을 때만 `content/index.json`을 자동 커밋/푸시합니다.

# MyDol Frontend

이 프로젝트는 아이돌 티어표를 생성하고 공유할 수 있는 React 기반 프론트엔드 애플리케이션입니다.

## 기술 스택
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Utilities**: uuid, html2canvas, Axios
- **Architecture**: Docker 기반 개발 환경, 관심사 분리, Path Aliases (@/*)

## 실행 방법 (Docker)

프로젝트 루트 폴더에서 다음 명령어를 실행하세요:

```bash
docker compose up --build
```

- **호스트 접속 주소**: [http://localhost:3000](http://localhost:3000)
- **컨테이너 내부 포트**: 5173
- **백엔드 API 주소**: `http://localhost:8000` (기본값)

## 주요 기능
- **기기 UUID 관리**: `localStorage`를 통해 비회원 식별자(`creator_id`)가 자동 생성 및 유지됩니다.
- **티어표 CRUD**: 생성/수정/삭제 시 비밀번호 검증 모달이 나타납니다.
- **이미지 저장**: 티어표 영역을 PNG 파일로 다운로드할 수 있습니다.
- **공유**: Web Share API를 통해 모바일 등에서 즉시 링크 공유가 가능합니다.

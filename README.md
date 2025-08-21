# CCTV Control Center Frontend

React 기반의 CCTV 관제 시스템 프론트엔드입니다.

## 🚀 기술 스택

- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router DOM** for routing
- **Axios** for HTTP client
- **Leaflet.js** for map integration

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 16+ 
- npm 8+

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm start
```

### 프로덕션 빌드
```bash
npm run build
```

## 🌐 접속

- **개발 서버**: http://localhost:3000
- **백엔드 API**: http://localhost:8080

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout/         # 레이아웃 컴포넌트
│   └── EventList/      # 이벤트 목록 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard/      # 메인 대시보드
│   ├── CameraDetail/   # 카메라 상세 페이지
│   ├── EventManagement/# 이벤트 관리
│   └── VideoList/      # 비디오 목록
├── services/           # API 서비스
├── utils/              # 유틸리티 함수
└── App.tsx            # 메인 앱 컴포넌트
```

## 🔧 환경 설정

`.env` 파일을 생성하여 다음 환경변수를 설정하세요:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
```

## 📱 주요 기능

- 🗺️ 실시간 카메라 위치 지도
- 📹 카메라 실시간 스트림
- 🚨 이벤트 알림 및 관리
- 📊 카메라 상태 모니터링
- 🔍 이벤트 검색 및 필터링

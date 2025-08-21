# React 애플리케이션용 Multi-stage Dockerfile
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN npm run build

# 실행 단계 (Nginx로 정적 파일 서빙)
FROM nginx:alpine

# 빌드된 파일을 Nginx로 복사
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx 설정 파일 복사 (SPA 라우팅 지원)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]

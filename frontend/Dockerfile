# ===== Stage 1: Node 빌드 =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite 빌드 시점에 주입되는 환경변수 (build-arg)
ARG VITE_KAKAO_REST_API_KEY
ARG VITE_KAKAO_REDIRECT_URI
ARG VITE_API_BASE
ENV VITE_KAKAO_REST_API_KEY=$VITE_KAKAO_REST_API_KEY
ENV VITE_KAKAO_REDIRECT_URI=$VITE_KAKAO_REDIRECT_URI
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# ===== Stage 2: Nginx로 정적 파일 서빙 + /api 프록시 =====
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

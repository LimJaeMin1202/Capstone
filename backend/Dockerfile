# ===== Stage 1: 빌드 =====
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# 의존성 캐시를 위해 Gradle wrapper와 빌드 파일 먼저 복사
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew

# 소스 복사 후 jar 빌드
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# ===== Stage 2: 런타임 (가벼운 JRE) =====
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

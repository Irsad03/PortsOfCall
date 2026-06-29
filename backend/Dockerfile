FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
COPY service-navigation      ./service-navigation
COPY service-session         ./service-session
COPY service-player          ./service-player
COPY service-freight         ./service-freight
COPY service-game-engine     ./service-game-engine
COPY api-gateway             ./api-gateway

RUN chmod +x gradlew
RUN --mount=type=cache,target=/root/.gradle,sharing=locked \
    ./gradlew --no-daemon bootJar -x test --parallel

FROM eclipse-temurin:21-jre AS extract
WORKDIR /builder
ARG SERVICE_NAME
COPY --from=build /workspace/${SERVICE_NAME}/build/libs/*.jar service.jar
RUN java -Djarmode=tools -jar service.jar extract --layers

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=extract /builder/service/dependencies/          ./
COPY --from=extract /builder/service/spring-boot-loader/    ./
COPY --from=extract /builder/service/snapshot-dependencies/ ./
COPY --from=extract /builder/service/application/           ./

ENTRYPOINT ["java", "-jar", "service.jar"]

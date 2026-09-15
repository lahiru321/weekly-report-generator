# --- Build stage: compile the fat jar ---
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy wrapper + pom first so dependency downloads are cached separately from source changes
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# --- Runtime stage: just a JRE and the jar ---
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN useradd --system --create-home --home-dir /app appuser
COPY --from=build /app/target/backend-*.jar app.jar
USER appuser

# Render/Railway inject PORT at runtime; server.port already reads it (see application.properties)
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]

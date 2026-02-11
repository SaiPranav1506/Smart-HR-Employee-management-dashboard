# syntax=docker/dockerfile:1

# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy only pom first for better Docker layer caching
COPY pom.xml ./
COPY src ./src

RUN mvn -DskipTests package

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/*.jar /app/app.jar
CMD ["java", "-jar", "/app/app.jar"]

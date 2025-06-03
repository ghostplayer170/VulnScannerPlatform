# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1
FROM node:${NODE_VERSION}-slim AS base

# Install Java and required tools for SonarScanner
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre \
    wget \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install SonarScanner
RUN mkdir -p /opt/sonar-scanner \
    && curl -L https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip -o /opt/sonar-scanner.zip \
    && unzip /opt/sonar-scanner.zip -d /opt/ \
    && mv /opt/sonar-scanner-4.8.0.2856-linux/* /opt/sonar-scanner/ \
    && rm -rf /opt/sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner.zip

ENV PATH="/opt/sonar-scanner/bin:${PATH}"

WORKDIR /app

# Copy only package.json and package-lock.json for dependency installation
COPY --link package*.json ./

# Install npm dependencies
RUN npm install

# Copy application source code (excluding .env and node_modules via .dockerignore)
COPY . .

# Create a non-root user and switch to it
RUN useradd -m appuser
USER appuser

EXPOSE 5000

CMD ["npm", "start"]

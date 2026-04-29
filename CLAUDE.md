# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarHub is a cross-platform React Native mobile app (iOS, Android, Web) for location-based venue discovery and social interaction. The repo contains:

- **`/src/`** — React Native frontend (Expo, TypeScript)
- **`/barhub-be/`** — Java Spring Boot backend API
- **`/modules/shared/`** — Shared TypeScript utilities (local package)
- **`/website/`** — Static HTML landing/legal pages

## Frontend Commands

```bash
# Install dependencies (uses Yarn 3.6.4)
yarn install

# Start dev server (requires Expo dev client)
expo start --dev-client

# Run on platform
expo run:ios
expo run:android
expo start --web

# Format
npm run format          # write
npm run format:check    # check only

# i18n key scanning
npm run i18n:scan
```

No test suite is configured for the frontend.

## Backend Commands

```bash
cd barhub-be

# Install & compile
mvn clean install

# Run
mvn spring-boot:run

# Run all tests
mvn test

# Run a single test class
mvn test -Dtest=ClassName

# Run a single test method
mvn test -Dtest=ClassName#methodName
```

## Frontend Architecture

**State management:** Zustand stores (`src/app/utils/store/`) for user and location state. React Query v3 for server state with AsyncStorage persistence.

**Providers (nested in order):** `AuthProvider` → `AppStateProvider` → `NetworkProvider` → `RevenueCatProvider`. Auth state drives navigation — unauthenticated users see auth screens.

**API layer:** All backend calls go through Axios instances in `src/app/services/`. Token management (access + refresh) is centralized in `src/app/utils/tokenManager.ts`. Services return typed DTOs from `src/app/types/`.

**Navigation:** React Navigation v6 with nested navigators. Bottom tabs for main app; native-stack for auth and modal flows.

**Styling:** NativeWind v4 (Tailwind CSS for React Native) + Gluestack UI v3 components. Shared style utilities in `src/app/utils/styles/`.

**Localization:** i18next. Translation files in `src/localization/`. Run `npm run i18n:scan` after adding new translation keys.

**Environment:** `.env.dev` for development, `.env.prod` / `.env` for production. Key variables: `API_URL`, `APP_ENV`, `EXPO_PUBLIC_GOOGLE_API_KEY`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, AdMob IDs.

**Builds:** Expo EAS (`eas.json`) — `development` (simulator), `preview` (internal), `production` (store submission).

## Backend Architecture

**Layered architecture:** `Controller` → `Service` → `Repository` → `Entity`. All layers organized by domain (auth, post, comment, notification, leaderboard, admin, consent, gdpr, image, report).

**DTO mapping:** MapStruct mappers in `mapper/` handle all Entity ↔ DTO conversions. DTOs are in domain-specific subpackages of `dto/`.

**Auth:** Spring Security + JWT (JJWT). Google and Apple OAuth2 sign-in verification in `security/`. JWT tokens issued and validated per request.

**Geospatial:** Redis used for location caching (4-hour TTL) and geospatial queries for venue/user proximity. PostgreSQL for persistent data.

**File storage:** AWS S3 SDK configured against Cloudflare R2. Image upload/retrieval handled in `service/image/` and `controller/ImageController`.

**Config:** `application.properties` for PostgreSQL, Redis, JWT secret, email (Gmail SMTP), Cloudflare R2 credentials. Use environment variable overrides in production.

## Key Integrations

- **Google AdMob:** Banner ads. Ad unit IDs from environment variables.
- **Push notifications:** Expo Notifications with backend-side FCM delivery.
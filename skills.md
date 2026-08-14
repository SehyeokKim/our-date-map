# Project Skills & Capabilities Guide (`our-date-map`)

이 문서는 **`our-date-map`** 프로젝트의 기술 스택, 에이전트 및 개발자 스킬 목록, 주요 도구 및 개발 가이드라인을 정리한 가이드입니다.

---

## 🛠️ Key Technology Stack & Competencies

### 1. Frontend Framework & UI
- **Next.js 16 (App Router)**: Server Components, Server Actions, API Routes (`src/app/api/`)
- **React 19**: 최신 Hook 패턴 및 Concurrent Features
- **TypeScript**: 엄격한 타입 정의 (`src/types/`)
- **Tailwind CSS v4 & Lucide React**: 반응형 UI 및 모던 디자인 시스템 구축
- **Kakao Maps API & Public Transit API**: 장소 표시, 대중교통 경로 검색 및 지도 연동

### 2. Backend & Data Management
- **Supabase**: 
  - PostgreSQL 데이터베이스, 마이그레이션 (`supabase/migrations/`)
  - Authenticated Client (`@supabase/ssr`, `@supabase/supabase-js`)
  - Row Level Security (RLS) 및 Realtime Data 처리
- **Web Push API**: PWA notification (`web-push`)
- **Image Compression**: 클라이언트 측 이미지 압축 (`browser-image-compression`)

---

## 🤖 Agent & Workflow Skills

에이전트 작업 수행 시 사용 가능한 핵심 스킬들:

### 1. Next.js 16 & React 19 Architecture
- Next.js App Router API 규칙 및 비동기 서버 컴포넌트 패턴 준수
- Client / Server Component 분리 및 State 최적화
- Custom Hooks 및 Reusable Modal/UI 컴포넌트 개발 (`src/components/`)

### 2. Supabase Integration & Database Migration
- Supabase SQL 마이그레이션 작성 및 스키마 변경 관리 (`supabase/migrations/`)
- Client/Server 환경에 맞춘 Supabase SSR 클라이언트 사용

### 3. API & External Service Integration
- Kakao Map SDK & Transit API 연동 (`src/app/api/transit/`)
- Web Push 알림 발송 및 구독 관리

---
name: nextjs-app-router-patterns
description: "Comprehensive patterns for Next.js 14+ App Router architecture, Server Components, and modern full-stack React development."
risk: safe
source: community
date_added: "2026-02-27"
---

# Next.js App Router Patterns

Comprehensive patterns for Next.js 14+ App Router architecture, Server Components, and modern full-stack React development.

## Use this skill when

- Building new Next.js applications with App Router
- Migrating from Pages Router to App Router
- Implementing Server Components and streaming
- Setting up parallel and intercepting routes
- Optimizing data fetching and caching
- Building full-stack features with Server Actions

## Do not use this skill when

- The task is unrelated to next.js app router patterns
- You need a different domain or tool outside this scope

## Instructions

- Clarify goals, constraints, and required inputs.
- Apply relevant best practices and validate outcomes.
- Provide actionable steps and verification.
- If detailed examples are required, open `resources/implementation-playbook.md`.

## Resources

- `resources/implementation-playbook.md` for detailed patterns and examples.

## Limitations
- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.

---

## 📋 General Guidelines & Commands

- **개발 서버 실행**: `npm run dev`
- **프로젝트 빌드**: `npm run build`
- **코드 린트**: `npm run lint`

---
*Last Updated: 2026-08-05*

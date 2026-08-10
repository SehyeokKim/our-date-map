# Project Skills & Capabilities Guide (`our-date-map`)

??ë¬¸ì„œ??**`our-date-map`** ?„ë¡œ?íŠ¸??ê¸°ìˆ  ?¤íƒ, ?ì´?„íŠ¸ ë°?ê°œë°œ???¤í‚¬ ëª©ë¡, ì£¼ìš” ?„êµ¬ ë°?ê°œë°œ ê°€?´ë“œ?¼ì¸???•ë¦¬??ê°€?´ë“œ?…ë‹ˆ??

---

## ?› ï¸?Key Technology Stack & Competencies

### 1. Frontend Framework & UI
- **Next.js 16 (App Router)**: Server Components, Server Actions, API Routes (`src/app/api/`)
- **React 19**: ìµœì‹  Hook ?¨í„´ ë°?Concurrent Features
- **TypeScript**: ?„ê²©???€???•ì˜ (`src/types/`)
- **Tailwind CSS v4 & Lucide React**: ë°˜ì‘??UI ë°?ëª¨ë˜ ?”ì???œìŠ¤??êµ¬ì¶•
- **Kakao Maps API & Public Transit API**: ?¥ì†Œ ?œì‹œ, ?€ì¤‘êµ??ê²½ë¡œ ê²€??ë°?ì§€???°ë™

### 2. Backend & Data Management
- **Supabase**: 
  - PostgreSQL ?°ì´?°ë² ?´ìŠ¤, ë§ˆì´ê·¸ë ˆ?´ì…˜ (`supabase/migrations/`)
  - Authenticated Client (`@supabase/ssr`, `@supabase/supabase-js`)
  - Row Level Security (RLS) ë°?Realtime Data ì²˜ë¦¬
- **Web Push API**: PWA notification (`web-push`)
- **Image Compression**: ?´ë¼?´ì–¸??ì¸??´ë?ì§€ ?•ì¶• (`browser-image-compression`)

---

## ?¤– Agent & Workflow Skills

?ì´?„íŠ¸ ?‘ì—… ?˜í–‰ ???ìš© ê°€?¥í•œ ?µì‹¬ ?¤í‚¬??

### 1. Next.js 16 & React 19 Architecture
- Next.js App Router API ê·œì¹™ ë°?ë¹„ë™ê¸??œë²„ ì»´í¬?ŒíŠ¸ ?¨í„´ ì¤€??- Client / Server Component ë¶„ë¦¬ ë°?State ìµœì ??- Custom Hooks ë°?Reusable Modal/UI ì»´í¬?ŒíŠ¸ ê°œë°œ (`src/components/`)

### 2. Supabase Integration & Database Migration
- Supabase SQL ë§ˆì´ê·¸ë ˆ?´ì…˜ ?‘ì„± ë°??¤í‚¤ë§?ë³€ê²?ê´€ë¦?(`supabase/migrations/`)
- Client/Server ?˜ê²½??ë§ì¶˜ Supabase SSR ?´ë¼?´ì–¸???œìš©

### 3. API & External Service Integration
- Kakao Map SDK & Transit API ?°ë™ (`src/app/api/transit/`)
- Web Push ?Œë¦¼ ë°œì†¡ ë°?êµ¬ë… ê´€ë¦?
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

## ?“‹ General Guidelines & Commands

- **ê°œë°œ ?œë²„ ?¤í–‰**: `npm run dev`
- **?„ë¡œ?íŠ¸ ë¹Œë“œ**: `npm run build`
- **ì½”ë“œ ë¦°íŠ¸**: `npm run lint`

---
*Last Updated: 2026-08-05*


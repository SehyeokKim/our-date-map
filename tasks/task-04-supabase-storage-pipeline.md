# task-04-supabase-storage-pipeline

🎯 **목표 (Goal)**
- Supabase PostgreSQL 데이터베이스(`date_spots` 테이블)와 Storage 버킷(`date-photos`)을 연동합니다.
- 클라이언트 사이드 이미지 압축(`browser-image-compression`)을 수행하여 300KB 이하로 최적화된 데이트 사진만 업로드하는 데이터 처리 파이프라인을 구축합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.0`)

🛠️ **관련 코드 및 파일 경로 (Implemented Files)**
- `src/lib/supabase.ts`: Supabase JS 클라이언트 초기화 및 URL 트레일링 래핑
- `src/lib/upload.ts`: `uploadCompressedPhoto()` 함수 (`browser-image-compression` 300KB 이하 압축 및 Storage 업로드)
- `supabase/schema.sql`: `date_spots` 테이블 DDL, RLS 보안 정책, `date-photos` 스토리지 버킷 생성 및 RLS 정책
- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

📐 **구현 세부 스펙 (Specifications)**
- **데이터베이스 스키마 (`date_spots`):**
  - `id` (UUID), `title` (VARCHAR 255), `description` (TEXT), `latitude` (DOUBLE), `longitude` (DOUBLE), `image_url` (TEXT), `visited_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ).
- **이미지 압축 최적화:** `browser-image-compression` 옵션 (`maxSizeMB: 0.3`, `maxWidthOrHeight: 1200`, `useWebWorker: true`).
- **Storage 업로드:** 타임스탬프와 난수 기반 고유 파일명(`Date.now()_random.jpg`) 생성 후 `date-photos` 버킷 업로드 및 공개 접근 URL (`getPublicUrl`) 반환.
- **Row Level Security (RLS):** 익명 접근 권한(anon)을 통한 SELECT 및 INSERT 지원 정책 지정.

⚠️ **유지 관리 시 주의사항 (Caveats & Constraints)**
- DB 테이블 또는 스토리지 권한 변경 시 반드시 프로젝트 루트의 `supabase/schema.sql` 단일 출처 문서에 변경 사항을 업데이트해야 합니다.
- 압축 없이 원본 이미지를 업로드할 경우 모바일 데이터 소모 및 네트워크 지연이 발생하므로 업로드 전 압축 로직을 필수적으로 통과시켜야 합니다.

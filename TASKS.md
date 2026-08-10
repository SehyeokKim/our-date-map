# ?°ë¦¬?¤ì˜ ?°ì´??ì§€??(Our Date Map) - ?‘ì—… êµ¬í˜„ ?„í™© (`TASKS.md`)

??ë¬¸ì„œ??**?°ë¦¬?¤ì˜ ?°ì´??ì§€??* ?„ë¡œ?íŠ¸?ì„œ êµ¬í˜„ ?„ë£Œ???‘ì—…(Completed Tasks) ë°?êµ¬í˜„ ?ˆì • ?‘ì—…(Planned Tasks)???„ì²´ ê°œìš”?€ ?¸ë? ëª…ì„¸ ë§í¬ë¥?ê´€ë¦¬í•˜???„ë¡œ?íŠ¸ ë£¨íŠ¸ ì´ê´„ ë¬¸ì„œ?…ë‹ˆ??

---

## ?“Œ ?„ì²´ ì§„í–‰ ?í™© ?”ì•½ (Overall Status)

- **?„ì¬ ë²„ì „:** `v0.9.2`
- **êµ¬í˜„ ?„ë£Œ (Completed):** Task 01 ~ Task 19 (PWA, Kakao Map SDK, ?¤ì‹œê°?GPS, Supabase ?°ë™, ?¬ì§„ ?…ë¡œ?? ë¯¸ë˜ ?°ì´???Œë˜?? Kakao OAuth, Web Push & Popcat, profiles ë¶„ë¦¬, ?„ë¡œ???˜ì •, ?? œ ?€ ?´ì??? ODsay ?€ì¤‘êµ??ê²½ë¡œ, ? ì§œ ? íƒ ê¸°ë°˜ ë¯¸ë˜ ?°ì´???Œëœ DB ?€?? ?œìˆ˜ ì§€??ê¸°ë³¸ ?”ë©´ & ê³¼ê±°/ë¯¸ë˜ ?°ì´???¼ì • ëª©ë¡ ?Œì´?„ë¼?? ë¯¸ë˜ ?°ì´??ì½”ìŠ¤ ê²½ë¡œ ?êµ¬ ?€??ë°??¬ì‚¬???Œì´?„ë¼?? ?¸ì‹œ ?Œë¦¼ ë©”ì„¸ì§€ ?´ë ¥ DB ?€???Œì´?„ë¼?? ?°ì´??ì½”ìŠ¤ ?ì„¸ ?œë¡œ??UI ê°œì„  ë°?ê²½ë¡œ ?œì‹œ ?œì–´ ?œë‹, ë©”ëª¨ ?¤ì—¬?°ê¸° ?•ë ¬ ê°œì„  & ë¯¸ë˜ ?°ì´???Œë˜???€/ê²½ë¡œ ?€???œì–´)
- **ì§„í–‰ ?ˆì • (Planned):** ì¶”í›„ ì¶”ê? ?ˆì • ?¼ì²˜

---

## ?› ï¸?ì§€ê¸ˆê¹Œì§€ êµ¬í˜„???‘ì—… ëª©ë¡ (Implemented Tasks)

### 1. [Task 01] PWA ?¨ë… ?¤í–‰ ìµœì ??& ëª¨ë°”???ˆì´?„ì›ƒ
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-21 / ?ìš© ë²„ì „: `v0.1.0`)
- **ê°œìš”:** ëª¨ë°”??ë¸Œë¼?°ì? ë°?iOS/Android PWA ?¨ë…(standalone) ?¤í–‰ ?˜ê²½??ìµœì ?”ëœ ?€?¤í¬ë¦??ˆì´?„ì›ƒ??êµ¬ì¶•?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - `userScalable: false` ?¤ì •???µí•œ ëª¨ë°”???€ì¹?ì¤?ë°©ì?
  - `public/manifest.json` ??`display: standalone` ?¤ì •?¼ë¡œ ëª¨ë°”???±ê³¼ ?™ì¼??UX ?œê³µ
  - Tailwind CSS `backdrop-blur-md` ê¸°ë°˜ Glassmorphic ?¤ë” ë°?êµ¬í˜„
- **?ì„¸ ëª…ì„¸:** [`tasks/task-01-pwa-mobile-layout.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-01-pwa-mobile-layout.md)
- **ì£¼ìš” ?Œì¼:** [layout.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx), [manifest.json](file:///C:/Users/aica_/Desktop/projects/our-date-map/public/manifest.json), [globals.css](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/globals.css)

---

### 2. [Task 02] Kakao Map SDK ë¹„ë™ê¸??°ë™ & ?ˆì™¸ ì²˜ë¦¬
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-21 / ?ìš© ë²„ì „: `v0.1.1`)
- **ê°œìš”:** Kakao Maps JavaScript SDKë¥?Next.js App Router ?˜ê²½?ì„œ ë¹„ë™ê¸°ë¡œ ?ˆì „?˜ê²Œ ë¡œë“œ?˜ê³ , API ??ë¬¸ì œ??ë¯¸ë“±ë¡??„ë©”???‘ê·¼ ???¤ë¥˜ ?ˆë‚´ UIë¥??œê³µ?©ë‹ˆ??
- **ì£¼ìš” ?¤í™:**
  - `next/script` (`strategy="afterInteractive"`) ë°?`window.kakao.maps.load()` ?ˆì „ ?˜í•‘
  - ì´ˆê¸° ì§€??ì¢Œí‘œë¥??¨ì‚°?œìš¸?€??`37.551172, 126.988226`)ë¡??¤ì •
  - API ë¡œë“œ ?¤íŒ¨ ??ì¹´ì¹´??ê°œë°œ??ì½˜ì†” ?Œë«???¤ì • ?ˆë‚´ë¥??´ì? ê¸€?˜ìŠ¤ëª¨í”¼ì¦??ëŸ¬ ì¹´ë“œ UI ë°˜í™˜
- **?ì„¸ ëª…ì„¸:** [`tasks/task-02-kakao-map-integration.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-02-kakao-map-integration.md)
- **ì£¼ìš” ?Œì¼:** [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx), `.env.local`

---

### 3. [Task 03] ?¤ì‹œê°?GPS ?„ì¹˜ ì¶”ì  & Pulsing ë§ˆì»¤
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-21 / ?ìš© ë²„ì „: `v0.1.1`)
- **ê°œìš”:** HTML5 Geolocation APIë¥??¬ìš©?˜ì—¬ ?¬ìš©?ì˜ ?¤ì‹œê°?GPS ?„ì¹˜ë¥?ì¶”ì ?˜ê³ , ì§€???„ì— ?Œë™(ping) ? ë‹ˆë©”ì´??ë§ˆì»¤ë¡??œì‹œ?©ë‹ˆ??
- **ì£¼ìš” ?¤í™:**
  - `navigator.geolocation.watchPosition` (`enableHighAccuracy: true`) ê¸°ë°˜ ?¤ì‹œê°?ì¶”ì 
  - Kakao Maps `CustomOverlay`ë¥??œìš©???„ì‹±(ping) ?Œë™ ì»¤ìŠ¤?€ ?„ì¹˜ ë§ˆì»¤ ?œê°??
  - ìµœì´ˆ 1???¬ìš©???„ì¹˜ë¡??ë™ ?¬ì»¤??ë°??°í•˜??GPS FAB(Floating Action Button)???µí•œ ?¬í¬ì»¤ì‹± ê¸°ëŠ¥
- **?ì„¸ ëª…ì„¸:** [`tasks/task-03-realtime-gps-tracking.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-03-realtime-gps-tracking.md)
- **ì£¼ìš” ?Œì¼:** [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx), [globals.css](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/globals.css)

---

### 4. [Task 04] Supabase DB & ?¤í† ë¦¬ì? ?…ë¡œ???Œì´?„ë¼??
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-21 / ?ìš© ë²„ì „: `v0.1.0`)
- **ê°œìš”:** Supabase PostgreSQL ?°ì´?°ë² ?´ìŠ¤(`date_spots` ?Œì´ë¸??€ Storage ë²„í‚·(`date-photos`)???°ë™?˜ê³ , ?´ë¼?´ì–¸???¬ì´???´ë?ì§€ ?•ì¶• ?Œì´?„ë¼?¸ì„ êµ¬ì¶•?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - `date_spots` ?Œì´ë¸?schema DDL ë°?RLS (Row Level Security) ?•ì±… ?•ì˜
  - `browser-image-compression` ?œìš©: ?…ë¡œ?????¬ì§„??300KB ?´í•˜, ìµœë? ?´ìƒ??1200pxë¡??´ë¼?´ì–¸???•ì¶•
  - Supabase Storage `date-photos` ë²„í‚· ?€??ë°??¼ë¸”ë¦??‘ê·¼ URL (`getPublicUrl`) ë°˜í™˜
- **?ì„¸ ëª…ì„¸:** [`tasks/task-04-supabase-storage-pipeline.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-04-supabase-pipeline.md)
- **ì£¼ìš” ?Œì¼:** [supabase.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/lib/supabase.ts), [upload.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/lib/upload.ts), [schema.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/schema.sql)

---

### 5. [Task 05] ?°ì´???¥ì†Œ ë§ˆì»¤ ?œì‹œ & ?ì„¸ ë³´ê¸° ?œíŠ¸
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-21 / ?ìš© ë²„ì „: `v0.1.1`)
- **ê°œìš”:** Supabase DB???€?¥ëœ ?°ì´???¥ì†Œ ?°ì´?°ë? ?¨ì¹­?˜ì—¬ ì§€???„ì— ë¶„í™???˜íŠ¸ ì»¤ìŠ¤?€ ë§ˆì»¤ë¡??Œë”ë§í•˜ê³? ?°ì¹˜ ???ì„¸ ?•ë³´ë¥??•ì¸?????ˆëŠ” ë°”í? ?œíŠ¸ë¥??¸ì¶œ?©ë‹ˆ??
- **ì£¼ìš” ?¤í™:**
  - Kakao Maps `CustomOverlay`ë¥??œìš©??ë¶„í™???˜íŠ¸ ë§ˆì»¤ ?Œë”ë§?
  - ë§ˆì»¤ ?°ì¹˜ ??ì§€???´ë™(`map.panTo`) ë°??´ë²¤??ë²„ë¸”ë§?ì°¨ë‹¨ (`e.stopPropagation()`)
  - ë°”í? ?œíŠ¸ë¥??µí•œ ì¶”ì–µ ?¬ì§„, ?œêµ­???¬ë§· ? ì§œ, ?¥ì†Œëª? ?°ì´???´ì•¼ê¸?ë°?ì¢Œí‘œ ?œì‹œ
- **?ì„¸ ëª…ì„¸:** [`tasks/task-05-spot-marker-detail-sheet.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-05-spot-marker-detail-sheet.md)
- **ì£¼ìš” ?Œì¼:** [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx), [schema.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/schema.sql)

---

### 6. [Task 06] ?¤ì¤‘ ?¬ì§„ ?…ë¡œ??ìµœë? 10?? & 2?¨ê³„ ?”ì•½/?ì„¸?ˆë³´ê¸??ì—… êµ¬ì¶•
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-22 / ?ìš© ë²„ì „: `v0.2.0`)
- **ê°œìš”:** ?°ì´??ê¸°ë¡ ???¬ì§„ ìµœë? 10???…ë¡œ??ì§€??`image_urls TEXT[]`), 1?¨ê³„ ?”ì•½ ?ì—…(?€?œì‚¬ì§?1?? 1ì¤?ë©”ëª¨, ?œëª©ë§í¬) ??2?¨ê³„ ?„ì²´ ?ì„¸?ˆë³´ê¸??ì—…(?¬ì§„ 10??ìºëŸ¬?€ ê°¤ëŸ¬ë¦? ë©”ëª¨ ?„ë¬¸, ?—‘ï¸??€ ?? œ ë²„íŠ¼) ?¬êµ¬ì¶?
- **ì£¼ìš” ?¤í™:**
  - ìµœë? 10???¤ì¤‘ ?¬ì§„ ? íƒ, ê°œë³„ ?•ì¶• ?…ë¡œ??ë°?`image_urls TEXT[]` ?¤í‚¤ë§?ë§ˆì´ê·¸ë ˆ?´ì…˜ (`20260722022000_add_image_urls_array_to_date_spots.sql`)
  - 1?¨ê³„ ?”ì•½ ?ì—…([SpotSummarySheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/SpotSummarySheet.tsx)): ?€?œì‚¬ì§?1?? 1ì¤?ë©”ëª¨, ?œëª© ë§í¬, ?€ ?? œ ë²„íŠ¼ ?œê±°
  - 2?¨ê³„ ?„ì²´ ?ì„¸?ˆë³´ê¸??ì—…([SpotDetailSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/SpotDetailSheet.tsx)): 10??ê°¤ëŸ¬ë¦??¬ë¼?´ë” ìºëŸ¬?€, ë©”ëª¨ ?„ë¬¸, ?“ ?„ê²½?? ?—‘ï¸??€ ?? œ ë²„íŠ¼
- **?ì„¸ ëª…ì„¸:** [`tasks/task-06-map-click-marker-modal.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-06-map-click-marker-modal.md)
- **ì£¼ìš” ?Œì¼:** [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx), [AddSpotModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/AddSpotModal.tsx), [SpotSummarySheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/SpotSummarySheet.tsx), [SpotDetailSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/SpotDetailSheet.tsx)

---

### 7. [Task 07] ë¯¸ë˜ ?°ì´???Œë˜??& Kakao Mobility API ì½”ìŠ¤ ?œê°??
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-23 / ?ìš© ë²„ì „: `v0.3.0`)
- **ê°œìš”:** ?¤ë” ?œë¡­?¤ìš´ ë©”ë‰´ë¥??µí•´ 'ì¶”ì–µ ?°ì´??ì§€???€ 'ë¯¸ë˜ ?°ì´???Œë˜?? ëª¨ë“œë¥??ìœ ë¡?²Œ ?„í™˜?˜ê³ , ë¯¸ë˜ ë°©ë¬¸???°ì´???¥ì†Œë¥??œì„œ?€ë¡??€ ì°ì–´ Kakao Mobility API (`/api/directions`) ê¸°ë°˜ ê²½ë¡œ ì½”ìŠ¤(Polyline) ë°?ê±°ë¦¬/?œê°„???œê°?”í•˜??ê¸°ëŠ¥??êµ¬í˜„?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - Glassmorphic ?¸í„°?™í‹°ë¸??œë¡­?¤ìš´ ë©”ë‰´ ?¤ë” ([Header.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/common/Header.tsx))
  - ë¯¸ë˜ ?Œë˜??ì½”ìŠ¤ ?€ ì¶”ê? ([AddPlannedSpotModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/AddPlannedSpotModal.tsx)) ë°??œì„œ ë³€ê²??? œ/ì´ˆê¸°???œì–´ ë°”í? ?œíŠ¸ ([FuturePlanSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/FuturePlanSheet.tsx))
  - Kakao Mobility ?¤ì¤‘ ê²½ìœ ì§€ Route Handler (`/api/directions/route.ts`) ?°ë™, `Polyline` ê²½ë¡œ???œê°??ë°?`localStorage` ?ë™ ë³´ì¡´
- **?ì„¸ ëª…ì„¸:** [`tasks/task-07-future-date-planning.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-07-future-date-planning.md)
- **ì£¼ìš” ?Œì¼:** [route.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/api/directions/route.ts), [Header.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/common/Header.tsx), [useFuturePlanner.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useFuturePlanner.ts), [useDirections.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useDirections.ts), [FuturePlanSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/FuturePlanSheet.tsx)

---

### 8. [Task 08] Kakao OAuth ?¸ì¦ ?°ë™ & ?°ì´???¥ì†Œ ?‘ì„±??ì¶”ì 
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-23 / ?ìš© ë²„ì „: `v0.4.0`)
- **ê°œìš”:** Kakao OAuth ê°„í¸ ë¡œê·¸???°ë™(`@supabase/ssr`)??êµ¬ì¶•?˜ê³ , ?°ì´???€ ì¶”ê? ???‘ì„±?ì˜ ID ë°??‰ë„¤???„ë¡œ???¬ì§„???ë™?¼ë¡œ ?€?¥í•˜ë©??ì„¸ ë³´ê¸°?ì„œ ?‘ì„±???•ë³´ë¥??œê°?”í•©?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - DB ì»¬ëŸ¼ ë§ˆì´ê·¸ë ˆ?´ì…˜ (`user_id`, `created_by`, `creator_nickname`, `creator_avatar_url`) ë°?RLS ?Œìœ ê¶??•ì±… ?ìš© (`20260723103136_add_user_id_to_spots_and_records.sql`)
  - Supabase Browser & Server Client (`src/lib/supabase/client.ts`, `server.ts`) ë°?Auth Callback Route Handler (`/auth/callback/route.ts`) êµ¬í˜„
  - ?€ ê¸°ë¡ ???¸ì¦ ?¸ì…˜??`user_id` ?ë™ ì²¨ë? ë°??ì„¸ ?œíŠ¸ `(??ê¸°ë¡)` ?‘ì„±??ë°°ì? ?œê°??
  - Kakao OAuth `redirectTo` (`${origin}/auth/callback`) ?™ì  ?¤ì • ë°?KOE205 ë°©ì?ë¥??„í•œ `scopes` / `queryParams.scope` ëª…ì‹œ???¬ì •??(`profile_nickname profile_image`)
  - Auth Callback Route Handler ?¸ì…˜ êµí™˜ ì¶”ì  ë°??œë²„/?´ë¼?´ì–¸???ˆì™¸ ë¡œê¹… ì¶”ê?
  - ?¤ë” ?œë¡­?¤ìš´ ??ì¹´ì¹´??ê°„í¸ ë¡œê·¸??/ ?„ë¡œ??& ë¡œê·¸?„ì›ƒ UI ?µí•© ë°??ì„¸ ?œíŠ¸ ?‘ì„±??ë°°ì? ?¸ì¶œ
- **?ì„¸ ëª…ì„¸:** [`tasks/task-08-kakao-auth-creator-tracking.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-08-kakao-auth-creator-tracking.md)
- **ì£¼ìš” ?Œì¼:** [client.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/lib/supabase/client.ts), [server.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/lib/supabase/server.ts), [useAuth.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useAuth.ts), [Header.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/common/Header.tsx), [SpotDetailSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/SpotDetailSheet.tsx)

---

### 9. [Task 09] Web Push ?Œë¦¼ ? ê? UI & ?¤ì‹œê°??„ì†¡ ?Œì´?„ë¼??
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-24 / ?ìš© ë²„ì „: `v0.5.0`)
- **ê°œìš”:** ?¤ë” ?„ë¡œ??ì¹´ë“œ ??Popcat ?´ë?ì§€ ë²„íŠ¼(`popcat_close.png` / `popcat_open.png`)???µí•œ ???¸ì‹œ ?Œë¦¼ ON/OFF ? ê?, 1ì´?ë¡±í”„?ˆìŠ¤ ?œìŠ¤ì²?ê¸°ë°˜ ì»¤ìŠ¤?€ ?Œë¦¼ ë¬¸êµ¬ ?¤ì • ëª¨ë‹¬([CustomPushMessageModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/CustomPushMessageModal.tsx)), ë°?ì§€???°ì¸¡ ?˜ë‹¨ Popcat ?Œë¦¼ ?„ì†¡ ë²„íŠ¼(1ì´??¤í”ˆ ? ë‹ˆë©”ì´??& ì¿¨ë‹¤????êµ¬í˜„?˜ê³ , Web Push API ë°??œë¹„???Œì»¤ë¥??°ë™?˜ì—¬ ?¤ì‹œê°??Œë¦¼??ë°œì†¡?©ë‹ˆ??
- **ì£¼ìš” ?¤í™:**
  - ?„ë¡œ??ì¹´ë“œ ?˜ë‹¨ ?ìº£ ?„ì¹˜ ([Header.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/common/Header.tsx)): `[ë¡œê·¸?„ì›ƒ]` ì¢Œì¸¡ ë³´ë”ë¦¬ìŠ¤ transparent ë²„íŠ¼, Popcat ì»¤ìŠ¤?€ ?´ë?ì§€ (`popcat_close.png` / `popcat_open.png`), 1ì´?ë¡±í”„?ˆìŠ¤ ??ë¬¸êµ¬ ?¤ì • ëª¨ë‹¬ ?¤í”ˆ
  - ì»¤ìŠ¤?€ ë©”ì‹œì§€ ?¤ì • ëª¨ë‹¬ ([CustomPushMessageModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/CustomPushMessageModal.tsx)): Popcat ë²„íŠ¼ 1ì´?ë¡±í”„?ˆìŠ¤ ???…í‹± ì§„ë™ ?¼ë“œë°±ê³¼ ?¨ê»˜ ?¤í”ˆ, ?œëª©/ë³¸ë¬¸ ?…ë ¥, ???„ë¦¬??ì¹?"ì§€ê¸?ë­í•´? ?¤”", "ë³´ê³  ?¶ì–´ ?’–" ??, `localStorage` (`our_date_map_custom_push_message`) ?€??
  - ì§€???Œë¡œ???ìº£ ?„ì†¡ ?„ì¹˜ ([MapContainer.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/map/MapContainer.tsx)): ?…ë¦½ ?˜ì • ë²„íŠ¼ ?œê±°, ?¸ì‹œ ON ???°ì¸¡ ?˜ë‹¨ ?¸ì¶œ, ???°ì¹˜ ???¬ìš©??ì»¤ìŠ¤?€ ?˜ì´ë¡œë“œë¡?ì¦‰ì‹œ ?ë?ë°??Œë¦¼ ?„ì†¡ ë°?1ì´ˆê°„ ??ë²Œë¦¬??? ë‹ˆë©”ì´??`popcat_open.png`), 1ì´?ë¡±í”„?ˆìŠ¤ ??ë¬¸êµ¬ ?¤ì • ëª¨ë‹¬ ?¤í”ˆ
  - Web Push ?œë¹„???Œì»¤ ([sw.js](file:///C:/Users/aica_/Desktop/projects/our-date-map/public/sw.js)) ë°±ê·¸?¼ìš´???¸ì‹œ ë°??´ë¦­ ?¬ì»¤??ì²˜ë¦¬
  - `push_subscriptions` DB ë§ˆì´ê·¸ë ˆ?´ì…˜ ë°?Next.js Route Handler (`/api/push/send/route.ts`)
- **?ì„¸ ëª…ì„¸:** [`tasks/task-09-web-push-popcat-profile.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-09-web-push-popcat-profile.md)
- **ì£¼ìš” ?Œì¼:** [sw.js](file:///C:/Users/aica_/Desktop/projects/our-date-map/public/sw.js), [useWebPush.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useWebPush.ts), [route.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/api/push/send/route.ts), [Header.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/common/Header.tsx), [MapContainer.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/map/MapContainer.tsx), [CustomPushMessageModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/CustomPushMessageModal.tsx)

---

### 10. [Task 10] ?‘ì„±??ë©”í??°ì´??profiles ?Œì´ë¸?ë¶„ë¦¬ ë°??™ì  ê´€ê³„í˜• ì¡°ì¸
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-24 / ?ìš© ë²„ì „: `v0.4.0`)
- **ê°œìš”:** `date_spots` ?Œì´ë¸????˜ë“œì½”ë”©???‘ì„±??ë©”í??°ì´??ì»¬ëŸ¼??`creator_nickname`, `creator_avatar_url`)???„ë©´ ?œê±°?˜ê³ , `auth.users(id)`?€ 1:1 ?€?‘ë˜??`public.profiles` ?Œì´ë¸”ì„ ? ì„¤?˜ì—¬ `created_by` (UUID) ?¸ë˜??FK) ê¸°ë°˜ dynamic relational JOIN êµ¬ë¬¸?¼ë¡œ ë¦¬íŒ©? ë§?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - `public.profiles` ?Œì´ë¸?? ì„¤ ë°?RLS ?•ì±…(?„ì²´ ì¡°íšŒ ?ˆìš©, ?ê? ?˜ì • ?œí•œ) ?ìš© (`20260723233625_decouple_creator_data_to_profiles.sql`)
  - ?Œì›ê°€?????„ë¡œ???ë™ ?ì„± DB ?¸ë¦¬ê±?(`on_auth_user_created`) ë°?ê¸°ì¡´ ? ì? ë°±í•„ ë¡œì§ êµ¬í˜„
  - `date_spots` ?Œì´ë¸”ì—???‘ì„±???ìŠ¤??ì»¬ëŸ¼ ?? œ ë°?`created_by REFERENCES public.profiles(id)` FK ?•ì˜
  - Supabase ì¡°íšŒ ì¿¼ë¦¬ ?™ì  JOIN ?°ë™ (`.select('*, profiles(id, nickname, profile_image_url)')`)
  - UI ì»´í¬?ŒíŠ¸ ?™ì  ?„ë¡œ???‘ê·¼ ?°ë™ (`spot.profiles.nickname`, `spot.profiles.profile_image_url`)
- **ì£¼ìš” ?Œì¼:** [20260723233625_decouple_creator_data_to_profiles.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/migrations/20260723233625_decouple_creator_data_to_profiles.sql), [schema.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/schema.sql), [supabase.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/types/supabase.ts), [spot.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/types/spot.ts), [useDateSpots.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useDateSpots.ts), [SpotDetailSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/SpotDetailSheet.tsx)

---

### 11. [Task 11] ?„ë¡œ???˜ì • ëª¨ë‹¬ UI êµ¬ì¶• & DB/?¤í† ë¦¬ì? ?™ê¸°??
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-24 / ?ìš© ë²„ì „: `v0.4.0`)
- **ê°œìš”:** ?¤ë” ?œë¡­?¤ìš´???¬ìš©??ì¹´ë“œë¥??´ë¦­?˜ì—¬ ?‰ë„¤?„ê³¼ ?„ë¡œ???¬ì§„??ì§ì ‘ ë³€ê²½í•  ???ˆëŠ” ?„ë¡œ???˜ì • ëª¨ë‹¬ UI([ProfileEditModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/ProfileEditModal.tsx))ë¥?êµ¬í˜„?˜ê³ , Supabase Storage `avatars` ë²„í‚· ë°?`public.profiles` DB ?™ê¸°???Œì´?„ë¼?¸ì„ êµ¬ì¶•?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - ?¤ë” ?œë¡­?¤ìš´ ?˜ë‹¨ ? ì? ?„ë¡œ??ì¹´ë“œ ?´ë¦­ ?¸ë¦¬ê±?ë°??¸ë²„ ?¸í„°?™ì…˜ ([Header.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/common/Header.tsx))
  - `ProfileEditModal` UI: ?„ë¡œ???¬ì§„ 300KB ?•ì¶• ë°??¤ì‹œê°?ë¯¸ë¦¬ë³´ê¸°, ?‰ë„¤???…ë ¥, `ì·¨ì†Œ`/`?€?? ë²„íŠ¼ ([ProfileEditModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/ProfileEditModal.tsx))
  - Supabase Storage `avatars` ?¼ë¸”ë¦?ë²„í‚· ë§ˆì´ê·¸ë ˆ?´ì…˜ (`20260723235156_add_avatars_storage_bucket.sql`)
  - `useAuth` ??ê°•í™”: `profiles` ì¡°íšŒ/upsert, Kakao OAuth ê¸°ë³¸ê°??ë™ ?´ë°±, ?¤ì‹œê°??„ì—­ ?„ë¡œ???™ê¸°??([useAuth.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useAuth.ts))
- **ì£¼ìš” ?Œì¼:** [ProfileEditModal.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/ProfileEditModal.tsx), [useAuth.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useAuth.ts), [upload.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/lib/upload.ts), [Header.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/common/Header.tsx), [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx), [schema.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/schema.sql)

---

### 12. [Task 12] ?? œ???°ì´???€ ?´ì????Œì´ë¸?(deleted_date_spots) & ?Œí”„???? œ ë©”ì»¤?ˆì¦˜
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-24 / ?ìš© ë²„ì „: `v0.4.0`)
- **ê°œìš”:** ?€ ?? œ ???ë³¸ ?°ì´?°ì˜ ?˜ë“œ ?? œë¥?ë°©ì??˜ê³  ?´ì??µì— ë³´ì¡´ ë°?ë³µì›?????ˆë„ë¡?`deleted_date_spots` ?„ìš© ?Œì´ë¸?ë°?RLS ?•ì±…??êµ¬ì¶•?˜ê³ , ?Œí”„???? œ ?Œí¬?Œë¡œ?°ë? ?„ì„±?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - `deleted_date_spots` ?´ì????Œì´ë¸?? ì„¤ ë§ˆì´ê·¸ë ˆ?´ì…˜ (`20260724000135_create_deleted_date_spots_table.sql`)
  - ì»¬ëŸ¼: `id`, `original_spot_id`, `spot_data` (JSONB), `deleted_by`, `deleted_at`, `reason`
  - ?€ ?? œ ???¤íŒŸ ?„ì²´ ?°ì´?°ë? `deleted_date_spots`???„ì¹´?´ë¹™?˜ê³  `date_spots` ??`deleted_at = NOW()` ì²˜ë¦¬
  - ?Œí”„???? œ???€ ë³µì› ë©”ì„œ??(`restoreDateSpot`) ë°??´ì???ëª©ë¡ ?¨ì¹­ (`fetchDeletedSpots`) êµ¬í˜„
- **ì£¼ìš” ?Œì¼:** [20260724000135_create_deleted_date_spots_table.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/migrations/20260724000135_create_deleted_date_spots_table.sql), [schema.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/schema.sql), [useDateSpots.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useDateSpots.ts), [spot.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/types/spot.ts), [SpotDetailSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/SpotDetailSheet.tsx)

---

### 13. [Task 13] ODsay ?€ì¤‘êµ??ê¸¸ì°¾ê¸?API ?°ë™ ë°?ë¯¸ë˜ ?°ì´???Œë˜??ê²½ë¡œ ì¹´ë“œ ?°ë™
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-24 / ?ìš© ë²„ì „: `v0.6.0`)
- **ê°œìš”:** ODsay ?€ì¤‘êµ??ê¸¸ì°¾ê¸?API(`searchPubTransPathT`) ?„ë¡??API ?¸ë“¤?¬ë? êµ¬ì¶•?˜ê³ , ë¯¸ë˜ ?°ì´??ì½”ìŠ¤???±ë¡???¥ì†Œ ê°??´ë™ ?€ì¤‘êµ??ê²½ë¡œ(?Œìš”?œê°„, ?”ê¸ˆ, ?´ë™ ?˜ë‹¨ ?•ë³´) ì¹´ë“œ UI ë°??¸ë©”ëª¨ë¦¬ ìºì‹±??êµ¬í˜„?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - ?œë²„ ?¬ì´??API Route Handler (`/api/transit/route.ts`) êµ¬í˜„: `ODSAY_API_KEY` ë³´ì•ˆ ?˜í•‘ ë°?`console.error('Transit API Error:', err)` ?ˆì™¸ ë¡œê·¸/500 ?‘ë‹µ ëª…í™•??
  - Kakao OAuth ?„ë¡œ???´ë?ì§€ Mixed Content ê²½ê³  ?´ê²°: `http://` ì¹´ì¹´??CDN ?„ë¡œ??ì£¼ì†Œë¥?`https://`ë¡??ˆì „?˜ê²Œ ?ë™ ?„í™˜ (`useAuth.ts`, `SpotDetailSheet.tsx`)
  - ?¸ë©”ëª¨ë¦¬ Map ìºì‹± ê¸°ë°˜ `useTransitRoute` ???‘ì„±: ?™ì¼ êµ¬ê°„ ì¤‘ë³µ API ?¸ì¶œ ë°©ì? ë°?ë¹„ìƒ???„ë³´/ì§ì„  ê²½ë¡œ ?´ë¼?´ì–¸???ˆì •???´ë°± ì²˜ë¦¬
  - ë¯¸ë˜ ?°ì´???Œë˜??UI ?°ë™ (`FuturePlanSheet.tsx`): ?€ê³??€ ?¬ì´???€ì¤‘êµ???´ë™ ?•ë³´ ì¹´ë“œ(?±ï¸ ?Œìš”?œê°„, ?’³ ?”ê¸ˆ, ?š‰ ì§€?˜ì² /ë²„ìŠ¤ ?¸ì„ ) ?œê°??ë°??¨ê±°ë¦??„ë³´ ?ˆì™¸ ì²˜ë¦¬
- **ì£¼ìš” ?Œì¼:** [route.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/api/transit/route.ts), [useTransitRoute.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useTransitRoute.ts), [transit.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/types/transit.ts), [useAuth.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useAuth.ts), [FuturePlanSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/FuturePlanSheet.tsx), [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx)

---

### 14. [Task 14] ? ì§œ ? íƒ ê¸°ë°˜ ë¯¸ë˜ ?°ì´???Œëœ ?ì„± ë°?Supabase DB ?êµ¬ ?€???Œì´?„ë¼??(!DB)
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-24 / ?ìš© ë²„ì „: `v0.7.0`)
- **ê°œìš”:** ë¯¸ë˜ ?°ì´???Œë˜??ëª¨ë“œ?ì„œ ? ì§œ(`plan_date`)ë¥?? íƒ?˜ì—¬ ì½”ìŠ¤ë¥?êµ¬ì„±?˜ê³ , ?‘ì„±???Œëœ??Supabase PostgreSQL `public.date_plans` ?Œì´ë¸”ì— ?êµ¬ ?€??ë°??¸ì œ? ì? ?í„°ì¹?ë³µì›/?? œ?????ˆëŠ” ?Œì´?„ë¼?¸ì„ êµ¬ì‚¬?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - `public.date_plans` DB ?Œì´ë¸?ë§ˆì´ê·¸ë ˆ?´ì…˜ (`20260724074000_create_date_plans_table.sql`) ë°?RLS ?•ì±… ?•ì˜
  - HTML5 ? ì§œ ? íƒ ì»¨íŠ¸ë¡?(`selectedDate`, ê¸°ë³¸ê°? ?¤ëŠ˜) ë°??€?¥ëœ DB ?Œëœ ë³µì› ì¹?ëª©ë¡ UI êµ¬ì¶• ([FuturePlanSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/FuturePlanSheet.tsx))
  - `useFuturePlanner` ??ê°•í™”: Supabase `date_plans` DB CRUD sync (`savePlanToDb`, `fetchPlansForDate`, `loadPlanFromDb`, `deletePlanFromDb`)
- **?ì„¸ ëª…ì„¸:** [`tasks/task-14-date-plan-persistence.md`](file:///C:/Users/aica_/Desktop/projects/our-date-map/tasks/task-14-date-plan-persistence.md)
- **ì£¼ìš” ?Œì¼:** [20260724074000_create_date_plans_table.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/migrations/20260724074000_create_date_plans_table.sql), [schema.sql](file:///C:/Users/aica_/Desktop/projects/our-date-map/supabase/schema.sql), [supabase.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/types/supabase.ts), [planner.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/types/planner.ts), [useFuturePlanner.ts](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/hooks/useFuturePlanner.ts), [FuturePlanSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/FuturePlanSheet.tsx), [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx)

---

### 15. [Task 15] ?œìˆ˜ ì§€??ê¸°ë³¸ ?”ë©´ & ê³¼ê±°/ë¯¸ë˜ ?°ì´???¼ì • ëª©ë¡ ?Œì´?„ë¼??(!DB)
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-24 / ?ìš© ë²„ì „: `v0.8.0`)
- **ê°œìš”:** ??ì§„ì… ???œìˆ˜ ì§€???”ë©´??ê¸°ë³¸?¼ë¡œ ?¸ì¶œ?˜ê³ , ê¸°ê°„ ?¤ì •(`start_date` ~ `end_date`) ?°ì´??ì¶”ê? ëª¨ë‹¬ê³?ê³¼ê±°/ë¯¸ë˜ ?„ì²´ ?°ì´???¼ì • ëª©ë¡ ëª¨ë‹¬(`DateItineraryModal`)??êµ¬í˜„?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - `public.date_plans` ?Œì´ë¸”ì— `start_date` ë°?`end_date` ì»¬ëŸ¼ ì¶”ê? ë§ˆì´ê·¸ë ˆ?´ì…˜ (`20260724074500_add_date_range_to_date_plans.sql`)
  - ê¸°ë³¸ ì§„ì… ???˜ë‹¨ ?œë¡œ?´ë? ?‘íŒ ?íƒœ(`isExpanded = false`)ë¡?? ì??˜ì—¬ ?œìˆ˜ ?€?¤í¬ë¦?ì§€??ë·?ë³´ì¥
  - ê³¼ê±° ?°ì´??`end_date < today`) ë°?ë¯¸ë˜ ?°ì´??`start_date >= today`) ??ë¶„ë¦¬ ?¼ì • ëª©ë¡ ëª¨ë‹¬ (`DateItineraryModal.tsx`)
  - ?¹ì¼ì¹˜ê¸°/1ë°???2ë°?????ì¹?ì§€??ê¸°ê°„ ? íƒ ?°ì´???ì„± ëª¨ë‹¬ (`CreateDatePlanModal.tsx`)
### 19. [Task 19] ë©”ëª¨ ?¤ì—¬?°ê¸° ?•ë ¬ ê°œì„  & ë¯¸ë˜ ?°ì´???Œë˜???€/ê²½ë¡œ ?€???œì–´
- **?íƒœ:** `Completed` (?„ë£Œ?? 2026-07-27 / ?ìš© ë²„ì „: `v0.9.2`)
- **ê°œìš”:** ë©”ëª¨ ê°œí–‰ ???¤ì—¬?°ê¸° ?•ë ¬ ?¤í????´ìŠˆ ë°?ë¯¸ë˜ ?°ì´???Œë˜??ì§„ì… ???€ ?€???”ì²­??ë°˜ì˜?ˆìŠµ?ˆë‹¤.
- **ì£¼ìš” ?¤í™:**
  - ì½”ìŠ¤ ?¥ì†Œ ì¹´ë“œ ??ë©”ëª¨(`memo`)??ë§í’???„ì´ì½??’¬)ê³?ë³¸ë¬¸ ?ìŠ¤???ì—­??Flex ?ˆì´?„ì›ƒ?¼ë¡œ ?„ë²½ ë¶„ë¦¬?˜ì—¬, 2ì¤??´ìƒ ì¤„ë°”ê¿?ì¶œë ¥ ?œì—???˜ì§¸ ì¤??´í•˜ ?ìŠ¤?¸ê? ì²«ì§¸ ì¤??ìŠ¤???œì‘?ì— ë§ì¶° ?•ë ¬?˜ë„ë¡?ê°œì„ 
  - ?ë‹¨ ë©”ë‰´??'ë¯¸ë˜ ?°ì´???Œë˜?? ëª¨ë“œë¡?ì§„ì… ??ê²½ë¡œ? ë¿ë§??„ë‹ˆ??ì§€?????€(`plannedSpotMarkers`)???¨ê»˜ ?€??ì²˜ë¦¬ ?ìš©
  - '?¼ì • ëª©ë¡' ëª¨ë‹¬ ?´ì˜ **'ì§€?„ì—??ì½”ìŠ¤ ë³´ê¸°'** ë²„íŠ¼???°ì¹˜?ˆì„ ?Œë§Œ ?´ë‹¹ ì½”ìŠ¤???¥ì†Œ ?€ê³?ìµœì  ê²½ë¡œ(Polyline)ê°€ ì§€?„ì— ?¨ê»˜ ?Œë”ë§ë˜?„ë¡ ?œë‹
- **ì£¼ìš” ?Œì¼:** [FuturePlanSheet.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/components/modal/FuturePlanSheet.tsx), [page.tsx](file:///C:/Users/aica_/Desktop/projects/our-date-map/src/app/page.tsx)












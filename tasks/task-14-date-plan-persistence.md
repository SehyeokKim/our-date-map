# [Task 14] ? ì§œ ? íƒ ê¸°ë°˜ ë¯¸ë˜ ?°ì´???Œëœ ?ì„± ë°?Supabase DB ?êµ¬ ?€???Œì´?„ë¼??

## 1. ê°œìš” (Overview)
- **?‘ì„±??** 2026-07-24
- **ë²„ì „:** `v0.7.0`
- **ëª©ì :** ë¯¸ë˜ ?°ì´???Œë˜??ëª¨ë“œ?ì„œ ?í•˜??? ì§œ(`plan_date`)ë¥?? íƒ?˜ì—¬ ?¥ì†Œ ì½”ìŠ¤ë¥?êµ¬ì„±?˜ê³ , ?‘ì„±???Œëœ??Supabase PostgreSQL `public.date_plans` ?Œì´ë¸”ì— ?êµ¬ ?€??ë°??¸ì œ? ì? ë¶ˆëŸ¬?????ˆë„ë¡?êµ¬í˜„?©ë‹ˆ??

## 2. ?°ì´?°ë² ?´ìŠ¤ ë§ˆì´ê·¸ë ˆ?´ì…˜ (`!DB`)
- **?Œì´ë¸”ëª…:** `public.date_plans`
- **ë§ˆì´ê·¸ë ˆ?´ì…˜ ?Œì¼:** `supabase/migrations/20260724074000_create_date_plans_table.sql`
- **?¤í‚¤ë§?êµ¬ì¡°:**
  ```sql
  CREATE TABLE IF NOT EXISTS public.date_plans (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
      created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'ë¯¸ë˜ ?°ì´???Œëœ',
      plan_date DATE NOT NULL,
      spots JSONB NOT NULL DEFAULT '[]'::jsonb,
      route_summary JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );
  ```
- **RLS ?•ì±…:** SELECT/INSERT/UPDATE/DELETE ?•ì±… ?œì„±??ë°?`anon`, `authenticated`, `service_role` ê¶Œí•œ ë¶€??

## 3. ?µì‹¬ ì£¼ìš” ê¸°ëŠ¥ ë°??Œí¬?Œë¡œ??
1. **? ì§œ ? íƒ UI (`FuturePlanSheet.tsx`):**
   - HTML5 `<input type="date">` ? ì§œ ? íƒ ì»¨íŠ¸ë¡??°ë™ (`selectedDate`, ê¸°ë³¸ê°? ?¤ëŠ˜ ? ì§œ `YYYY-MM-DD`).
2. **Supabase DB ?êµ¬ ?€??(`useFuturePlanner.ts`):**
   - "DB???€?? ë²„íŠ¼ ?´ë¦­ ??? íƒ??? ì§œ?€ ?€ ?¥ì†Œ ë°°ì—´(`spots`)??`date_plans` ?Œì´ë¸”ì— `upsert/insert`.
   - ?€???„ë£Œ ??? ìŠ¤???Œë¦¼ ?œì‹œ ë°??´ë‹¹ ? ì§œ ?€??ëª©ë¡ ?ë™ ?™ê¸°??
3. **?€?¥ëœ DB ?Œëœ ?í„°ì¹?ë¶ˆëŸ¬?¤ê¸° & ?? œ:**
   - ? íƒ??? ì§œ???€?¥ëœ DB ?Œëœ??ì¡´ì¬??ê²½ìš° ?˜ë‹¨ ì¹??•íƒœ ëª©ë¡?¼ë¡œ ?¸ì¶œ.
   - ì¹??°ì¹˜ ???´ë‹¹ ?Œëœ???€ ì½”ìŠ¤ë¥?ì§€?„ì? ?Œë˜???œë¡œ?´ì— ?í„°ì¹?ë³µì›.

## 4. ê´€???Œì¼
- `supabase/migrations/20260724074000_create_date_plans_table.sql`
- `supabase/schema.sql`
- `src/types/supabase.ts`
- `src/types/planner.ts`
- `src/hooks/useFuturePlanner.ts`
- `src/components/modal/FuturePlanSheet.tsx`
- `src/app/page.tsx`


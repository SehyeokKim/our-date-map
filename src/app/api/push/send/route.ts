import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Configure Web Push VAPID keys (with default fallback keys for development)
const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BGHbCIRogFs5NrzFmmDiTu9knWXyI08c7MTOZrJQ1yb0Gvih6qmWffTlvQPii02S63qCY4PfLTL9mDOfy3xctcg';
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY ||
  'k3mTKFXNZDVkSjsa35zzY60FSs5ROwmIaIsrzwJzEfY';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@ourdatemap.com';

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (e) {
  console.warn('[Push Route] Failed setting VAPID details:', e);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const messageTitle = body.title || 'DateMap😘';
    const messageBody = body.body || '뽁!';
    const targetUrl = body.url || '/';

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const targetUserId = body.targetUserId || body.target_user_id || body.partnerId || null;

    let query = supabase.from('push_subscriptions').select('*');
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    // Fetch active push subscriptions from DB
    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('[Push Route] Error fetching subscriptions:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: true,
          sentCount: 0,
          message: targetUserId
            ? '선택한 상대방의 등록된 푸시 알림 기기가 없습니다.'
            : '등록된 알림 기기가 없습니다.',
        },
        { status: 200 }
      );
    }

    const payload = JSON.stringify({
      title: messageTitle,
      body: messageBody,
      icon: '/icons/push-on.svg',
      badge: '/icons/push-on.svg',
      url: targetUrl,
    });

    const sendResults = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        try {
          return await webpush.sendNotification(pushSubscription, payload);
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expired or invalid, cleanup DB
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          throw err;
        }
      })
    );

    const successfulCount = sendResults.filter((r) => r.status === 'fulfilled').length;

    return NextResponse.json({
      success: true,
      sentCount: successfulCount,
      totalSubscriptions: subscriptions.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Push Route] Error sending push notification:', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

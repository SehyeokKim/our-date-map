// Web Push & Background Notification Service Worker for Our Date Map
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || '💕 우리들의 데이트 지도';
    const options = {
      body: data.body || '상대방이 소중한 데이트 알림을 보냈습니다!',
      icon: data.icon || '/icons/push-on.png',
      badge: data.badge || '/icons/push-on.png',
      data: {
        url: data.url || '/',
      },
      vibrate: [100, 50, 100],
      tag: 'date-map-push',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('💕 우리들의 데이트 지도', {
        body: text,
        vibrate: [100, 50, 100],
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

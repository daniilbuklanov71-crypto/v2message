const CACHE_NAME = 'v2-messenger-shell-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (_) { data = { title: 'V2', body: event.data ? event.data.text() : 'Новое сообщение' }; }

  const title = String(data.title || 'V2 — новое сообщение').slice(0, 80);
  const options = {
    body: String(data.body || 'Вам пришло новое сообщение').slice(0, 180),
    tag: data.tag || ('v2-' + (data.chatId || 'message')),
    renotify: true,
    data: { chatId: data.chatId || null, url: data.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const chatId = event.notification.data && event.notification.data.chatId;
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of list) {
      if ('focus' in client) {
        await client.focus();
        if (chatId) client.postMessage({ type: 'V2_OPEN_CHAT', chatId });
        return;
      }
    }
    const target = chatId ? ('./?v2chat=' + encodeURIComponent(chatId)) : './';
    await self.clients.openWindow(target);
  })());
});

/* V2 messenger — Service Worker (push-уведомления) */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { try { data = { body: event.data.text() }; } catch (e2) {} }

  var title = data.title || 'V2';
  var chatId = data.chatId || '';
  var options = {
    body: data.body || 'Новое сообщение',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: chatId ? 'v2-chat-' + chatId : 'v2-msg',
    renotify: true,
    data: { chatId: chatId }
  };

  event.waitUntil((async function () {
    var wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    var visible = wins.some(function (c) { return c.visibilityState === 'visible'; });
    /* iOS требует показать уведомление на каждый push */
    await self.registration.showNotification(title, options);
    if (visible) {
      /* мессенджер открыт: сообщение покажет баннер внутри приложения, системное убираем */
      await new Promise(function (r) { setTimeout(r, 900); });
      var list = await self.registration.getNotifications({ tag: options.tag });
      list.forEach(function (n) { n.close(); });
    }
  })());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var chatId = (event.notification.data && event.notification.data.chatId) || '';
  event.waitUntil((async function () {
    var wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i];
      if ('focus' in w) {
        await w.focus();
        if (chatId) w.postMessage({ type: 'V2_OPEN_CHAT', chatId: chatId });
        return;
      }
    }
    var url = self.registration.scope + (chatId ? '?v2chat=' + encodeURIComponent(chatId) : '');
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

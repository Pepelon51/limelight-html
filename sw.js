self.addEventListener('install', (event) => {
    console.log('Service Worker instalado.');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activado.');
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (url.pathname === "/contact.html") {
        console.log("Interceptando petición del formulario:", event.request.url);
        // Puedes decidir si manejar esta petición o dejarla pasar
    } else if (url.hostname === "leostop.com") {
        console.log("Interceptando script externo:", event.request.url);
        // Aquí puedes optar por ignorar esta petición o manejarla
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});


self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => caches.delete(cache))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('push', (event) => {
    const data = event.data ? JSON.parse(event.data.text()) : {};

    const title = data.title || 'Notificación';
    const options = {
        body: data.message || 'Tienes un mensaje nuevo',
        icon: 'https://cholos.onrender.com/images/logo.png', // Ruta del ícono
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});


self.addEventListener('notificationclick', (event) => {
    console.log('Notificación clickeada:', event.notification);

    event.notification.close();

    // Abrir o enfocar la página principal
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
            if (clientsArr.length > 0) {
                const client = clientsArr[0];
                return client.focus();
            } else {
                return clients.openWindow('/');
            }
        })
    );
});

// Aquí es donde puedes hacer algo con `self.ready`, si es necesario
self.ready.then(() => {
    console.log('Service Worker listo para manejar notificaciones');
}).catch((error) => {
    console.error('Error al acceder a `self.ready`:', error);
});
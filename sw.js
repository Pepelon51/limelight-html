// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado.');
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activado.');
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(cacheNames.map((cache) => caches.delete(cache)))
        )
    );
    self.clients.claim();
});

// Intercepción de peticiones fetch
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname === "/contact.html") {
        console.log("Interceptando petición del formulario:", event.request.url);
    } else if (url.hostname === "leostop.com") {
        console.log("Interceptando script externo:", event.request.url);
        return; // Ignorar esta petición
    }

    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});

// Manejo del evento push para notificaciones
self.addEventListener('push', (event) => {
    console.log('Push recibido:', event);

    if (event.data) {
        try {
            const data = event.data.json(); // Procesar payload como JSON
            console.log('Datos procesados:', data);

            // Mostrar la notificación con datos dinámicos
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/icon.png', // Asegúrate de que el icono sea accesible
            });
        } catch (error) {
            console.error('Error al procesar el payload:', error);
        }
    } else {
        console.log('El evento push no contiene data.');
        self.registration.showNotification('Notificación', {
            body: 'Tienes un mensaje nuevo!',
            icon: '/icon.png',
        });
    }
});

// Manejo de clics en las notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('Notificación clickeada:', event.notification);

    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
            if (clientsArr.length > 0) {
                return clientsArr[0].focus();
            } else {
                return clients.openWindow('/'); // Cambia "/" por la URL que prefieras
            }
        })
    );
});

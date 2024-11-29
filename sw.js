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

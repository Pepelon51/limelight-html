// Registrar el Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
            console.log('Service Worker registrado con éxito:', registration.scope);
        })
        .catch((error) => {
            console.error('Error al registrar el Service Worker:', error);
        });
}

// IndexedDB: Crear base de datos
const dbName = "FormularioDB";
let db;

const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    const store = db.createObjectStore("datos", { keyPath: "id", autoIncrement: true });
    store.createIndex("nombre", "name", { unique: false });
    store.createIndex("correo", "email", { unique: false });
    store.createIndex("telefono", "number", { unique: false });
    store.createIndex("mensaje", "message", { unique: false });
    console.log("Base de datos creada o actualizada.");
};

request.onsuccess = (event) => {
    db = event.target.result;
    console.log("Base de datos abierta con éxito.");
};

request.onerror = (event) => {
    console.error("Error al abrir la base de datos:", event.target.errorCode);
};

// Manejar el envío del formulario
document.getElementById("datosForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const datos = {
        nombre: document.getElementById("name").value,
        correo: document.getElementById("email").value,
        telefono: document.getElementById("number").value,
        mensaje: document.getElementById("message").value,
    };

    if (navigator.onLine) {
        enviarDatosServidor(datos);
    } else {
        guardarOffline(datos);
    }
});

// Guardar datos en IndexedDB
function guardarOffline(datos) {
    const transaction = db.transaction(["datos"], "readwrite");
    const store = transaction.objectStore("datos");
    const request = store.add(datos);

    request.onsuccess = () => {
        console.log("Datos guardados localmente:", datos);
        alert("Datos guardados sin conexión.");
    };

    request.onerror = (event) => {
        console.error("Error al guardar los datos:", event.target.errorCode);
    };
}

// Enviar datos al servidor
function enviarDatosServidor(datos) {
    fetch("http://localhost:3000/api/insertar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
    })
    .then((response) => {
        if (response.ok) {
            console.log("Datos enviados con éxito:", datos);
            alert("Datos enviados al servidor.");
        } else {
            console.error("Error al enviar datos:", response.status);
        }
    })
    .catch((error) => {
        console.error("Error en la solicitud al servidor:", error);
    });
}

// Sincronizar datos pendientes cuando vuelva la conexión
window.addEventListener("online", () => {
    console.log("Conexión recuperada. Sincronizando datos...");
    sincronizarDatos();
});

function sincronizarDatos() {
    const transaction = db.transaction(["datos"], "readonly");
    const store = transaction.objectStore("datos");
    const request = store.getAll();

    request.onsuccess = (event) => {
        const datosPendientes = event.target.result;

        if (datosPendientes.length > 0) {
            datosPendientes.forEach((dato) => {
                enviarDatosServidor(dato);
            });

            // Eliminar datos enviados
            eliminarDatosPendientes(datosPendientes);
        } else {
            console.log("No hay datos pendientes para sincronizar.");
        }
    };

    request.onerror = (event) => {
        console.error("Error al leer datos pendientes:", event.target.error);
    };
}

function eliminarDatosPendientes(datos) {
    const transaction = db.transaction(["datos"], "readwrite");
    const store = transaction.objectStore("datos");

    datos.forEach((dato) => {
        store.delete(dato.id);
    });

    transaction.oncomplete = () => {
        console.log("Datos enviados eliminados de IndexedDB.");
    };

    transaction.onerror = (event) => {
        console.error("Error al eliminar datos enviados:", event.target.error);
    };
}

// Solicitar permiso al usuario para enviar notificaciones
if ('Notification' in window && navigator.serviceWorker) {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Permiso para notificaciones otorgado.');
        } else {
            console.warn('Permiso para notificaciones denegado.');
        }
    });
}



// Cliente (JavaScript en el navegador)
async function subscribeUser() {
    const swRegistration = await navigator.serviceWorker.register('/sw.js'); // Registra el service worker
    const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true, // Necesario para notificaciones visibles
        applicationServerKey: vapidPublicKey // Clave pública VAPID
    });

    // Enviar la suscripción al servidor
    const userId = 'el_id_del_usuario'; // Obtén el ID del usuario de alguna manera
    await fetch('/api/subscription', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, subscription })
    });
}


// Cliente (JavaScript en el navegador)
async function sendNotificationToUser(userId, message) {
    await fetch('/api/sendNotification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, message })
    });
}



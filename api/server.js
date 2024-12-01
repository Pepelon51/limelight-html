const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const path = require('path'); // Agregar esta línea para importar el módulo 'path'

const Subscription = require('../models/Subscription'); // Asegúrate de que la ruta sea correcta


// Configura Express para servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname, '..'))); // Sube un nivel para servir archivos desde la raíz

// Ruta para servir index.html cuando accedan a la raíz '/'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html')); // Ruta para servir el archivo index.html
});


// Configuración de CORS
app.use(cors({ origin: "*" }));

// Si necesitas restringir los orígenes permitidos:
// app.use(cors({ origin: 'http://127.0.0.1:5500' }));

app.use(express.json());

// Configurar conexión a MongoDB
mongoose.connect("mongodb+srv://PBOO:DELunoAL7conDEmayuscula@cluster0.ijzsw6v.mongodb.net/PBOOpwa", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Definir esquema y modelo
const DatoSchema = new mongoose.Schema({
    nombre: String,
    correo: String,
    telefono: String,
    mensaje: String,
    suscripcion: Object,
});

const Dato = mongoose.model("Dato", DatoSchema);

// Esquema del usuario
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscription: { type: Object, default: null }, // Agregar el campo para la suscripción
});
  
const User = mongoose.model("User", userSchema);



// Ruta para registrar usuario
const bcrypt = require("bcryptjs");

app.post("/api/register", async (req, res) => {
    const { username, password, subscription } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, subscription });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: "Username already exists." });
        } else {
            res.status(500).json({ message: "Server error. Please try again later." });
        }
    }
});


// Ruta para hacer login y verificar las credenciales
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Validar que los campos no estén vacíos
    if (!username || !password) {
        return res.status(400).json({ message: "Por favor, ingresa un nombre de usuario y una contraseña." });
    }

    try {
        // Verificar si el usuario existe
        const user = await User.findOne({ username, password });

        if (!user) {
            return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
        }

        // Devolver el _id si el login es exitoso
        res.json({
            message: "Login exitoso.",
            _id: user._id,
        });

    } catch (error) {
        console.error("Error al procesar el login:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});



// Ruta para insertar datos
app.post("/api/insertar", async (req, res) => {
    try {
        const nuevoDato = new Dato(req.body);
        await nuevoDato.save();
        res.status(201).send("Datos guardados en MongoDB");
    } catch (error) {
        console.error("Error al guardar en MongoDB:", error);
        res.status(500).send("Error al guardar en la base de datos");
    }
});

// Iniciar servidor
app.listen(3000, () => {
    console.log("Servidor corriendo en https://cholos.onrender.com/");
});



// Configura tus claves VAPID
const webPush = require('web-push');

// Configura tus claves VAPID
const vapidKeys = {
    publicKey: 'BEP6PXttmcLs3pwbHV_ow1f7kNFwWpA8Jlbcn6-9hritgXo3soDbWrRtnAvwSDD63zppvpOW7UaX6ZddN0sTXtA',
    privateKey: 'VbHQEOHs1ped7nBufKse9089IFDFOQEQPUeupWXMQEg',
};

// Establecer las claves VAPID en webPush
webPush.setVapidDetails(
    'mailto:pepemejia_51@outlook.com', 
    vapidKeys.publicKey,
    vapidKeys.privateKey
);


//Guardar suscripción del usuario// Endpoint para enviar notificación
app.post('/api/sendNotification', async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ message: "Faltan parámetros" });
    }

    try {
        const subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            return res.status(404).json({ message: "Suscripción no encontrada para el usuario" });
        }

        const payload = JSON.stringify({
            title: 'Notificación personalizada',
            body: message,
            icon: '/icon.png',
            url: 'https://cholos.onrender.com/',
        });

        try {
            await webPush.sendNotification(subscription.subscription, payload);
            res.status(200).json({ message: "Notificación enviada exitosamente" });
        } catch (error) {
            console.error("Error al enviar notificación:", error);

            if (error.statusCode === 410) {
                // Si la suscripción ha expirado, elimínala de la base de datos
                await Subscription.deleteOne({ userId });
                return res.status(410).json({
                    message: "La suscripción ha expirado y ha sido eliminada.",
                });
            }

            res.status(500).json({
                message: "Error al enviar notificación.",
                error: error.message,
            });
        }
    } catch (error) {
        console.error("Error al buscar suscripción:", error);
        res.status(500).json({ message: "Error al buscar la suscripción." });
    }
    const payload = JSON.stringify({
        title: 'Notificación de prueba',
        message: 'Este es un mensaje de prueba',
        icon: '/icon.png',
        badge: '/badge.png',
    });
    
    console.log('Payload enviado:', payload);
    
    webPush.sendNotification(subscription, payload)
        .then(response => {
            console.log('Notificación enviada:', response);
        })
        .catch(error => {
            console.error('Error al enviar la notificación:', error);
        });
    
});

// Ruta para guardar suscripción
app.post('/api/subscription', async (req, res) => {
    console.log("Cuerpo recibido en la solicitud:", req.body);

    const { _id, subscription } = req.body;

    if (!_id || !subscription) {
        console.log("Datos faltantes:", { _id, subscription });
        return res.status(400).json({ message: "Faltan datos requeridos (userId o subscription)." });
    }

    try {
        await Subscription.updateOne(
            { _id },
            { subscription },
            { upsert: true }
        );

        res.status(201).json({ message: "Suscripción guardada exitosamente." });
    } catch (error) {
        console.error("Error al guardar la suscripción:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

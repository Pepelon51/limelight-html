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
    console.log("Cuerpo recibido en login:", req.body);

    // Validar que los campos no estén vacíos
    if (!username || !password) {
        return res.status(400).json({ message: "Por favor, ingresa un nombre de usuario y una contraseña." });
    }

    try {
        // Buscar al usuario en la base de datos
        const user = await User.findOne({ username });

        if (!user) {
            console.log("Usuario no encontrado:", username);
            return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
        }

      /*  // Si las contraseñas están en texto plano (no recomendado)
        if (user.password !== password) {
            console.log("Contraseña incorrecta para el usuario:", username);
            return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
        }
*/
        // Si las contraseñas están encriptadas (mejor práctica)
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log("Contraseña incorrecta para el usuario:", username);
            return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
        }
        

        // Devolver el _id si el login es exitoso
        console.log("Login exitoso para el usuario:", user._id);
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
    try {
        const { userId, message } = req.body;

        // Validar datos de entrada
        if (!userId || !message) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Buscar la suscripción del usuario en la colección Subscription
        const userSubscription = await Subscription.findOne({ userId });

        if (!userSubscription) {
            return res.status(404).json({ message: 'Usuario o suscripción no encontrada' });
        }

        // Configurar el payload de la notificación
        const payload = JSON.stringify({
            title: 'Nueva Notificación',
            body: message, // Aquí se pasa el mensaje personalizado
        });
        console.log('Payload enviado:', payload);


        // Enviar la notificación al cliente
        await webPush.sendNotification(userSubscription.subscription, payload);

        res.status(200).json({ message: 'Notificación enviada correctamente' });
    } catch (error) {
        console.error('Error al enviar la notificación:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }

});

// Ruta para guardar suscripción
app.post('/api/subscription', async (req, res) => {
    const { userId, subscription } = req.body; // Cambiamos _id por userId

    console.log("Cuerpo recibido en /api/subscription:", req.body);

    // Validar datos
    if (!userId || !subscription) {
        console.log("Datos faltantes:", { userId, subscription });
        return res.status(400).json({ message: "Faltan datos requeridos (userId o subscription)." });
    }

    try {
        // Guardar o actualizar la suscripción
        await Subscription.updateOne(
            { userId }, // Usar userId como criterio de búsqueda
            { subscription }, // Actualizar la suscripción
            { upsert: true } // Crear un nuevo documento si no existe
        );

        res.status(201).json({ message: "Suscripción guardada exitosamente." });
    } catch (error) {
        console.error("Error al guardar la suscripción:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});


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
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
  
    try {
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(400).json({ message: "Invalid username or password." });
      }
  
      // Verificar si la contraseña es correcta
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: "Invalid username or password." });
      }
  
      // Aquí es donde incluimos el userId en la respuesta
      res.status(200).json({
        message: "Login exitoso.",
        userId: user._id // Incluimos el ID del usuario logueado
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error. Please try again later." });
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


//Guardar suscripción del usuario
app.post('/api/subscription', async (req, res) => {
    try {
      const { _id, subscription } = req.body;
  
      if (!(_id && subscription && subscription.endpoint && subscription.keys && subscription.keys.p256dh && subscription.keys.auth)) {
        console.log("Parámetros faltantes en la suscripción:", req.body);
        return res.status(400).json({ message: 'Faltan parámetros' });
      }
  
      const userSubscription = new Subscription({
        userId: _id,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
      });
  
      await userSubscription.save();
  
      res.status(200).json({ message: 'Suscripción guardada correctamente' });
    } catch (error) {
      console.error("Error al guardar la suscripción:", error);
      res.status(500).json({ message: 'Error al guardar la suscripción' });
    }
  });
  
//Ruta para enviar notificación al usuario
/*
app.post('/api/sendNotification', async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ message: "Faltan parámetros" });
    }

    try {
        const user = await User.findById(userId);
        if (!user || !user.subscription) {
            return res.status(404).json({ message: "Usuario o suscripción no encontrada" });
        }

        // Preparamos la notificación
        const payload = JSON.stringify({
            title: 'Notificación personalizada',
            message: message,
        });

        // Enviamos la notificación
        await webPush.sendNotification(user.subscription, payload);

        res.status(200).json({ message: "Notificación enviada exitosamente" });
    } catch (error) {
        console.error("Error al enviar la notificación:", error);
        res.status(500).json({ message: "Error al enviar la notificación" });
    }
});

*/
// Endpoint para enviar notificación
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

        // Preparamos la notificación
        const payload = JSON.stringify({
            title: 'Notificación personalizada',
            body: message,
            icon: '/icon.png',
            url: 'https://cholos.onrender.com/'
        });

        await webPush.sendNotification(subscription.subscription, payload);
        res.status(200).json({ message: "Notificación enviada exitosamente" });
    } catch (error) {
        console.error("Error al enviar notificación no rive tu mamada:", error);
        res.status(500).json({ message: "Error al enviar notificaciónasdasd", error: error.message });
    }
});

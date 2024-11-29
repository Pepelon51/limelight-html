// models/Subscription.js
const mongoose = require('mongoose');

// Definir el esquema de la suscripción
const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;

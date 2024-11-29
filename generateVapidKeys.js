const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);


const vapidPublicKey = 'BNKEVz_qtMs4SFMLK1lr1dDgBUx8RRiRbXuPMF_j2zgzJ385qWExYAtjfvsuzg8y3jBAt7q59vjCyjFLvmnqVSk'; // La clave pública VAPID generada
const base64Url = vapidPublicKey.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
console.log('Clave en formato Base64URL:', base64Url);

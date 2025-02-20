const readline = require('readline');
const mqtt = require('mqtt');
const crypto = require('crypto-js');
const https = require('https');
const fs = require('fs');


const broker = 'wss://test.mosquitto.org:8081';
const topic = 'chat/room';
const correctPassword = 'abc';


function downloadJSFile(url, destination) {
  https.get(url, (res) => {
    const fileStream = fs.createWriteStream(destination);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      console.log(`File downloaded: ${destination}`);
      runChatApp();
    });
  });
}


function authenticate() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter password to access the chat: ', (password) => {
    if (password === correctPassword) {
      console.log('Correct password! Welcome to the chat.');
      connectToMQTT();
    } else {
      console.log('Incorrect password. Try again.');
      rl.close();
    }
  });
}


function connectToMQTT() {
  const client = mqtt.connect(broker);

  client.on('connect', () => {
    console.log('Connected to MQTT broker!');
    client.subscribe(topic, (err) => {
      if (err) {
        console.error('Subscription error');
        process.exit(1);
      }
    });
  });

  client.on('message', (topic, message) => {
    const decryptedMessage = decryptMessage(message.toString());
    console.log(`Received: ${decryptedMessage}`);
  });


  readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('line', (input) => {
    const encryptedMessage = encryptMessage(input);
    client.publish(topic, encryptedMessage);
    console.log(`Message sent: ${input}`);
  });
}


function encryptMessage(message) {
  return crypto.AES.encrypt(message, 'secret_key').toString();
}


function decryptMessage(encryptedMessage) {
  const bytes = crypto.AES.decrypt(encryptedMessage, 'secret_key');
  return bytes.toString(crypto.enc.Utf8);
}


function runChatApp() {
  authenticate();
}

// Start the chat
runChatApp();

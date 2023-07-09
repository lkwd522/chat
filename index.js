const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const moment = require('moment');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;
const LOG_FILE = 'chat.log';

// Записывает строку в лог-файл
function logMessage(message) {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  fs.appendFile(LOG_FILE, `[${timestamp}] ${message}\n`, err => {
    if (err) {
      console.error('Ошибка записи в лог-файл:', err);
    }
  });
}

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Подключение к чату
io.on('connection', socket => {
  console.log('Новое подключение:', socket.id);

  // Обработчик установки никнейма
  socket.on('set nickname', nickname => {
    socket.nickname = nickname;
    console.log(`${socket.nickname} присоединился к чату`);

    // Отправка сообщения о входе в чат для всех подключенных клиентов
    io.emit('user joined', `${socket.nickname} присоединился к чату`);

    // Запись в лог-файл
    const logMessageStr = `${socket.handshake.address} - joined the chat - ${socket.nickname}`;
    logMessage(logMessageStr);
  });

  // Обработчик сообщений
  socket.on('chat message', message => {
    console.log(`[${socket.nickname}]: ${message}`);
    io.emit('chat message', `[${socket.nickname}]: ${message}`);

    // Запись в лог-файл
    const logMessageStr = `${socket.handshake.address} - message - [${socket.nickname}]: ${message}`;
    logMessage(logMessageStr);
  });

  // Обработчик отключения
  socket.on('disconnect', () => {
    console.log(`${socket.nickname} покинул чат`);

    // Запись в лог-файл
    setTimeout(() => {
      const logMessageStr = `${socket.handshake.address} - left the chat - ${socket.nickname}`;
      logMessage(logMessageStr);
    }, 60000); // Пауза 1 минута перед записью в лог-файл

    io.emit('user left', `${socket.nickname} покинул чат`);
  });
});

// Маршрут для отображения веб-страницы чата
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


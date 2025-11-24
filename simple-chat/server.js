// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Render가 넣어주는 PORT 환경변수 사용 (없으면 3000)
const PORT = process.env.PORT || 3000; // 
const LOG_FILE = path.join(__dirname, 'chat-log.json');

// 정적 파일 (public 폴더) 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 기존 채팅 기록 로드
function loadMessages() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    if (!content) return [];
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to load messages:', err);
    return [];
  }
}

// 채팅 기록 저장
function saveMessages(messages) {
  fs.writeFile(LOG_FILE, JSON.stringify(messages, null, 2), (err) => {
    if (err) {
      console.error('Failed to save messages:', err);
    }
  });
}

let messages = loadMessages();

io.on('connection', (socket) => {
  console.log('user connected:', socket.id);

  // 접속한 클라이언트에게 기존 채팅 내역 전송
  socket.emit('chatHistory', messages);

  // 새 메시지 수신
  socket.on('chatMessage', (data) => {
    const name = (data.name || '익명').toString().slice(0, 20);
    const text = (data.text || '').toString().slice(0, 500);

    if (!text.trim()) return;

    const msg = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2),
      name,
      text,
      timestamp: new Date().toISOString(),
    };

    messages.push(msg);
    // 필요한 경우 최근 N개만 유지
    // if (messages.length > 1000) messages = messages.slice(-1000);

    saveMessages(messages);

    io.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

// Render 환경에서도 잘 동작하도록 PORT 사용
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

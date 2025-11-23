const CORRECT_PASSWORD = '바나나사와';
const PORT = process.env.PORT || 3000;

const passwordScreen = document.getElementById('password-screen');
const nicknameScreen = document.getElementById('nickname-screen');
const chatScreen = document.getElementById('chat-screen');

const passwordInput = document.getElementById('password-input');
const passwordBtn = document.getElementById('password-btn');
const passwordError = document.getElementById('password-error');

const nicknameInput = document.getElementById('nickname-input');
const nicknameBtn = document.getElementById('nickname-btn');
const nicknameError = document.getElementById('nickname-error');
const currentNicknameLabel = document.getElementById('current-nickname');

const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let nickname = '';
let socket = null;

// HTML 이스케이프 (XSS 방지)
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 시간 표시 포맷
function formatTime(ts) {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 메시지 DOM 추가
function appendMessage(msg, scroll = true) {
  const wrapper = document.createElement('div');
  wrapper.className = 'message';

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = `[${formatTime(msg.timestamp)}] ${msg.name}`;

  const text = document.createElement('div');
  text.className = 'message-text';
  text.innerHTML = escapeHtml(msg.text);

  wrapper.appendChild(meta);
  wrapper.appendChild(text);

  messagesEl.appendChild(wrapper);

  if (scroll) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

// 화면 전환 헬퍼
function showScreen(screen) {
  passwordScreen.classList.add('hidden');
  nicknameScreen.classList.add('hidden');
  chatScreen.classList.add('hidden');

  screen.classList.remove('hidden');
}

// 비밀번호 확인
function handlePasswordSubmit() {
  const value = passwordInput.value.trim();
  if (value === CORRECT_PASSWORD) {
    passwordError.textContent = '';
    showScreen(nicknameScreen);
    nicknameInput.focus();
  } else {
    passwordError.textContent = '비밀번호가 올바르지 않습니다.';
  }
}

// 닉네임 설정
function handleNicknameSubmit() {
  const value = nicknameInput.value.trim();
  if (!value) {
    nicknameError.textContent = '닉네임을 입력하세요.';
    return;
  }
  nickname = value;
  nicknameError.textContent = '';
  currentNicknameLabel.textContent = `내 닉네임: ${nickname}`;
  showScreen(chatScreen);

  // 소켓 연결
  connectSocket();
}

// Socket.IO 연결 및 이벤트 바인딩
function connectSocket() {
  socket = io(); // 같은 호스트/포트에 연결

  socket.on('connect', () => {
    console.log('connected to server');
  });

  // 서버에서 전체 채팅 기록 처음 한 번 내려줌
  socket.on('chatHistory', (history) => {
    messagesEl.innerHTML = '';
    (history || []).forEach((msg) => appendMessage(msg, false));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  // 새 메시지 수신
  socket.on('chatMessage', (msg) => {
    appendMessage(msg, true);
  });
}

// 메시지 전송
function handleMessageSubmit(event) {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !socket) return;

  socket.emit('chatMessage', {
    name: nickname || '익명',
    text,
  });

  messageInput.value = '';
  messageInput.focus();
}

/* 이벤트 등록 */

// 비밀번호 버튼 & Enter
passwordBtn.addEventListener('click', handlePasswordSubmit);
passwordInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    handlePasswordSubmit();
  }
});

// 닉네임 버튼 & Enter
nicknameBtn.addEventListener('click', handleNicknameSubmit);
nicknameInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    handleNicknameSubmit();
  }
});

// 메시지 폼
messageForm.addEventListener('submit', handleMessageSubmit);

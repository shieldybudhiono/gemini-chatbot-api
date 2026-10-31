const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendButton = document.getElementById('send-button');
const quickPrompts = document.querySelectorAll('.prompt-chip');

// Conversation history formatted for the backend and Gemini API:
// [{ role: 'user', text: '...' }, { role: 'model', text: '...' }]
const conversation = [];

// Safely render Markdown with fallback for offline use
function renderMarkdown(text) {
  if (window.marked && window.DOMPurify) {
    return DOMPurify.sanitize(marked.parse(text));
  } else if (window.marked) {
    return marked.parse(text);
  }
  // Lightweight fallback if CDN is unreachable
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

// Append user message bubble to chat box
function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user';

  const bubble = document.createElement('div');
  bubble.className = 'user-bubble';
  bubble.textContent = text;

  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Append bot message with typing indicator, returns reference to message-body container
function appendBotLoading() {
  const row = document.createElement('div');
  row.className = 'message-row bot';

  const avatar = document.createElement('div');
  avatar.className = 'bot-avatar';
  avatar.textContent = 'CM';

  const content = document.createElement('div');
  content.className = 'message-content';

  const sender = document.createElement('div');
  sender.className = 'sender-name';
  sender.textContent = 'CareerMate';

  const body = document.createElement('div');
  body.className = 'message-body';
  body.innerHTML = `
    <div class="typing-indicator" aria-label="Thinking...">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  content.appendChild(sender);
  content.appendChild(body);
  row.appendChild(avatar);
  row.appendChild(content);

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;

  return body;
}

// Form submit handler
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // 1. Render user message in UI & store in conversation history
  appendUserMessage(userMessage);
  userInput.value = '';
  conversation.push({ role: 'user', text: userMessage });

  // 2. Show animated bot loading indicator
  const botBodyElement = appendBotLoading();

  // Disable controls while waiting
  userInput.disabled = true;
  if (sendButton) sendButton.disabled = true;

  try {
    // 3. Send POST request to /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();

    // 4. Render markdown result or fallback message
    if (data && data.result) {
      botBodyElement.innerHTML = renderMarkdown(data.result);
      conversation.push({ role: 'model', text: data.result });
    } else {
      botBodyElement.innerHTML = '<p><em>Maaf, tidak ada tanggapan yang diterima dari server.</em></p>';
      conversation.pop();
    }
  } catch (error) {
    console.error('Chat error:', error);
    botBodyElement.innerHTML = '<p style="color: #ef4444;"><em>Gagal mendapatkan respons dari server. Silakan coba lagi.</em></p>';
    conversation.pop();
  } finally {
    // Re-enable input and focus
    userInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

// Clickable quick prompt chips
quickPrompts.forEach((chip) => {
  chip.addEventListener('click', () => {
    userInput.value = chip.getAttribute('data-prompt');
    chatForm.dispatchEvent(new Event('submit'));
  });
});

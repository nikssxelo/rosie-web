import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@2.7.1/+esm";

const SPACE_ID = "Nikssxelo123/Rosie-Bot-Nikss";
const API_NAME = "/respond";
const MAX_CONTEXT_MESSAGES = 12;

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messageList = document.getElementById("messageList");
const conversation = document.getElementById("conversation");
const typingIndicator = document.getElementById("typingIndicator");
const connectionStatus = document.getElementById("connectionStatus");
const starterPrompts = document.getElementById("starterPrompts");
const newChatButton = document.getElementById("newChatButton");

let clientPromise;
let history = [];
let isSending = false;

function setStatus(message, state = "ready") {
  connectionStatus.textContent = message;
  connectionStatus.dataset.state = state;
}

function getClient() {
  if (!clientPromise) {
    clientPromise = Client.connect(SPACE_ID).catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function createAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "R";
  return avatar;
}

function appendMessage(text, sender) {
  const row = document.createElement("article");
  row.className = `message-row ${sender === "user" ? "user-message" : "assistant-message"}`;

  if (sender !== "user") row.appendChild(createAvatar());

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;
  content.appendChild(bubble);

  const time = document.createElement("time");
  time.className = "message-time";
  time.dateTime = new Date().toISOString();
  time.textContent = formatTime();
  content.appendChild(time);

  row.appendChild(content);
  messageList.appendChild(row);
  scrollToLatest();
  return row;
}

function appendError(text, prompt) {
  const row = appendMessage(text, "assistant");
  const bubble = row.querySelector(".message-bubble");
  bubble.classList.add("error-bubble");

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "retry-button";
  retry.textContent = "Try again";
  retry.addEventListener("click", () => {
    row.remove();
    sendMessage(prompt, { showUserMessage: false });
  });
  row.querySelector(".message-content").appendChild(retry);
  return row;
}

function showTyping(show) {
  typingIndicator.hidden = !show;
  if (show) scrollToLatest();
}

function scrollToLatest() {
  requestAnimationFrame(() => {
    conversation.scrollTop = conversation.scrollHeight;
  });
}

function textFromContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object") {
        if (typeof part.text === "string") return part.text;
        if (typeof part.content === "string") return part.content;
      }
      return "";
    }).join("").trim();
  }
  if (content && typeof content === "object") {
    if (typeof content.text === "string") return content.text;
    if (typeof content.content === "string") return content.content;
  }
  return "";
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .map((item) => ({ role: item.role, content: textFromContent(item.content) }))
    .filter((item) => item.content);
}

function getAssistantReply(result) {
  const returnedHistory = result?.data?.[1];
  const normalized = normalizeHistory(returnedHistory);
  const lastAssistant = [...normalized].reverse().find((item) => item.role === "assistant");
  return { reply: lastAssistant?.content || "", returnedHistory: normalized };
}

function setSending(sending) {
  isSending = sending;
  sendButton.disabled = sending || !messageInput.value.trim();
  chatForm.setAttribute("aria-busy", String(sending));
  if (sending) {
    messageInput.setAttribute("aria-label", "Message Rosie (sending in progress)");
  } else {
    messageInput.setAttribute("aria-label", "Message Rosie");
  }
}

function resizeInput() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 120)}px`;
  sendButton.disabled = isSending || !messageInput.value.trim();
}

async function sendMessage(rawText, { showUserMessage = true } = {}) {
  const text = rawText.trim();
  if (!text || isSending) return;

  if (showUserMessage) appendMessage(text, "user");
  messageInput.value = "";
  resizeInput();
  starterPrompts.hidden = true;
  setSending(true);
  showTyping(true);
  setStatus("Waking Rosie’s model…", "loading");

  try {
    const client = await getClient();
    const result = await client.predict(API_NAME, [text, history.slice(-MAX_CONTEXT_MESSAGES)]);
    const { reply, returnedHistory } = getAssistantReply(result);

    if (!reply) throw new Error("Rosie returned an empty reply.");

    history = returnedHistory.length
      ? returnedHistory.slice(-MAX_CONTEXT_MESSAGES)
      : [
          ...history,
          { role: "user", content: text },
          { role: "assistant", content: reply },
        ].slice(-MAX_CONTEXT_MESSAGES);

    appendMessage(reply, "assistant");
    setStatus("Ready for another chat", "ready");
  } catch (error) {
    console.error("Rosie chat request failed:", error);
    appendError("I couldn’t reach Rosie just now. The model may be waking up—give it a moment and try again.", text);
    setStatus("Couldn’t connect to Rosie", "error");
  } finally {
    showTyping(false);
    setSending(false);
    messageInput.focus();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(messageInput.value);
});

messageInput.addEventListener("input", resizeInput);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

document.querySelectorAll(".prompt-chip").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt || ""));
});

newChatButton.addEventListener("click", () => {
  history = [];
  messageList.querySelectorAll(".message-row:not([data-initial])").forEach((message) => message.remove());
  starterPrompts.hidden = false;
  showTyping(false);
  setStatus("Ready when you are", "ready");
  messageInput.value = "";
  resizeInput();
  messageInput.focus();
});

resizeInput();

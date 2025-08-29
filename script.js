const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");
const emojiPickerBtn = document.querySelector("#emoji-picker");

// ================= API SETUP =================
const API_KEY = "AIzaSyBSHgZspesTzLboHotBvnp3tw7yVBGN2VA"; // ⚠️ Replace with Gemini key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const userData = { message: null, mime_type: null, file: {} };

// ================= MESSAGE HELPERS =================
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// ================= BOT RESPONSE =================
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: userData.message },
          ...(userData.file.data ? [{ inline_data: userData.file }] : [])
        ]
      }]
    })
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API Error");

    const apiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    messageElement.innerText = apiResponseText.trim();
  } catch (error) {
    console.error("Bot response error:", error);
    messageElement.innerText = "⚠️ Failed to fetch response.";
  } finally {
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// ================= USER MESSAGE =================
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message && !userData.file.data) return;

  messageInput.value = "";

  const messageContent = `
    <div class="message-text">${userData.message}</div>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}
  `;

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const messageContent = `
      <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3..."></path>
      </svg>
      <div class="message-text">
        <div class="thinking-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      </div>`;
    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// ================= EVENTS =================
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && userMessage) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});
sendMessageButton.addEventListener("click", handleOutgoingMessage);

// File upload button
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

// Handle file input change
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("active"); // ✅ fixed
    const base64String = e.target.result.split(",")[1];

    userData.file = { data: base64String, mime_type: file.type };
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});

// Handle cancel file
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active"); // ✅ fixed
  fileUploadWrapper.querySelector("img").src = "";
});

// Emoji picker
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  }
});
document.querySelector(".chat-form").appendChild(picker);

emojiPickerBtn.addEventListener("click", () => {
  document.body.classList.toggle("show-emoji-picker");
});

// Chatbot toggle
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

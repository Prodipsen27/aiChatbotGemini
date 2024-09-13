// Selecting necessary elements from the DOM
const typingArea = document.querySelector("#typeForm"); 
const chatList = document.querySelector("#chat1"); 
const sendIcon = document.querySelector("#sendIcon");
const stopIcon = document.querySelector("#stopIcon");
const lightIcon = document.getElementById('lightIcon');
const header = document.querySelector("#header"); 
const newChatIcon = document.querySelector("#newChatIcon");
const delIcon = document.querySelector("#delIcon");
const suggestion = document.querySelectorAll(".suggestion-list .suggestions");

// Initial variables
let userMessage = null;
let ifGenerating = false;
let chatHistory = []; // Store chat history

// API key and URL
const API_KEY = `AIzaSyA94sXJr1pU_vCLWWSFRp2rPHrbViov72Y`;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

// Hide header and recommendations when a message is sent
const hideHeaderAndRecommendations = () => {
    header.classList.add('hidden');
};

// Toggle send button text
const toggleSend = () => {
    sendIcon.innerText = "pause";
};

// Toggle stop button text
const toggleStop = () => {
    sendIcon.innerText = "send";
};

// Load saved chat data from localStorage
const localStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    chatList.innerHTML = savedChats || "";
    header.classList.toggle('hidden', savedChats);
};

// Call localStorageData to initialize chat history
localStorageData();

// Create a new message element
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Function to show typing effect
const showTyping = (text, textElement) => {
    if (!textElement) return;
    const words = text.split(' ');
    let currIndx = 0;
    const typingInterval = setInterval(() => {
        textElement.innerText += (currIndx === 0 ? '' : ' ') + words[currIndx++];
        if (currIndx === words.length) {
            clearInterval(typingInterval);
            ifGenerating = false;
            localStorage.setItem("savedChats", chatList.innerHTML);
            hideHeaderAndRecommendations();
            autoScroll();
        }
        // toggleSend(); // Change button text while typing
    }, 75);

    autoScroll(); // Ensure auto scroll while typing
};

// Function to automatically scroll to the bottom of chat list
const autoScroll = () => {
    chatList.scrollTop = chatList.scrollHeight;
};

// Handle sending outgoing chat messages
const handleOutGoingChat = () => {
    hideHeaderAndRecommendations();
    userMessage = typingArea.querySelector("#inputBox").value.trim() || userMessage;
    if (!userMessage || ifGenerating) return;

    ifGenerating = true;

    chatHistory.push({ role: "user", text: userMessage });
    // addMessageToHistory("user", userMessage);

    const html = `<div class="message-outgoing flex items-center space-x-2 justify-end">
        <div class="message-content bg-blue-500 text-white p-3 rounded-lg max-w-xl">
            <p>${userMessage}</p>
        </div>
        <img src="../assets/images/user.jpeg" alt="User" class="w-10 h-10 rounded-full bg-gray-200" />
    </div>`;
    const outgoingMsgDiv = createMessageElement(html, "outgoing");
    chatList.appendChild(outgoingMsgDiv);

    typingArea.reset();
    typeText(); // Start typing effect for incoming messages

    autoScroll(); // Scroll to the bottom after sending a message
};

// Event listeners for suggestion buttons
suggestion.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".txt").innerText;
        handleOutGoingChat();
        console.log(suggestion.querySelector(".txt").innerText);
    });
});

// Generate response from the API and display it
const generateAPIresponse = async (incomingMsgDiv) => {
    const textElement = incomingMsgDiv.querySelector("#messageText");
    const loadingElement = incomingMsgDiv.querySelector(".loading");
    const copyBtn = incomingMsgDiv.querySelector("[data-message]");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: userMessage }] }]
            }),
        });

        const data = await response.json();
        const apiResponse = data?.candidates[0].content.parts[0].text;

        loadingElement.style.display = 'none';
        showTyping(apiResponse, textElement);
        autoScroll();

        // Set message in copy button's data-message attribute
        copyBtn.setAttribute('data-message', apiResponse);

    } catch (error) {
        console.error(error);
        ifGenerating = false;
        textElement.innerText = "Sorry, something went wrong.";
        loadingElement.style.display = 'none';
    } finally {
        incomingMsgDiv.classList.remove("loading");
    }
};

// Copy message text to clipboard
const copyMessage = (element) => {
    const messageText = element.parentElement.querySelector("#messageText").innerText;

    navigator.clipboard.writeText(messageText).then(() => {
        element.innerText = 'done'; // Change icon to 'done'
        setTimeout(() => {
            element.innerText = 'copy_all'; // Revert icon after 2 seconds
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy message: ", err);
    });
};

// Start typing effect for incoming messages
const typeText = () => {
    const html = `<div class="message-incoming flex flex-col items-start space-x-2 relative">
        <img src="../assets/images/logoAi.jpg" alt="AI" class="w-10 h-10 rounded-full bg-gray-200 flex flex-col mb-4 animate-slideIn bottom-0" />
        <div class="flex-grow p-2 sm:p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" style="background-color: var(--suggestion-bg); color: var(--text-color);">
            <div class="loading w-6 h-6 border-4  border-t-transparent rounded-full animate-spin"></div>
            <p id="messageText" class="mt-2"></p>
        </div> 
        <span onclick="copyMessage(this)" class="material-symbols-outlined cursor-pointer absolute bottom-2 right-2" data-message="">
            copy_all
        </span>
    </div>`;
    const incomingMsgDiv = createMessageElement(html, "incoming");
    chatList.appendChild(incomingMsgDiv);
    setTimeout(() => generateAPIresponse(incomingMsgDiv), 500); // Simulate delay before generating response
};

// Start a new chat
const newChat = () => {
    chatHistory = []; // Clear chat history
    chatList.innerHTML = ''; // Clear current chat history

    const greetingHtml = `<div class="message-incoming flex flex-col items-start space-x-2 relative">
        <img src="../assets/images/logoAi.jpg" alt="AI" class="w-10 h-10 rounded-full bg-gray-200 flex flex-col mb-4 animate-slideIn" />
        <div class="flex-grow p-2 sm:p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" style="background-color: var(--suggestion-bg); color: var(--text-color);">
            <p>Starting a new chat! How can I assist you today?</p>
        </div>
    </div>`;
    header.classList.remove('hidden');

    const greetingMsgDiv = createMessageElement(greetingHtml, "incoming");
    chatList.appendChild(greetingMsgDiv);
    localStorage.setItem("savedChats", chatList.innerHTML);
    localStorageData();
};

// Clear chat history
const clearChat = () => {
    if (confirm("Are you sure you want to delete the chat?")) {
        chatList.innerHTML = ''; 
        localStorage.removeItem("savedChats"); // Clear localStorage
        chatHistory = []; // Clear chat history
        localStorageData(); // Reapply the local storage data
    }
};

// Event listeners for various actions
sendIcon.addEventListener("click", handleOutGoingChat);
typingArea.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutGoingChat();
});
lightIcon.addEventListener("click", (e) => {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'light') {
        document.body.setAttribute('data-theme', 'dark');
        lightIcon.innerText = "light_mode";
    } else {
        document.body.setAttribute('data-theme', 'light');
        lightIcon.innerText = "dark_mode";
    }
});
newChatIcon.addEventListener("click", newChat);
delIcon.addEventListener("click", clearChat);

 
// Function to add a message to the chat history
const addMessageToHistory = (role, text) => {
    const message = {
        role: role,  // either 'user' or 'assistant'
        parts: [{ text: text }]
    };
    chatHistory.push(message); // Add message to the history
    // saveCurrentChat(); // Save the current chat session to localStorage
};

// // Function to save the current chat session to localStorage
// const saveCurrentChat = () => {
//     const chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
//     chatSessions[currentChatId] = chatHistory;
//     localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
// };

// Function to load a specific chat session from localStorage
// const loadChat = (chatId) => {
//     const chatSessions = JSON.parse(localStorage.getItem('chatSessions'));
//     if (chatSessions && chatSessions[chatId]) {
//         chatHistory = chatSessions[chatId];
//         renderChatMessages(); // Update the UI with loaded messages
//     } else {
//         console.error("Chat session not found or in the wrong format:", chatSessions);
//     }
// };

// Function to render chat messages to the UI
// const renderChatMessages = () => {
//     chatList.innerHTML = ''; // Clear the chat UI

//     chatHistory.forEach(message => {
//         // Ensure message.parts is defined and is an array
//         if (Array.isArray(message.parts)) {
//             // Combine all parts into a single string
//             const content = message.parts.map(part => part.text).join(' ');
//             const messageClass = message.role === 'user' ? 'outgoing' : 'incoming';
//             const messageElement = createMessageElement(content, messageClass);
//             chatList.appendChild(messageElement);
//         } else {
//             console.error("Message parts are not in the expected format:", message);
//         }
//     });

//     autoScroll(); // Scroll to the latest message
// };

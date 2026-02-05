# 📝 NoteFlow

A beautiful, Notion-inspired note-taking app with real-time cross-device synchronization.

[![Live Demo](https://img.shields.io/badge/Demo-Live-blue?style=for-the-badge)](https://notion-app-azure.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

![NoteFlow App](https://raw.githubusercontent.com/Narenpindi123/noteflow/main/screenshot.png)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📦 **Block-based Editor** | 12 different block types for rich content |
| 🔄 **Real-time Sync** | Powered by Firebase Firestore |
| 🌙 **Dark Mode** | Beautiful light and dark themes |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |
| ⚡ **Fast** | No build step, pure vanilla JS |
| 🔌 **Offline Support** | Falls back to localStorage |

---

## 🎨 Block Types

- 📝 **Text** — Plain paragraph
- 📌 **Headings** — H1, H2, H3
- • **Bullet List** — Unordered lists
- 1. **Numbered List** — Ordered lists
- ☑️ **To-do** — Checkable tasks
- 📊 **Table** — Editable tables with add/remove rows & columns
- ❝ **Quote** — Block quotes
- 💻 **Code** — Code snippets
- 💡 **Callout** — Highlighted info boxes
- — **Divider** — Visual separators

---

## 🚀 Quick Start

### Option 1: Use the Live Demo
Visit **[notion-app-azure.vercel.app](https://notion-app-azure.vercel.app)**

### Option 2: Run Locally

```bash
# Clone the repo
git clone https://github.com/Narenpindi123/noteflow.git
cd noteflow

# Set up Firebase config
cp firebase-config.example.js firebase-config.js
# Edit firebase-config.js with your Firebase credentials

# Start a local server
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## 🔧 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** (start in test mode)
4. Go to **Project Settings → Your Apps → Add Web App**
5. Copy the config and paste into `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

export default firebaseConfig;
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open command palette |
| `Enter` | Create new block |
| `Backspace` | Delete empty block |
| `Tab` | Navigate table cells |
| `↑` `↓` | Navigate between blocks |

---

## 📁 Project Structure

```
noteflow/
├── index.html                 # Main HTML
├── styles.css                 # All styling
├── app.js                     # Application logic
├── firebase-config.js         # Your config (gitignored)
├── firebase-config.example.js # Template config
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Database:** Firebase Firestore
- **Hosting:** Vercel
- **Fonts:** Inter (Google Fonts)

---

## 📄 License

MIT License — feel free to use this project for any purpose.

---

## 🙏 Acknowledgments

Inspired by [Notion](https://notion.so) — the all-in-one workspace.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Narenpindi123">Naren</a>
</p>

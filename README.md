# NoteFlow - Notion-Inspired Note Taking App

A beautiful, block-based note-taking application with real-time cross-device synchronization.

![NoteFlow Screenshot](https://img.shields.io/badge/NoteFlow-Live-blue)

## ✨ Features

- **Block-based editing** - 12 block types including text, headings, lists, tables, code, quotes, and more
- **Real-time sync** - Powered by Firebase Firestore for instant cross-device sync
- **Dark mode** - Toggle between light and dark themes
- **Drag & drop** - Reorder blocks by dragging
- **Command palette** - Type `/` to quickly insert any block type
- **Tables** - Create and edit tables with add/remove row/column controls
- **Offline support** - Falls back to localStorage when offline

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/noteflow.git
cd noteflow
```

### 2. Set up Firebase

1. Create a new project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Copy `firebase-config.example.js` to `firebase-config.js`
4. Add your Firebase credentials to `firebase-config.js`

### 3. Run locally

Simply open `index.html` in your browser, or use a local server:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080

## 📁 Project Structure

```
noteflow/
├── index.html              # Main HTML file
├── styles.css              # All styling
├── app.js                  # Application logic
├── firebase-config.js      # Your Firebase config (gitignored)
├── firebase-config.example.js  # Template for Firebase config
└── README.md
```

## 🔧 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Go to **Build > Firestore Database** and create a database
4. Go to **Project Settings > General** and scroll to "Your apps"
5. Click the web icon (</>) to add a web app
6. Copy the config object and paste into `firebase-config.js`

## 🎨 Block Types

| Type | Description |
|------|-------------|
| 📝 Text | Plain paragraph text |
| 📌 Heading 1/2/3 | Section headings |
| • Bullet List | Unordered list items |
| 1. Numbered List | Ordered list items |
| ☑️ To-do List | Checkable task items |
| 📊 Table | Editable tables |
| ❝ Quote | Block quotes |
| 💻 Code | Code snippets |
| 💡 Callout | Highlighted info boxes |
| — Divider | Visual separator |

## ⌨️ Keyboard Shortcuts

- `/` - Open command palette
- `Enter` - Create new block
- `Backspace` - Delete empty block
- `Tab` - Navigate table cells

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

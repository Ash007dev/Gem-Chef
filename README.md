# 🍳 Gem-Chef (SmartChef)

**AI-Powered Cooking Assistant** with real-time Gemini Live guidance, smart recipe generation, and step-by-step voice-guided cooking.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- 🔍 **Smart Food Scanner** — Snap ingredients → AI identifies them
- 🍲 **Recipe Generation** — 9 personalized recipes (3 regional + 6 styled)
- 📖 **Detailed Steps** — Beginner-friendly with timing & visual cues
- 🎙️ **Voice-Guided Cooking** — Hands-free step-by-step instructions
- 📷 **Step Verification** — Take photos to verify cooking progress
- 🎥 **Gemini Live Mode** — Real-time AI assistant with camera + mic
- 📚 **Cook Log** — History of cooked recipes

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one free](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/Ash007dev/Gem-Chef.git
cd Gem-Chef
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` and add your API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **IMPORTANT:** Never commit your `.env.local` file. It's already in `.gitignore`.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
Gem-Chef/
├── app/                    # Next.js pages
│   ├── page.tsx           # Home (ingredient scanner)
│   ├── recipes/page.tsx   # Recipe results
│   ├── cook/page.tsx      # Cooking mode + Live Mode
│   ├── cooklog/page.tsx   # Cooking history
│   └── api/               # API routes
│       └── gemini-token/  # Token provider for Live API
├── components/            # React components
│   └── LiveCookingOverlay.tsx  # Gemini Live UI
├── utils/
│   ├── gemini.ts          # Gemini text/vision API
│   └── gemini-live.ts     # Gemini Live API (WebSocket)
├── public/                # Static assets
└── styles/               # CSS
```

---

## 🎥 Gemini Live Mode

The real-time cooking assistant uses:
- **Camera** — Shows AI what you're cooking
- **Microphone** — Voice conversations
- **Speaker** — AI speaks back with tips

### Requirements for Live Mode
- Modern browser with WebRTC support (Chrome, Edge, Firefox)
- Camera and microphone permissions
- Stable internet connection

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🛠️ Troubleshooting

### "GEMINI_API_KEY is not defined"
- Make sure you created `.env.local` with your API key
- Restart the dev server after adding the key

### "Gemini Live disconnects immediately"
- Check browser console for specific error
- Ensure camera/mic permissions are granted
- Try a different browser (Chrome recommended)

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then reinstall

---

## 👥 Team

| Name | Role |
|------|------|
| Ashish | Lead Developer |
| [Add teammates here] | ... |

---

## 📝 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/)
- [Next.js](https://nextjs.org/)
- [Lucide Icons](https://lucide.dev/)

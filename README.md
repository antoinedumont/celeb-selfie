# ✨ Celeb Selfie - AI Celebrity Photo Magic

Create stunning, photorealistic selfies with your favorite celebrities using the power of artificial intelligence!

Built with **React 19**, **TypeScript**, **Tailwind CSS**, and powered by **Google Gemini**.

## 🎨 Features

### Core Features
- **📸 Webcam Capture** - Take selfies directly from your browser
- **🌟 Celebrity Selfies** - Generate photorealistic photos with famous celebrities
- **🎯 AI-Powered Prompts** - Gemini 2.5 Flash generates contextual, celebrity-specific prompts
- **✨ Custom Celebrities** - Enter any celebrity name and let AI generate the perfect selfie scene
- **📱 Mobile-First Design** - Beautiful, responsive UI optimized for mobile devices
- **🎨 PhotoAI-Inspired Aesthetics** - Animated gradients, glass morphism, and modern design
- **💾 Download Results** - Save your AI-generated photos instantly
- **🖼️ Admin Gallery** - View all generated photos (Ctrl+Shift+G)

### Technical Features
- **Freestyle Mode Only** - Simplified UX with AI-generated contextual prompts
- **7-Day Prompt Caching** - Reduce API costs with intelligent caching
- **Progress Tracking** - Real-time generation progress with beautiful animations
- **Error Handling** - Comprehensive error recovery
- **TypeScript** - Full type safety throughout

## 🎭 How It Works

1. **Take Your Selfie** 📸
   - Allow camera access
   - Position yourself in the frame
   - Capture your photo

2. **Choose a Celebrity** ⭐
   - Select from curated celebrities
   - Or enter any custom celebrity name
   - Add context (e.g., "at the Oscars", "playing guitar")

3. **AI Magic** ✨
   - Gemini 2.5 Flash generates a contextual prompt
   - Google Gemini creates photorealistic composition
   - 20-40 seconds processing time

4. **Download & Share** 🎉
   - View your AI-generated selfie
   - Download in high quality
   - Try with different celebrities!

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Google AI Studio API Key** ([Get API key](https://aistudio.google.com/app/apikey))
- Modern browser with webcam support

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd /Users/antoine/claude/celeb-selfie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment is already configured**
   The `.env` file is already set up with:
   - Google AI Studio API key
   - CORS proxy configuration (for geo-blocked regions)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4, Custom CSS animations
- **AI Models**:
  - Google Gemini 2.5 Flash (prompt generation)
  - Google Gemini (image generation)
- **API**: Google AI Studio (direct access or via proxy for geo-blocked regions)
- **Build Tool**: Vite 7
- **Fonts**: Outfit (display), DM Sans (body)

## 🎨 Design Philosophy

Inspired by PhotoAI.com, Celeb Selfie features:

- **Animated Gradients** - Dynamic, eye-catching color transitions
- **Glass Morphism** - Modern, depth-filled UI elements
- **Mobile-First** - Touch-optimized, responsive design
- **Bold Typography** - Distinctive font pairing (Outfit + DM Sans)
- **Smooth Animations** - Delightful micro-interactions
- **Dark Theme** - Easy on the eyes with vibrant accents

### Color Palette

```css
--gradient-1: #f79533 (Orange)
--gradient-2: #f37055 (Coral)
--gradient-3: #ef4e7b (Pink)
--gradient-4: #a166ab (Purple)
--gradient-5: #5073b8 (Blue)
--gradient-6: #1098ad (Cyan)
--gradient-7: #07b39b (Teal)
--gradient-8: #6fba82 (Green)
```

## 📁 Project Structure

```
celeb-selfie/
├── src/
│   ├── components/
│   │   ├── Camera.tsx                  # Mobile-optimized camera capture
│   │   ├── CelebritySelector.tsx       # Celebrity grid + custom modal
│   │   ├── ProcessingIndicator.tsx     # Animated loading state
│   │   ├── CelebrityResult.tsx         # Result display + download
│   │   ├── ErrorBoundary.tsx           # Error handling
│   │   └── admin/
│   │       └── AdminGallery.tsx        # View all generated photos
│   ├── services/
│   │   ├── composite/                  # Google Gemini integration
│   │   └── galleryStorage.service.ts   # Local gallery storage
│   ├── utils/
│   │   ├── image.utils.ts              # Image processing
│   │   ├── promptCache.utils.ts        # 7-day prompt caching
│   │   └── watermark.utils.ts          # Watermark addition
│   ├── constants/
│   │   └── celebrities.ts              # Curated celebrity list
│   ├── types/
│   │   └── index.ts                    # TypeScript definitions
│   ├── App.tsx                         # Main app (freestyle-only)
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Global styles + animations
├── public/
│   └── celebrities/                    # Celebrity images
├── .env                                # API credentials
├── package.json
├── tsconfig.json
├── vite.config.js
└── tailwind.config.js
```

## 🎯 Key Differences from Booth Selfie

### Removed
- ❌ Go1 branding and colors
- ❌ Go1 promotional video
- ❌ Go1/Freestyle mode toggle
- ❌ Conference-specific features
- ❌ Go1 booth background templates

### Added/Changed
- ✨ PhotoAI-inspired design system
- ✨ Mobile-first responsive layout
- ✨ Animated gradient backgrounds
- ✨ Glass morphism UI elements
- ✨ Simplified, streamlined UX
- ✨ Freestyle-only mode (always AI-generated prompts)
- ✨ Bold, distinctive typography

## 📱 Mobile Optimization

- **Portrait-first camera** (9:16 aspect ratio)
- **Touch-friendly buttons** (44px minimum tap targets)
- **2-column celebrity grid** on mobile
- **Bottom sheet modals** for mobile UX
- **Optimized animations** for touch devices
- **Responsive typography** (clamp-based scaling)

## 🔑 Admin Features

- **Gallery Access**: Press `Ctrl+Shift+G` or visit `#/admin`
- **View All Photos**: Browse all generated selfies
- **Metadata**: See prompts, generation mode, timestamps
- **Export**: Download photos individually or as ZIP

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The `dist/` folder will contain the production-ready build.

### Deploy Options

1. **Vercel/Netlify** - Automatic deployment from Git
2. **Static Hosting** - Upload `dist/` folder to any static host
3. **Custom VPS** - Use with Nginx/Apache

### Environment Variables

Make sure to set these in your deployment platform:
- `VITE_GOOGLE_AI_STUDIO_API_KEY` (required)
- `VITE_USE_CORS_PROXY=true` (for geo-blocked regions)
- `VITE_US_CORS_PROXY_URL` (for geo-blocked regions)

## 💰 Cost Estimation

- **Prompt Generation**: ~$0.001-0.005 per celebrity (7-day cache)
- **Image Generation**: $0.13-0.24 per image (depending on resolution)
- **Average Cost**: ~$0.13-0.24 per selfie (prompts cached)
- Processing time: 20-40 seconds

## 🛡️ Privacy & Security

- **No Server**: All processing happens client-side or via API
- **No Data Storage**: Photos stored locally (localStorage only)
- **No Tracking**: No analytics or third-party tracking
- **Secure APIs**: All API keys in environment variables

## 🔮 Future Enhancements

- 📱 Progressive Web App (PWA) support
- 🎭 More celebrity presets
- 🎨 Custom background scenes
- 🤳 Social media sharing
- 📊 Analytics dashboard
- 🌍 Multi-language support
- 📱 Native mobile app (React Native)

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome!

## 📄 License

Private project - All rights reserved

## 🙏 Credits

- **AI Models**: Google Gemini
- **Design Inspiration**: PhotoAI.com
- **Fonts**: Google Fonts (Outfit, DM Sans)
- **Icons**: Heroicons (via inline SVG)

---

Made with ✨ and AI magic

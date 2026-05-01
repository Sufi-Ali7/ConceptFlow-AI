# ConceptFlow AI — Almost All Working SaaS Version

This version adds most real-world SaaS functionality.

## Working Modules
- Professional responsive UI
- Dark/Light mode
- MongoDB Atlas
- JWT Signup/Login
- Forgot password basic flow
- Optional SMTP email sending
- Gemini deploy-ready AI
- OpenAI optional
- Ollama optional local AI
- AI usage limit system
- Free/Premium plans
- Razorpay order + verification
- Premium activation for 1 month
- Payment history API
- AI question history
- Dashboard progress
- Subject library
- Quiz submit + score
- Career roadmap save
- Study tools:
  - Notes generator
  - Expected questions generator
  - Viva Q&A generator
  - Revision plan generator
  - Syllabus PDF/TXT upload
- DSA animations:
  - Bubble Sort
  - Binary Search
  - Stack
  - Queue
  - Linked List
  - Tree Traversal
  - Graph BFS
- Code explain/dry run API
- Rate limiting/security basics

## Required Setup

### Install
```bash
npm install
```

### `.env`
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/conceptflow_ai?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=make_this_long_and_secret

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_PLAN_AMOUNT=19900
RAZORPAY_CURRENCY=INR

FREE_DAILY_AI_LIMIT=10
PREMIUM_DAILY_AI_LIMIT=500

APP_URL=http://localhost:5000
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=ConceptFlow AI <no-reply@conceptflow.ai>
```

### Seed
```bash
npm run seed
```

### Run
```bash
npm run dev
```

Open:
```txt
http://localhost:5000
```

## What still requires external service keys
- Real AI answer requires Gemini/OpenAI key.
- Real payment requires Razorpay test/live keys.
- Forgot password email requires SMTP config.
- Deployment requires env vars on Render.

## What is still not enterprise-level
- Google OAuth not added.
- Real subscription auto-renew not added.
- Advanced course CMS/admin panel not added.
- Professional load testing not done.
- Full video/course content management not added.


## Gemini + Click Fix
- GEMINI_API_KEY and GEMINI_MODEL are now trimmed in backend, so accidental spaces do not break Gemini.
- Programming language cards are now clickable and ask AI about that language.
- Better frontend error messages for Gemini setup issues.

### Clean Gemini env
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_new_key_here
GEMINI_MODEL=gemini-1.5-flash
```

Important: Restart server after editing `.env`.


## Gemini Final Fix
- Replaced `src/routes/ai.routes.js` with corrected Gemini response parser.
- Gemini output now extracts `candidates[0].content.parts[].text`.
- Added `maxOutputTokens: 4096` for longer answers.
- Fallback now shows exact reason if Gemini fails.
- Language card click binding included.


## Full Pro AI Experience
Added:
- English-only pro teacher prompt
- No silent Gemini fallback
- Exact backend error if Gemini fails
- Correct Gemini response parser
- ChatGPT-style pro chat section
- Quick prompts
- New Chat
- AI history
- Copy answer
- Longer answers with maxOutputTokens 4096
- Old AI buttons forward into pro chat

Important:
After adding `.env`, restart server:
CTRL + C
npm run dev


## ChatGPT Level UI Upgrade
- Markdown rendering
- Code block rendering
- Typing animation
- Answer modes: Balanced, Short, Exam, Deep
- Copy and Read buttons
- Cleaner AI prompt
- Output length controlled by mode


# Final Deploy Ready Notes

## Recommended Gemini model
```env
GEMINI_MODEL=gemini-2.5-flash
```

## Admin Login
Local default:
```env
ADMIN_EMAIL=admin@conceptflow.ai
ADMIN_PASSWORD=Admin@12345
```

Open site and go to Admin section.

## Render Deploy
1. Push this folder to GitHub.
2. Render → New Web Service.
3. Build Command:
```bash
npm install
```
4. Start Command:
```bash
npm start
```
5. Add env vars:
```env
NODE_ENV=production
MONGO_URI=your_mongodb_uri
JWT_SECRET=long_random_secret
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=strong_password
FREE_DAILY_AI_LIMIT=100
PREMIUM_DAILY_AI_LIMIT=5000
```

## Health Check
```txt
/health
```

## DSA Visualizer Topics
- Linear Search
- Binary Search
- Bubble Sort
- Selection Sort
- Insertion Sort
- Stack
- Queue
- Linked List
- Tree Traversal
- Graph BFS
- Graph DFS
- Recursion


## Final UI Navbar Fix
- Fixed navbar spacing and alignment.
- Fixed Admin link overlap issue.
- Fixed logo wrapping.
- Added responsive navbar wrapping for tablet/mobile.
- Added safe CSS overrides at bottom of style.css.


## Header Rebuilt Final
The complete top navigation header was rebuilt with:
- Clean topbar HTML
- Separate brand, nav and action groups
- No overlap
- Proper desktop and responsive tablet/mobile layout
- Fixed Admin/search merge issue


## Clean Click Working Version
The old accumulated frontend patches were replaced with one clean `public/script.js`.
Fixed:
- Login / Signup button
- Get Started
- Search
- Theme toggle
- AI solver
- Pro chat
- Subject cards
- Programming language cards
- DSA visualizer
- Admin login/stats


## Chat Compact UI Fix
- Fixed oversized chat bubbles.
- Fixed empty spacing inside user/AI messages.
- Fixed chat window height and input spacing.
- Added responsive chat layout.


## Chat Deep Check
Checked:
- Chat HTML IDs
- Send button
- Enter key send
- Quick prompts
- New chat
- History
- Markdown rendering
- Compact bubbles
- Responsive CSS
- JS syntax

Added final polish:
- auto textarea height
- scrollbar polish
- safe rebinding for chat buttons
- message word wrapping

## Real Product Upgrade
Added:
- Structured course system UI
- Expanded programming languages/tools section
- User dashboard pro widgets
- Study material upload UI
- Certificate preview
- Trust/testimonial style section
- Pricing section
- FAQ/contact/policies
- Product-level click actions using AI chat

Programming languages/tools:
Python, JavaScript, TypeScript, Java, C, C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, Dart, R, SQL, HTML, CSS, React, Node.js, MongoDB, Git/GitHub, Docker, Linux, AI Prompting, Cloud Computing.


# ConceptFlow AI — Steps 1 to 5 Final Combined Build

This ZIP combines the work from STEP 1 to STEP 5.

## STEP 1 — User Auth Foundation
- User signup/login
- JWT auth
- MongoDB user storage
- Password hashing
- Protected user experience

## STEP 2 — AI Mentor / Personalization Base
- ChatGPT-style AI chat
- Gemini/OpenAI/Ollama provider support
- AI answer history
- Structured answer format

## STEP 3 — DSA Visualizer
- Linear Search
- Binary Search
- Bubble Sort
- Selection Sort
- Insertion Sort
- Stack
- Queue
- Linked List
- Tree Traversal
- Graph BFS/DFS
- Recursion demo

## STEP 4 — Quiz + Certificate
- Practice quiz UI
- Score feedback
- Weak-topic AI revision flow
- Certificate preview/print

## STEP 5 — Payment + Premium SaaS
- Razorpay order/verify routes
- Free/Premium plan UI
- AI usage limit system
- Admin panel with users, payments, AI history and materials
- Deploy-ready render.yaml and /health route where available

## Run locally
1. Rename `.env.example` to `.env`
2. Add your real MongoDB URI and Gemini API key
3. Run:

```bash
npm install
npm run seed
npm run dev
```

Open:

```txt
http://localhost:5000
```

## Important
- Gemini works only with a valid API key and supported model, recommended:
  `GEMINI_MODEL=gemini-2.5-flash`
- Razorpay requires real/test keys.
- Admin login comes from `.env`.


# Final Deep Check

This build was checked for:
- package scripts/dependencies
- required frontend/backend files
- JavaScript syntax
- env example
- Render config
- health route
- common route mounts

See `ENV_SETUP_GUIDE.md` for full environment setup.


## A-to-Z Clean Fix
- Removed/hid duplicate Programming Languages section.
- Navbar Languages now goes to the expanded all-languages section.
- Added sticky-navbar scroll offset.
- Improved section spacing.
- Added final JS sanity patch.


## UI Flow + Subject Library Fix
Fixed:
- Correct real logos in Subjects Library.
- More Subjects card click.
- View All Subjects click.
- Feature cards text cut issue.
- Sticky navbar spacing.
- Light/dark readability.
- Better product flow spacing: Subjects → Features → Courses → Languages → Chat/Dashboard.


## Final UI Polish
Fixed:
- Real logos for language cards.
- More Subjects icon no longer uses React logo.
- Trust section cards are clickable.
- Reduced oversized spacing and card size.
- Improved product flow and sticky navbar spacing.


## DSA Animation Engine — Clean Module
Added `public/dsa-visualizer.js` as a separate clean module.

Animations:
- Binary Search
- Bubble Sort
- Selection Sort
- Insertion Sort
- Stack Push/Pop
- Queue Enqueue/Dequeue
- Linked List Traversal

Controls:
- Start
- Pause/Resume
- Reset
- Speed control
- Pseudocode highlight
- Current step explanation
- Explain with AI


## Full Working Stabilization
Added:
- Robust click handlers for cards/buttons/nav
- Local AI fallback if API/key fails
- DSA visualizer remains separate clean module
- Payment setup fallback message
- Study upload UI fallback
- Chat fallback renderer
- Auth modal fallback
- Better compact spacing and chat styling
- Health route
- FULL_WORKING_SETTINGS.md


## Production Ready Foundation Added
This build includes real backend foundation:
- JWT auth
- MongoDB models
- AI history
- usage limits
- weak topics
- progress tracking
- Razorpay order + signature verification
- payment persistence
- premium unlock
- admin APIs
- clean server architecture

Read `PRODUCTION_READY_CHECKLIST.md`.

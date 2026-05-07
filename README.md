# ♻️ Recicla

### **Smart Waste Recognition & Sustainable Disposal — Powered by AI**

Recicla is an AI-powered sustainability platform built to modernize waste management and recycling accessibility in the Philippines. Through real-time computer vision, intelligent material analysis, and location-aware disposal guidance, Recicla helps users identify recyclable waste, estimate its market value in Philippine Pesos (PHP), and discover nearby verified recycling facilities — all within a seamless web experience.

Designed for accessibility, speed, and environmental impact, Recicla bridges artificial intelligence with practical everyday recycling.

---

# ✨ Core Features

- 🤖 **AI-Powered Waste Recognition**  
  Utilizes TensorFlow and Teachable Machine for real-time object detection directly in the browser.

- 💸 **Smart Scrap Valuation**  
  Estimates recyclable material value in Philippine Pesos (PHP) using AI-assisted analysis.

- ⚠️ **Hazard Awareness System**  
  Detects potentially hazardous waste such as damaged batteries or electronic components and provides safety guidance.

- 📍 **Location-Based Disposal Routing**  
  Helps users locate nearby junk shops, recycling centers, and e-waste facilities through interactive mapping.

- ⚡ **Real-Time Client Processing**  
  Runs lightweight machine learning models on-device for fast and responsive scanning experiences.

- 🎨 **Modern Interactive Interface**  
  Smooth animations, responsive layouts, and immersive UI interactions powered by GSAP and Tailwind CSS.

---

# 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend Framework | Next.js, React |
| Styling & UI | Tailwind CSS, Figma |
| Backend & Database | Supabase, Node.js |
| Artificial Intelligence | TensorFlow, Teachable Machine, Groq API, Llama AI |
| Deployment | Vercel |
| Animation & Interaction | GSAP |

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/recicla.git
cd recicla
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

---

## 4️⃣ Start the Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

# 🔄 How Recicla Works

1. Users scan recyclable waste using their device camera.
2. AI models analyze and classify the detected material in real time.
3. Recicla estimates the potential recyclable value in PHP.
4. Hazardous waste triggers safety alerts and handling recommendations.
5. Users receive nearby disposal or recycling locations for proper waste management.

---

# 👨‍💻 Team — Malunggay Pandesal

| Member | Role |
|---|---|
| Bam | AI Engineer |
| Jude | Full-Stack Software Developer |
| Volt | UI / UX Designer |
| Sai | Project Manager |

---

# 🌱 Vision

Recicla aims to encourage smarter recycling habits by making waste identification, valuation, and disposal more accessible through artificial intelligence and modern web technologies.

---

# 📝 License

Developed for the **CodeKada Online Hackathon 2026**.

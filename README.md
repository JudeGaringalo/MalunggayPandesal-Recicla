# 🌿 Recicla

### **Recycle from anywhere, Value anything.**

Recicla is a real-time, AI-driven web application designed to modernize waste management in the Philippines. By combining client-side object detection with cloud-based Vision AI, Recicla empowers users to analyze household waste, estimate its material value in Philippine Pesos (PHP), and locate the nearest verified disposal facility.

---

# ✨ Key Features

- ⚡ **Zero-Latency Detection**  
  Uses TensorFlow.js to run AI models directly in the browser for instant, real-time waste scanning.

- 💰 **Instant Valuation**  
  Provides estimated real-world scrap values in Philippine Pesos (PHP).

- ☣️ **Hazard Detection**  
  Automatically identifies potentially dangerous materials such as bloated batteries and displays safety handling warnings.

- 🗺️ **Geospatial Routing**  
  Integrated mapping with Leaflet to guide users to nearby junk shops and e-waste disposal facilities.

- 🎨 **Premium UX**  
  Smooth scrolling, responsive interactions, and dynamic AR-inspired HUD overlays for a modern experience.

---

# 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| AI / ML | TensorFlow.js, Teachable Machine, Groq Cloud (Llama-4 Vision) |
| Backend | Supabase |
| Maps | Leaflet & React-Leaflet |
| Animations | React Lenis |

---

# ⚙️ Setup & Installation

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

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key
```

---

## 4️⃣ Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to:

```txt
http://localhost:3000
```

---

# 📸 Core Workflow

1. Scan waste material using your device camera.
2. AI identifies the object in real time.
3. Recicla estimates recyclable value in PHP.
4. Hazardous items trigger safety warnings.
5. Users receive directions to the nearest disposal facility.

---

# 👥 The Team - Malunggay Pandesal

| Member | Role |
|---|---|
| Bam | AI Engineer |
| Jude | Full-Stack Software Developer |
| Volt | UI / UX Designer |
| Sai | Project Manager |

---

# 📝 License

Developed for the **CodeKada Online Hackathon 2026**.

---

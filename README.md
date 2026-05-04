# Recicla
This is the official repository for the DevKada Hackathon 2026 project by Team Malunggay Pandesal.

> Waste segregation meets AI-verified circular economy.

**Domain:** Green Tech & Sustainability

## 🌍 The Vision
Most waste segregation efforts fail because they lack immediate financial incentive or clear localized guidance. Recicla is a real-time web application where users point their camera at their trash, e-waste, or recyclables. 

A lightweight, on-device AI instantly categorizes the item, alerts the user of hazardous materials, and calculates its estimated scrap value. It then connects users directly to the circular economy by routing them to the nearest drop-off bin or verified local junk shop (mangangalakal). 

Unlike generic recycling point programs or manual waste booking tools, Recicla takes the strict legal requirement of segregation and masks it behind an engaging, financially motivated tool that actively recovers precious metals from e-waste.

## ✨ Key Features (MVP Scope)
* **Real-Time Client-Side AI:** Detection happens instantly in the browser without server lag, ensuring a smooth, app-like experience without requiring downloads.
* **Dynamic Value Estimator:** A clean floating UI card snaps to the recognized object, displaying its classification and estimated local scrap value (e.g., Copper wire: ₱300/kg).
* **Hazard Alerts & Routing:** Special UI states for toxic items (like swollen batteries or CRT monitors) provide safety warnings and specific routing to e-waste bins instead of general junk shops.

## 🛠️ The "Zero-Cost" Tech Stack
Built for speed and immediate deployment using a web-native, zero-cost architecture:
* **Frontend:** Next.js — Perfect for handling a clean web UI and requesting browser camera access smoothly.
* **Backend & Database:** Supabase — Handles the item catalog logic, scrap value pricing tables, and hazard warnings securely.
* **Web Deployment:** Vercel — For fast, accessible hosting.
* **Action Verification (AI):** Google Teachable Machine exported to TensorFlow.js — Runs entirely on the user's device for zero-cost, zero-latency frame processing.

## 🚀 How It Works (The Core Loop)
1. **The Hook:** Users land on the Recicla web app and click the prominent "Start Scanning" button.
2. **Method Selection:** Users grant camera permissions and toggle between "Live Camera" for real-time AR-style scanning, or "Upload Photo" for analyzing items from their camera roll.
3. **The Scan & Inference:** The frontend feeds video frames or image data into TensorFlow.js. The AI instantly categorizes the dominant item in the frame.
4. **The Results UI:** A dynamic UI card snaps onto the screen displaying the classification, market value, and any necessary hazard alerts.
5. **Localized Action:** Users click "Find Drop-off" to view a map modal or list view displaying hardcoded local drop-off points (e.g., an SM Cyberzone e-waste bin or a local QC junk shop). 

## 👨‍💻 The Team
**Team Malunggay Pandesal**

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

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

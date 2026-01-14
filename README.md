# 📊 DataBrief AI

> **Your Instant AI Business Analyst & Strategic Consultant.** > _Zero-Shot Visualization. Real-Time Market Data. Interactive Simulations._

DataBrief AI is a next-generation Business Intelligence agent that transforms raw data into actionable strategic insights. Unlike standard chat bots, DataBrief acts as a "Senior Consultant," offering deep market analysis, psychological pricing tricks, and interactive "What-If" scenarios using a powerful simulator.

---

## 🚀 Key Features

### 🧠 **"God Mode" Strategic Intelligence**

- **Senior Consultant Persona:** Doesn't just read numbers; it suggests **Growth Hacks**, **Psychological Triggers**, and **Market Anomalies**.
- **Live Internet Search:** Fetches real-time stock prices, competitor news, and market trends using DuckDuckGo (Free).
- **Dynamic Unit Detection:** Automatically detects currencies (₹, $, €), percentages (%), or counts and formats charts accordingly.

### 📊 **Interactive Data Visualization**

- **Zero-Shot Charts:** Automatically selects the best visualization (Bar, Line, Pie) based on your query.
- **⚡ "What-If" Simulator:** A built-in slider to physically adjust chart data (e.g., _"What if sales drop 20%?"_) and see the impact instantly.
- **Responsive Design:** Fully optimized for Mobile and Desktop with a smart sidebar and non-intrusive input area.

### 📑 **Executive Reporting**

- **Automated Briefings:** Compiles your entire session into a structured **PDF Report** with "Key Insights" and "Strategic Moves."
- **Voice Interaction:** Speak your queries and hear the AI summarize the chart results.

---

## 🛠️ Tech Stack

### **Frontend (Client)**

- **Framework:** Next.js 14 (React)
- **Styling:** Tailwind CSS
- **Visualization:** Recharts
- **PDF Generation:** jsPDF & html-to-image
- **Icons:** Lucide React

### **Backend (Server)**

- **Language:** Python
- **AI Inference:** Groq API (LPU Inference Engine)
  - _Smart Mode:_ `llama-3.3-70b-versatile` (Deep Analysis)
  - _Fast Mode:_ `llama-3.1-8b-instant` (Quick Chat)
- **Data Processing:** Pandas
- **Search:** DuckDuckGo Search (`ddgs`)
- **API:** FastAPI / Uvicorn

---

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone [https://github.com/rohit1915-08/databrief-ai.git](https://github.com/rohit1915-08/databrief-ai.git)
cd databrief-ai
```

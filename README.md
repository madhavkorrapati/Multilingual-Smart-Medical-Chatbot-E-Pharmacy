# 🏥 Sanjeevani AI — Multilingual Medical Voice Chatbot & E-Pharmacy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Tharungovindu369/sanjeevani-medical-chatbot)

**Sanjeevani AI** is an intelligent, voice-enabled, multilingual medical chatbot and e-pharmacy platform designed specifically for the diverse linguistic and healthcare landscape of India. It supports all **22 official Indian regional languages + English**, performs clinical symptom triage, provides medication usage schedules, enables ordering and tracking of tablets with online payment, finds nearby doctors for emergencies, and conducts automated 48–72 hour health follow-ups.

---

## 🌟 Key Features

### 1. 💊 Tablet Usage, Dosage & Order of Taking Medications
* **Precise Usage Guidelines**: Clear adult dosage, maximum daily limits, and instructions (e.g., *take with water, do not crush*).
* **Meal Timing Rules**: Ante-cibum (*AC - Before Food / Empty Stomach*) vs. Post-cibum (*PC - After Food*).
* **Sequential Medication Order**: Multi-tablet schedule sequencing (e.g. *Step 1: Antacid 30 mins before breakfast on empty stomach; Step 2: Paracetamol 20 mins post-breakfast; Step 3: Antihistamine at bedtime*).
* **Contraindication & Safety Warnings**: Alerts regarding alcohol, driving drowsiness, and drug interactions.

### 2. 📦 Order Tablets, Track Courier & Pay Online
* **Interactive Cart & Quick Order**: Direct order creation from chatbot advice cards.
* **Mock Payment Gateway**: Instant UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit cards, and Cash on Delivery (COD).
* **Live Order Tracking**: Visual 5-stage timeline (*Placed → Packed → Dispatched → Out for Delivery → Delivered*) with assigned delivery rider and vehicle information.

### 3. 🎙️ Voice-to-Text & All 22 Indian Regional Languages (+ English)
* **Speech-to-Text (Voice Option)**: Built-in voice input via Web Speech API with microphone wave animation.
* **Text-to-Speech (TTS)**: Reads out advice and instructions so elderly or vernacular patients can listen.
* **23 Languages Supported**:
  1. **Hindi** (हिन्दी)
  2. **Bengali** (বাংলা)
  3. **Telugu** (తెలుగు)
  4. **Marathi** (मराठी)
  5. **Tamil** (தமிழ்)
  6. **Gujarati** (ગુજરાતી)
  7. **Urdu** (اردو)
  8. **Kannada** (ಕನ್ನಡ)
  9. **Odia** (ଓଡ଼ିଆ)
  10. **Malayalam** (മലയാളം)
  11. **Punjabi** (ਪੰਜਾਬੀ)
  12. **Assamese** (অসমীয়া)
  13. **Maithili** (मैथिली)
  14. **Santali** (ᱥᱟᱱᱛᱟᱲᱤ)
  15. **Kashmiri** (کٲشُر / कॉशुर)
  16. **Nepali** (नेपाली)
  17. **Konkani** (कोंकणी)
  18. **Sindhi** (سنڌي / सिन्धी)
  19. **Dogri** (डोगरी)
  20. **Manipuri / Meitei** (মৈতৈলোন্)
  21. **Bodo** (बड़ो)
  22. **Sanskrit** (संस्कृतम्)
  23. **English**

### 4. 🩺 Clinical Symptom Triage & Red-Flag Emergency System
* **Mild Symptoms**: Suggests safe Over-The-Counter (OTC) remedies (fever, common cold, tension headache, mild acidity, loose motions).
* **Severe Red-Flag Detection**: Identifies chest pain, breathlessness, hematemesis, high prolonged fever (>103°F / >3 days), stroke signs, unconsciousness, severe abdominal pain.
* **Emergency Lockout**: For severe symptoms, **self-medication is blocked**.
* **Nearby Doctor & Hospital Finder**: Computes geodesic distances (Haversine formula) to locate nearest hospitals, emergency physicians, cardiologists, and clinics with direct one-click phone dial links.

### 5. ⏱️ Disease Tracking & 48–72 Hour Automated Health Follow-up
* Automatically schedules a follow-up episode for every patient who reports symptoms.
* Prompts patients on Day 2–3: *"How is your health today?"*
  * 🟢 **Fully Recovered**: Provides wellness, diet, and recovery tips.
  * 🟡 **Slightly Better**: Encourages completing course, hydration, and observation.
  * 🔴 **Still Severe / Not Improving**: Immediately triggers urgent doctor visit advisory and connects to emergency specialists.

### 6. 🛡️ Centralized Admin CRM & Telemetry Dashboard
* **Customer Master Directory**: Name, mobile number, delivery address, registered date, and order counts.
* **Search & Symptom History Log**: Real-time log of customer searches, triage severity levels, suggested medicines, and doctor referrals.
* **Order Fulfillment Center**: Manage delivery stages (*Placed → Packed → Dispatched → Delivered*) with status update controls.
* **Health Follow-up Tracker**: Monitor patient recovery and trigger check-in alerts.
* **Proactive Bot Suggestions**: Broadcast regional disease alerts (e.g. Dengue, seasonal flu) and medication reminders.

---

## 🚀 Quickstart

### Prerequisites
* Node.js v18+ (tested on Node v24.18.0)
* Modern web browser (Chrome, Edge, Safari, or Firefox)

### Running the Server
```bash
cd medical-chatbot
node server.js
```

### Accessing the Portals
* **Customer Voice Chatbot**: [http://localhost:5000/index.html](http://localhost:5000/index.html)
* **Admin CRM Dashboard**: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)

---

## 🧪 Automated Testing
To run the automated verification suite:
```bash
node test-api.mjs
```

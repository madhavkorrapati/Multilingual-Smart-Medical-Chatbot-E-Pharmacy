# 🏗️ Sanjeevani AI — Technical Architecture & Clinical Specification

## 1. High-Level Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Patient / User Frontends           │
                                  │  • Voice Input (Web Speech API / Whisper)    │
                                  │  • Multilingual (22 Indian Languages + Eng)  │
                                  │  • Cart, Checkout, Order Tracking            │
                                  └──────────────────────┬───────────────────────┘
                                                         │ HTTPS / REST
                                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Express.js Application Gateway                                 │
├───────────────────────┬───────────────────────────┬──────────────────────┬─────────────────────┤
│   Chat & Multilingual │  Clinical Triage & Red    │  Pharmacy Ordering   │ 48-72h Health       │
│   Voice Engine        │  Flag Emergency Detector  │  & Payment Gateway   │ Follow-up Engine    │
└───────────┬───────────┴─────────────┬─────────────┴──────────┬───────────┴──────────┬──────────┘
            │                         │                        │                      │
            ▼                         ▼                        ▼                      ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────────┐ ┌───────────────────┐
│ Language Dictionaries │ │ Medicine Knowledge    │ │ Orders & Payments    │ │ Health Episode &  │
│ (22 Indic + English)  │ │ Base (Dosage & Timing)│ │ Store                │ │ Follow-up CRM     │
└───────────────────────┘ └───────────────────────┘ └──────────────────────┘ └───────────────────┘
                                                         │
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │      Central Admin CRM       │
                                          │  • Customer Master Directory │
                                          │  • Search & Symptom History  │
                                          │  • Order Dispatch & Tracking │
                                          │  • Regional Disease Alerts   │
                                          └──────────────────────────────┘
```

---

## 2. Clinical Triage & Safety Engine

### 2.1 The Red-Flag Protocol
Under medical triage principles (Manchester Triage System & Emergency Severity Index), conditions are split into **Red-Flags (Severe)** and **Green/Yellow (Mild/Self-Limiting)**.

* **Severe Red Flags**:
  * Any cardiac symptom: chest tightness, heaviness, crushing chest pain radiating to left arm/jaw.
  * Respiratory compromise: severe dyspnea, shortness of breath, gasping, stridor.
  * Hemorrhage: hematemesis (vomiting blood), hemoptysis (coughing blood), melena (black tarry stools).
  * Neurological signs: slurred speech, sudden hemiparesis, sudden facial drooping, acute confusion.
  * Fever criteria: sustained temperature > 103°F (39.4°C) or fever persisting > 3 days.
  * Acute severe abdomen: board-like rigidity, severe unremitting pain.
* **Triage Action**:
  1. **Lockout**: Self-medication tablets are strictly blocked.
  2. **Emergency Warning**: Visual red alert displayed in user's selected language.
  3. **Proximity Search**: Backend executes the Haversine formula against verified hospital and specialist coordinates:
     $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  4. **Direct Referral**: Direct `tel:` link provided to emergency room / hospital desk.

---

## 3. Medication Scheduling & Sequencing Protocol

Patients frequently ingest multiple medications incorrectly (e.g. taking antacids after meals or NSAIDs on an empty stomach). The system enforces chronological medication steps:

| Step | Medication Category | Example | Timing Rule | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Proton Pump Inhibitor (PPI) | Pantoprazole (*Pan 40*) | **Empty Stomach** (30–45 mins before breakfast) | Requires active proton pumps upon food arrival to bind and inhibit acid secretion. |
| **Step 2** | Antipyretic / Analgesic (NSAID) | Paracetamol (*Dolo 650*), Ibuprofen | **After Meals** (15–20 mins post meal) | Prevents direct mucosal irritation and gastric erosions. |
| **Step 3** | Rehydration / Electrolytes | WHO ORS (*Electral*) | **Continuous sips throughout the day** | Maintains extracellular volume and prevents electrolyte imbalance. |
| **Step 4** | Antihistamine / Anti-Allergic | Cetirizine (*Cetzine 10mg*) | **Bedtime (Hora Somni - HS)** | Crosses blood-brain barrier causing mild sedation and drowsiness. |

---

## 4. 22 Indian Regional Languages Speech & Translation Strategy

India's 8th Schedule recognizes 22 official languages. In production, this architecture integrates:
1. **ASR (Speech-to-Text)**:
   * Browser layer: Web Speech API with BCP-47 language tags (`hi-IN`, `te-IN`, `ta-IN`, `bn-IN`, `mr-IN`, `gu-IN`, `kn-IN`, `ml-IN`, etc.).
   * Server fallback: Integration with **AI4Bharat Bhashini ASR** or **Indic Whisper**.
2. **Translation & NLU**:
   * **IndicTrans2** / IndicBART for bidirectional vernacular translation into clinical intents.
3. **TTS (Text-to-Speech)**:
   * **Bhashini TTS / Google Indic TTS** providing high-fidelity, natural local dialect responses.

---

## 5. Regulatory & Statutory Compliance in India

* **Drugs and Cosmetics Act, 1940 & Rules, 1945**:
  * **Schedule H / H1 Drugs**: Antibiotics (e.g. Augmentin 625) and prescription-only medications require a registered medical practitioner's (RMP) prescription upload prior to pharmacy dispatch.
  * **OTC Drugs**: Analgesics, antacids, lozenges, and ORS are available for direct purchase.
* **Telemedicine Practice Guidelines (2020)**:
  * Chatbot explicitly presents medical disclaimers on every session.
  * Severe and indeterminate cases are mandatorily directed to registered doctors and emergency hospitals.
* **Digital Personal Data Protection (DPDP) Act, 2023**:
  * Patient phone numbers, addresses, and health episodes are stored with access controls on the Admin CRM.

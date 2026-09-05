const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'data', 'db-store.json');
const MEDICINES_FILE = path.join(__dirname, 'data', 'medicines.json');
const DOCTORS_FILE = path.join(__dirname, 'data', 'doctors.json');
const LANGUAGES_FILE = path.join(__dirname, 'data', 'languages.json');

// Helper to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'sanjeevani_salt_2026').digest('hex');
}

// Secure Admin Credentials (new secure password, never revealed in frontend files)
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "Sanjeevani@Admin#2026$MedCare";
const ADMIN_TOKEN = "sanjeevani_adm_sec_" + crypto.createHash('md5').update(ADMIN_USER + ADMIN_PASS).digest('hex');

// Pre-configured Verified Fleet of Delivery Riders
const FLEET_RIDERS = [
  { id: "RIDER-01", name: "Rajesh Verma", phone: "+91 98765 01234", vehicle: "Hero Splendor (TS-09-EA-4512)", status: "AVAILABLE" },
  { id: "RIDER-02", name: "Mohammed Arif", phone: "+91 98480 54321", vehicle: "Ather 450X EV (TS-07-JK-8821)", status: "AVAILABLE" },
  { id: "RIDER-03", name: "Sunita Devi", phone: "+91 94400 98765", vehicle: "Honda Activa 6G (TS-08-MN-3344)", status: "AVAILABLE" },
  { id: "RIDER-04", name: "Kishore Reddy", phone: "+91 91234 56789", vehicle: "Bajaj Pulsar 150 (TS-10-AB-9921)", status: "AVAILABLE" }
];

// Default Database Schema
const defaultData = {
  users: [
    {
      id: "USER-1001",
      name: "Ramesh Kumar",
      phone: "9876543210",
      email: "ramesh.kumar@example.com",
      passwordHash: hashPassword("password123"),
      medicalHistory: "Mild seasonal asthma, No drug allergies",
      registeredAt: "2026-09-01T10:30:00.000Z",
      searchCount: 0
    }
  ],
  customers: [
    {
      id: "CUST-1001",
      name: "Ramesh Kumar",
      phone: "+91 98765 43210",
      email: "ramesh.kumar@example.com",
      address: "Flat 402, Sai Residency, Madhapur",
      city: "Hyderabad",
      pincode: "500081",
      medicalHistory: "Mild seasonal asthma, No drug allergies",
      emergencyContact: "+91 98765 43211",
      registeredAt: "2026-09-01T10:30:00.000Z",
      lastActiveAt: "2026-09-05T20:15:00.000Z"
    },
    {
      id: "CUST-1002",
      name: "Pooja Sharma",
      phone: "+91 98111 22334",
      email: "pooja.sharma@example.com",
      address: "B-12, Green Park Extension",
      city: "New Delhi",
      pincode: "110016",
      medicalHistory: "Hypertension / High BP",
      emergencyContact: "+91 98111 22335",
      registeredAt: "2026-09-02T14:20:00.000Z",
      lastActiveAt: "2026-09-05T18:40:00.000Z"
    },
    {
      id: "CUST-1003",
      name: "Anand Verma",
      phone: "+91 94440 12345",
      email: "anand.v@example.com",
      address: "Plot 88, Anna Nagar West",
      city: "Chennai",
      pincode: "600040",
      medicalHistory: "Type 2 Diabetes, Acid Peptic Disease",
      emergencyContact: "+91 94440 12346",
      registeredAt: "2026-09-03T09:10:00.000Z",
      lastActiveAt: "2026-09-05T21:05:00.000Z"
    }
  ],
  searchHistory: [
    {
      id: "SRCH-5001",
      customerId: "CUST-1001",
      phone: "+91 98765 43210",
      customerName: "Ramesh Kumar",
      query: "I have mild fever and headache since morning",
      language: "en",
      triageLevel: "MILD",
      detectedSymptoms: ["mild fever", "headache"],
      recommendedMedicines: ["Dolo 650", "Electral ORS Powder"],
      recommendedDoctors: [],
      timestamp: "2026-09-03T11:00:00.000Z"
    }
  ],
  orders: [
    {
      id: "ORD-9201",
      customerId: "CUST-1001",
      customerName: "Ramesh Kumar",
      phone: "+91 98765 43210",
      deliveryAddress: "Flat 402, Sai Residency, Madhapur, Hyderabad - 500081",
      items: [
        {
          medicineId: "tab-001",
          name: "Dolo 650 (Paracetamol 650mg)",
          quantity: 2,
          price: 34.00,
          mealRelation: "After Food (PC)",
          orderSequence: "Step 2: Take 15-20 minutes after taking meals."
        },
        {
          medicineId: "tab-006",
          name: "Electral ORS Powder (21.8g)",
          quantity: 3,
          price: 22.00,
          mealRelation: "Sip throughout day",
          orderSequence: "Base Therapy: Hydrate with 1L water."
        }
      ],
      subtotal: 134.00,
      deliveryFee: 25.00,
      totalAmount: 159.00,
      paymentStatus: "PAID",
      paymentMethod: "UPI (Google Pay)",
      deliveryStatus: "OUT_FOR_DELIVERY",
      deliveryRider: {
        name: "Rajesh Verma",
        phone: "+91 98765 01234",
        vehicle: "Hero Splendor (TS-09-EA-4512)"
      },
      timeline: [
        { status: "PLACED", time: "2026-09-05T18:00:00.000Z", note: "Order placed online via Chatbot" },
        { status: "PACKED", time: "2026-09-05T18:20:00.000Z", note: "Verified by Pharmacist & packed" },
        { status: "DISPATCHED", time: "2026-09-05T18:45:00.000Z", note: "Picked up by delivery partner" },
        { status: "OUT_FOR_DELIVERY", time: "2026-09-05T19:10:00.000Z", note: "Rider Rajesh Verma is on the way" }
      ],
      notificationsSent: [
        { type: "SMS_WHATSAPP", recipient: "+91 98765 43210", time: "2026-09-05T18:00:00.000Z" }
      ],
      createdAt: "2026-09-05T18:00:00.000Z"
    }
  ],
  followups: [
    {
      id: "FOL-8001",
      customerId: "CUST-1001",
      customerName: "Ramesh Kumar",
      phone: "+91 98765 43210",
      language: "en",
      initialSymptoms: "mild fever and headache",
      triageLevel: "MILD",
      diseaseCondition: "Viral Pyrexia & Tension Headache",
      recommendedMedicines: ["Dolo 650", "Electral ORS"],
      createdAt: "2026-09-03T11:00:00.000Z",
      targetFollowupDate: "2026-09-05T11:00:00.000Z",
      status: "PENDING",
      customerResponse: null,
      history: [
        { date: "2026-09-03T11:00:00.000Z", note: "Episode logged. Follow-up scheduled for Day 2." }
      ]
    }
  ],
  suggestions: [
    {
      id: "SUGG-1",
      title: "Monsoon Dengue & Viral Alert",
      message: "Increased fever cases reported in urban sectors. Keep oral hydration high and avoid stagnant water.",
      urgency: "HIGH",
      active: true
    },
    {
      id: "SUGG-2",
      title: "Tablet Schedule Reminder",
      message: "Proton pump inhibitors (like Pan 40) must always be taken on empty stomach 30 mins before breakfast for best efficacy.",
      urgency: "MEDIUM",
      active: true
    }
  ],
  targetedAlerts: []
};

class Database {
  constructor() {
    this.data = defaultData;
    this.medicines = [];
    this.doctors = [];
    this.languages = [];
    this.riders = FLEET_RIDERS;
    this.load();
  }

  load() {
    if (fs.existsSync(MEDICINES_FILE)) {
      try { this.medicines = JSON.parse(fs.readFileSync(MEDICINES_FILE, 'utf8')); } catch (e) { console.error(e); }
    }
    if (fs.existsSync(DOCTORS_FILE)) {
      try { this.doctors = JSON.parse(fs.readFileSync(DOCTORS_FILE, 'utf8')); } catch (e) { console.error(e); }
    }
    if (fs.existsSync(LANGUAGES_FILE)) {
      try {
        const langData = JSON.parse(fs.readFileSync(LANGUAGES_FILE, 'utf8'));
        this.languages = langData.languages || [];
      } catch (e) { console.error(e); }
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const saved = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        this.data = { ...defaultData, ...saved };
        if (!this.data.users) this.data.users = defaultData.users;
        if (!this.data.targetedAlerts) this.data.targetedAlerts = [];
      } catch (e) {
        console.error("Error loading db-store.json:", e);
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save db-store.json:", e);
    }
  }

  cleanPhone(phone) {
    return (phone || '').replace(/\D/g, '').slice(-10);
  }

  // --- USER AUTHENTICATION ---
  registerUser({ name, phone, email, password, medicalHistory }) {
    const cleanPh = this.cleanPhone(phone);
    if (!cleanPh || cleanPh.length < 10) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }
    if (!name || name.trim().length === 0) {
      throw new Error("Full name is required.");
    }
    if (!password || password.length < 4) {
      throw new Error("Password must be at least 4 characters.");
    }

    const existing = this.data.users.find(u => this.cleanPhone(u.phone) === cleanPh);
    if (existing) {
      throw new Error("An account with this mobile number already exists. Please log in.");
    }

    const userId = `USER-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id: userId,
      name: name.trim(),
      phone: cleanPh,
      email: (email || '').trim(),
      passwordHash: hashPassword(password),
      medicalHistory: (medicalHistory || 'None reported').trim(),
      registeredAt: new Date().toISOString(),
      searchCount: 0
    };

    this.data.users.unshift(newUser);

    this.upsertCustomer({
      name: newUser.name,
      phone: `+91 ${cleanPh}`,
      email: newUser.email,
      medicalHistory: newUser.medicalHistory
    });

    this.save();
    const token = `usr_tok_${userId}_${Date.now()}`;
    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        medicalHistory: newUser.medicalHistory
      },
      token
    };
  }

  loginUser({ identifier, password }) {
    const cleanPh = this.cleanPhone(identifier);
    const cleanId = (identifier || '').trim().toLowerCase();
    const passHash = hashPassword(password);

    const user = this.data.users.find(u =>
      (this.cleanPhone(u.phone) === cleanPh && cleanPh.length >= 10) ||
      (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user) {
      throw new Error("User not found with this mobile number or email.");
    }

    if (user.passwordHash !== passHash) {
      throw new Error("Invalid password. Please try again.");
    }

    const token = `usr_tok_${user.id}_${Date.now()}`;
    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        medicalHistory: user.medicalHistory
      },
      token
    };
  }

  // --- ADMIN AUTHENTICATION ---
  verifyAdmin(username, password) {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return { success: true, token: ADMIN_TOKEN };
    }
    return { success: false, message: "Invalid admin username or password." };
  }

  validateAdminToken(token) {
    return token === ADMIN_TOKEN;
  }

  // --- CUSTOMERS ---
  getCustomers() {
    return this.data.customers;
  }

  getCustomerByPhone(phone) {
    const clean = this.cleanPhone(phone);
    return this.data.customers.find(c => this.cleanPhone(c.phone) === clean);
  }

  upsertCustomer(customer) {
    let existing = this.getCustomerByPhone(customer.phone);
    if (existing) {
      Object.assign(existing, customer, { lastActiveAt: new Date().toISOString() });
      if (customer.medicalHistory) existing.medicalHistory = customer.medicalHistory;
      this.save();
      return existing;
    } else {
      const newCust = {
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: customer.name || "Guest",
        phone: customer.phone,
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "Unknown",
        pincode: customer.pincode || "",
        medicalHistory: customer.medicalHistory || "None reported",
        emergencyContact: customer.emergencyContact || "",
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      this.data.customers.unshift(newCust);
      this.save();
      return newCust;
    }
  }

  // --- SEARCH HISTORY ---
  logSearch(entry) {
    const newEntry = {
      id: `SRCH-${Date.now()}`,
      customerId: entry.customerId || "CUST-GUEST",
      customerName: entry.customerName || "Guest",
      phone: entry.phone || "Not provided",
      query: entry.query,
      language: entry.language || "en",
      triageLevel: entry.triageLevel || "MILD",
      detectedSymptoms: entry.detectedSymptoms || [],
      recommendedMedicines: entry.recommendedMedicines || [],
      recommendedDoctors: entry.recommendedDoctors || [],
      medicalHistory: entry.medicalHistory || "",
      timestamp: new Date().toISOString()
    };
    this.data.searchHistory.unshift(newEntry);
    this.save();
    return newEntry;
  }

  getSearchHistory() {
    return this.data.searchHistory;
  }

  // --- ORDERS ---
  getOrders() {
    return this.data.orders;
  }

  getOrderById(orderId) {
    if (!orderId) return null;
    return this.data.orders.find(o => o.id && o.id.toUpperCase() === orderId.toUpperCase());
  }

  getOrdersByPhone(phone) {
    const cleanPhone = this.cleanPhone(phone);
    return this.data.orders.filter(o => this.cleanPhone(o.phone) === cleanPhone);
  }

  createOrder(orderData) {
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomRider = this.riders[Math.floor(Math.random() * this.riders.length)];

    const newOrder = {
      id: orderId,
      customerId: orderData.customerId || "CUST-GUEST",
      customerName: orderData.customerName || "Guest",
      phone: orderData.phone,
      deliveryAddress: orderData.deliveryAddress,
      city: orderData.city || "Unknown",
      pincode: orderData.pincode || "",
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      deliveryFee: orderData.deliveryFee || 25,
      totalAmount: orderData.totalAmount || (orderData.subtotal + 25),
      paymentStatus: orderData.paymentStatus || "PAID",
      paymentMethod: orderData.paymentMethod || "UPI",
      deliveryStatus: "PLACED",
      deliveryRider: {
        name: randomRider.name,
        phone: randomRider.phone,
        vehicle: randomRider.vehicle,
        assignedAt: new Date().toISOString()
      },
      timeline: [
        {
          status: "PLACED",
          time: new Date().toISOString(),
          note: `Order placed online. Payment: ${orderData.paymentMethod || 'UPI'}. Multiple items (${(orderData.items || []).length} items) registered for packaging.`
        }
      ],
      notificationsSent: [
        {
          type: "SMS_WHATSAPP",
          to: orderData.phone,
          status: "SENT",
          message: `Order #${orderId} confirmed! Total: ₹${orderData.totalAmount}. Track live online.`,
          time: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(orderId, nextStatus, note = "") {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.deliveryStatus = nextStatus;
    order.timeline.push({
      status: nextStatus,
      time: new Date().toISOString(),
      note: note || `Order updated to ${nextStatus}`
    });
    this.save();
    return order;
  }

  assignRiderToOrder(orderId, riderData) {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.deliveryRider = {
      name: riderData.name,
      phone: riderData.phone,
      vehicle: riderData.vehicle,
      assignedAt: new Date().toISOString()
    };
    order.timeline.push({
      status: order.deliveryStatus,
      time: new Date().toISOString(),
      note: `Delivery partner assigned: ${riderData.name} (${riderData.vehicle}, Ph: ${riderData.phone})`
    });
    this.save();
    return order;
  }

  recordNotification(orderId, type, recipient) {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    if (!order.notificationsSent) order.notificationsSent = [];
    const notif = {
      type,
      to: recipient,
      status: "SENT",
      time: new Date().toISOString(),
      trackingLink: `https://sanjeevani-medical-chatbot.onrender.com/index.html?track=${orderId}`
    };
    order.notificationsSent.push(notif);
    this.save();
    return notif;
  }

  // --- TARGETED HEALTH ALERTS ---
  sendTargetedAlert({ title, message, urgency, targetCustomerIds }) {
    const alertId = `ALERT-${Date.now()}`;
    const newAlert = {
      id: alertId,
      title,
      message,
      urgency: urgency || "MEDIUM",
      targetCustomerIds: targetCustomerIds || [], // empty array means ALL
      sentAt: new Date().toISOString(),
      active: true
    };
    if (!this.data.targetedAlerts) this.data.targetedAlerts = [];
    this.data.targetedAlerts.unshift(newAlert);
    this.save();
    return newAlert;
  }

  getTargetedAlerts() {
    return this.data.targetedAlerts || [];
  }

  // --- RIDERS FLEET ---
  getRiders() {
    return this.riders;
  }

  // --- FOLLOWUPS ---
  getFollowups() {
    return this.data.followups;
  }

  createFollowup(data) {
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + (data.hoursOffset || 48));

    const newFollowup = {
      id: `FOL-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: data.customerId || "CUST-GUEST",
      customerName: data.customerName || "Guest Patient",
      phone: data.phone || "Not provided",
      language: data.language || "en",
      initialSymptoms: data.initialSymptoms || "Unspecified",
      triageLevel: data.triageLevel || "MILD",
      diseaseCondition: data.diseaseCondition || "Symptomatic Care",
      recommendedMedicines: data.recommendedMedicines || [],
      medicalHistory: data.medicalHistory || "None",
      createdAt: new Date().toISOString(),
      targetFollowupDate: targetDate.toISOString(),
      status: "PENDING",
      customerResponse: null,
      history: [
        { date: new Date().toISOString(), note: "Follow-up scheduled for 48-72 hours health check-in." }
      ]
    };

    this.data.followups.unshift(newFollowup);
    this.save();
    return newFollowup;
  }

  recordFollowupResponse(followupId, responseType, customerNote = "") {
    const fol = this.data.followups.find(f => f.id === followupId);
    if (!fol) return null;

    fol.customerResponse = responseType;
    if (responseType === 'STILL_SEVERE' || responseType === 'WORSE') {
      fol.status = 'ESCALATED_TO_DOCTOR';
      fol.history.push({
        date: new Date().toISOString(),
        note: `Customer reported symptoms STILL SEVERE after 2-3 days: "${customerNote}". Immediate doctor consultation mandatory.`
      });
    } else if (responseType === 'RECOVERED') {
      fol.status = 'COMPLETED';
      fol.history.push({
        date: new Date().toISOString(),
        note: `Customer reported fully recovered. Wellness maintenance tips shared.`
      });
    } else {
      fol.status = 'IN_PROGRESS';
      fol.history.push({
        date: new Date().toISOString(),
        note: `Customer reported moderate improvement. Continuing monitoring.`
      });
    }
    this.save();
    return fol;
  }

  getMedicines() { return this.medicines; }
  getMedicineById(id) { return this.medicines.find(m => m.id === id); }
  getDoctors() { return this.doctors; }
  getLanguages() { return this.languages; }
  getSuggestions() { return this.data.suggestions; }
}

module.exports = new Database();

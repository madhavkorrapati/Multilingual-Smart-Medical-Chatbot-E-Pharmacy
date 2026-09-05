const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const triage = require('./triageEngine');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Explicit page routes to prevent 404s on browser refresh
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// -------------------------------------------------------------
// Admin Auth Middleware
// -------------------------------------------------------------
function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '');
  if (!token || !db.validateAdminToken(token)) {
    return res.status(401).json({ success: false, message: "Unauthorized. Admin login required." });
  }
  next();
}

// -------------------------------------------------------------
// Customer Authentication Routes
// -------------------------------------------------------------
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, phone, email, password, medicalHistory } = req.body;
    const result = db.registerUser({ name, phone, email, password, medicalHistory });
    res.json({
      success: true,
      message: "Account registered successfully!",
      user: result.user,
      token: result.token
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = db.loginUser({ identifier, password });
    res.json({
      success: true,
      message: "Logged in successfully!",
      user: result.user,
      token: result.token
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const result = db.verifyAdmin(username, password);
  if (result.success) {
    res.json({ success: true, token: result.token, message: "Admin authenticated successfully!" });
  } else {
    res.status(401).json({ success: false, message: result.message });
  }
});

// -------------------------------------------------------------
// Language & Config Routes
// -------------------------------------------------------------
app.get('/api/languages', (req, res) => {
  res.json({ success: true, count: db.getLanguages().length, languages: db.getLanguages() });
});

// -------------------------------------------------------------
// Medicine & Tablet Routes
// -------------------------------------------------------------
app.get('/api/medicines', (req, res) => {
  const { query, category } = req.query;
  let list = db.getMedicines();

  if (query) {
    const q = query.toLowerCase();
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.symptoms.some(s => s.toLowerCase().includes(q))
    );
  }

  if (category) {
    list = list.filter(m => m.category.toLowerCase().includes(category.toLowerCase()));
  }

  res.json({ success: true, count: list.length, medicines: list });
});

app.get('/api/medicines/:id', (req, res) => {
  const med = db.getMedicineById(req.params.id);
  if (!med) return res.status(404).json({ success: false, message: "Medicine not found" });
  res.json({ success: true, medicine: med });
});

// -------------------------------------------------------------
// Doctor Directory Routes
// -------------------------------------------------------------
app.get('/api/doctors', (req, res) => {
  const { lat, lng, city } = req.query;
  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;

  const docs = triage.findNearbyDoctors(userLat, userLng, city);
  res.json({ success: true, count: docs.length, doctors: docs });
});

// Multi-turn conversational memory for symptom clarifications
const pendingTriageInquiries = new Map();

// -------------------------------------------------------------
// Main Chatbot & Symptom Checker API (Interactive & Multi-turn)
// -------------------------------------------------------------
app.post('/api/chat', (req, res) => {
  const {
    message,
    language = "en",
    userLocation = {},
    customerName = "Guest",
    phone = "",
    customerId = null,
    medicalHistory = "",
    age = null
  } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ success: false, message: "Message cannot be empty." });
  }

  const msgTrimmed = message.trim();
  const msgLower = msgTrimmed.toLowerCase();

  // Session key for multi-turn inquiry continuity
  const sessionKey = phone || customerId || req.ip || "guest-session";

  // Intent 1: Order Tracking
  const orderIdMatch = msgTrimmed.match(/ORD-\d+/i);
  if (orderIdMatch) {
    const orderId = orderIdMatch[0].toUpperCase();
    const order = db.getOrderById(orderId);
    if (order) {
      return res.json({
        success: true,
        intent: "ORDER_TRACKING",
        message: `Found your order ${order.id}! Current delivery status: ${order.deliveryStatus}. Assigned Rider: ${order.deliveryRider.name} (${order.deliveryRider.vehicle})`,
        order: order
      });
    } else {
      return res.json({
        success: true,
        intent: "ORDER_NOT_FOUND",
        message: `I could not find an order with ID ${orderId}. Please check the number or view your orders by phone.`
      });
    }
  }

  // Intent 2: Tablet Timing / Schedule Inquiry
  if (msgLower.includes("schedule") || msgLower.includes("order of taking") || msgLower.includes("how to take") || msgLower.includes("kram") || msgLower.includes("kab khana")) {
    const allMeds = db.getMedicines();
    const matched = allMeds.filter(m => msgLower.includes(m.name.toLowerCase()) || msgLower.includes(m.genericName.toLowerCase().split(' ')[0]));
    if (matched.length > 0) {
      const schedule = matched.map((m, idx) => ({
        stepNumber: idx + 1,
        medicine: m.name,
        dosage: m.usage.dosage,
        mealRelation: m.usage.mealRelation,
        orderGuideline: m.usage.orderSequence,
        warnings: m.warnings
      }));

      return res.json({
        success: true,
        intent: "MEDICINE_SCHEDULE",
        message: `Here is the proper usage guideline and schedule for the requested medicine(s):`,
        medicines: matched,
        scheduleSteps: schedule
      });
    }
  }

  // Intent 3: Interactive Clinical Triage & Symptom Evaluation
  let effectiveQuery = msgTrimmed;
  if (pendingTriageInquiries.has(sessionKey)) {
    const pending = pendingTriageInquiries.get(sessionKey);
    // If reply is within 15 minutes, retain earlier active symptoms
    if (Date.now() - pending.timestamp < 15 * 60 * 1000) {
      effectiveQuery = `${msgTrimmed}. Active reported symptoms: ${pending.symptoms.join(', ')}`;
    }
  }

  const triageResult = triage.analyzeSymptoms(effectiveQuery, userLocation, language, {
    age,
    medicalHistory
  });

  if (triageResult.needsClarification) {
    pendingTriageInquiries.set(sessionKey, {
      symptoms: triageResult.detectedSymptoms,
      timestamp: Date.now()
    });
  } else {
    pendingTriageInquiries.delete(sessionKey);
  }

  // Upsert customer in CRM if phone provided
  let activeCustomer = null;
  if (phone) {
    activeCustomer = db.upsertCustomer({
      name: customerName,
      phone: phone,
      city: userLocation.city || "Unknown",
      medicalHistory: medicalHistory
    });
  }

  // Log search & symptoms
  const searchLog = db.logSearch({
    customerId: activeCustomer ? activeCustomer.id : (customerId || "CUST-GUEST"),
    customerName: customerName,
    phone: phone || "Guest User",
    query: msgTrimmed,
    language: language,
    triageLevel: triageResult.triageLevel,
    detectedSymptoms: triageResult.detectedSymptoms,
    recommendedMedicines: triageResult.medicines.map(m => m.name),
    recommendedDoctors: triageResult.doctors.map(d => `${d.name} (${d.hospital})`),
    medicalHistory: medicalHistory
  });

  // Create Follow-up Episode if mild or severe
  let followup = null;
  if (triageResult.followupRecommended) {
    followup = db.createFollowup({
      customerId: activeCustomer ? activeCustomer.id : (customerId || "CUST-GUEST"),
      customerName: customerName,
      phone: phone || "Not Provided",
      language: language,
      initialSymptoms: triageResult.detectedSymptoms.join(', '),
      triageLevel: triageResult.triageLevel,
      diseaseCondition: triageResult.triageLevel === 'SEVERE'
        ? 'Severe Condition (Doctor Urgent)'
        : 'Mild Symptomatic Illness',
      recommendedMedicines: triageResult.medicines.map(m => m.name),
      medicalHistory: medicalHistory
    });
  }

  const langConfig = db.getLanguages().find(l => l.code === language) || db.getLanguages()[0];
  let localizedNote = triageResult.isEmergency ? langConfig.severeWarning : langConfig.mildAdvice;

  return res.json({
    success: true,
    intent: "SYMPTOM_TRIAGE",
    triageLevel: triageResult.triageLevel,
    isEmergency: triageResult.isEmergency,
    needsClarification: triageResult.needsClarification,
    clarificationChips: triageResult.clarificationChips || [],
    detectedSymptoms: triageResult.detectedSymptoms,
    message: triageResult.message,
    localizedNote: localizedNote,
    medicines: triageResult.medicines,
    scheduleSteps: triageResult.scheduleSteps,
    doctors: triageResult.doctors,
    followupId: followup ? followup.id : null,
    searchLogId: searchLog.id
  });
});

// -------------------------------------------------------------
// Orders API (Create, Get, Resend Tracking)
// -------------------------------------------------------------
app.post('/api/orders', (req, res) => {
  const {
    customerName,
    phone,
    deliveryAddress,
    city,
    pincode,
    items,
    paymentMethod = "UPI",
    subtotal = 0,
    deliveryFee = 25
  } = req.body;

  if (!customerName || !phone || !deliveryAddress || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Missing required order details." });
  }

  const customer = db.upsertCustomer({
    name: customerName,
    phone: phone,
    address: deliveryAddress,
    city: city || "Unknown",
    pincode: pincode || ""
  });

  const totalAmount = parseFloat(subtotal) + parseFloat(deliveryFee);

  const newOrder = db.createOrder({
    customerId: customer.id,
    customerName,
    phone,
    deliveryAddress,
    city,
    pincode,
    items,
    subtotal: parseFloat(subtotal),
    deliveryFee: parseFloat(deliveryFee),
    totalAmount: totalAmount,
    paymentMethod: paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID"
  });

  res.json({
    success: true,
    message: "Order placed successfully! Tracking link sent to phone & email.",
    order: newOrder
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  res.json({ success: true, order });
});

app.get('/api/orders/user/:phone', (req, res) => {
  const orders = db.getOrdersByPhone(req.params.phone);
  res.json({ success: true, count: orders.length, orders });
});

// Resend order tracking via SMS/WhatsApp or Email
app.post('/api/orders/:id/resend-tracking', (req, res) => {
  const { channel = "SMS_WHATSAPP", recipient } = req.body;
  const order = db.getOrderById(req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });

  const notif = db.recordNotification(order.id, channel, recipient || order.phone);
  res.json({
    success: true,
    message: `Tracking notification successfully dispatched via ${channel} to ${recipient || order.phone}!`,
    notification: notif
  });
});

// -------------------------------------------------------------
// Follow-ups & Health Tracking
// -------------------------------------------------------------
app.get('/api/followups', (req, res) => {
  const { phone } = req.query;
  let list = db.getFollowups();
  if (phone) {
    const cleanPhone = db.cleanPhone(phone);
    list = list.filter(f => db.cleanPhone(f.phone) === cleanPhone);
  }
  res.json({ success: true, count: list.length, followups: list });
});

app.post('/api/followups/:id/respond', (req, res) => {
  const { responseType, note } = req.body;
  const fol = db.recordFollowupResponse(req.params.id, responseType, note);

  if (!fol) {
    return res.status(404).json({ success: false, message: "Follow-up record not found." });
  }

  let botReply = "";
  let doctors = [];

  if (responseType === 'STILL_SEVERE' || responseType === 'WORSE') {
    doctors = triage.findNearbyDoctors(null, null, "");
    botReply = "⚠️ URGENT ADVISORY: Because your symptoms have persisted or remain severe after 48-72 hours, self-care is no longer safe. You must visit a doctor or emergency clinic immediately. Here are nearby doctors available right now:";
  } else if (responseType === 'RECOVERED') {
    botReply = "🎉 Wonderful news! We are delighted to hear you have recovered. Please remember to stay hydrated, eat balanced meals, and get adequate rest. Let us know anytime if you need health assistance.";
  } else {
    botReply = "Thank you for the update. Since you are still recovering, please complete your prescribed dosage, drink plenty of fluids, and monitor your symptoms. If they do not completely subside in the next 24 hours, please consult a physician.";
  }

  res.json({
    success: true,
    followup: fol,
    botReply: botReply,
    doctors: doctors
  });
});

app.post('/api/followups/simulate-trigger', (req, res) => {
  const { followupId } = req.body;
  const followups = db.getFollowups();
  const target = followupId ? followups.find(f => f.id === followupId) : followups[0];

  if (!target) {
    return res.status(404).json({ success: false, message: "No active follow-up episode found." });
  }

  res.json({
    success: true,
    message: "48h Follow-up check-in prompt triggered!",
    followup: target,
    prompt: {
      title: "🩺 Health Follow-Up Check-in (Day 2)",
      greeting: `Namaste ${target.customerName}! It has been 2 days since you reported: "${target.initialSymptoms}".`,
      question: "How is your health feeling today?",
      options: [
        { label: "🟢 Fully Recovered / Feeling Better", value: "RECOVERED" },
        { label: "🟡 Slightly Better / Still Recovering", value: "SLIGHTLY_BETTER" },
        { label: "🔴 Still Severe / Not Improving", value: "STILL_SEVERE" }
      ]
    }
  });
});

// -------------------------------------------------------------
// Admin Protected CRM Routes (All Orders, Riders, Alerts)
// -------------------------------------------------------------
// 1. Get ALL Orders (Fixes issue #1: placed orders now immediately visible!)
app.get('/api/admin/orders', requireAdminAuth, (req, res) => {
  const orders = db.getOrders();
  res.json({ success: true, count: orders.length, orders });
});

// 2. Get Fleet Riders (Fixes issue #7: assign riders in CRM)
app.get('/api/admin/riders', requireAdminAuth, (req, res) => {
  res.json({ success: true, count: db.getRiders().length, riders: db.getRiders() });
});

// 3. Assign Rider to Order
app.put('/api/admin/orders/:id/assign-rider', requireAdminAuth, (req, res) => {
  let { riderId, riderName, riderPhone, vehicle } = req.body;

  if (riderId) {
    const fleet = db.getRiders();
    const cleanId = String(riderId).toLowerCase().replace(/[-_0]+/g, '');
    const found = fleet.find(r => {
      const cleanF = r.id.toLowerCase().replace(/[-_0]+/g, '');
      return cleanF === cleanId || r.id.toLowerCase() === String(riderId).toLowerCase();
    });
    if (found) {
      riderName = riderName || found.name;
      riderPhone = riderPhone || found.phone;
      vehicle = vehicle || found.vehicle;
    }
  }

  if (!riderName) return res.status(400).json({ success: false, message: "Rider name is required." });

  const updated = db.assignRiderToOrder(req.params.id.toUpperCase(), {
    name: riderName,
    phone: riderPhone || "+91 98765 01234",
    vehicle: vehicle || "Express Delivery Vehicle"
  });

  if (!updated) return res.status(404).json({ success: false, message: "Order not found." });
  res.json({ success: true, message: `Rider ${riderName} successfully assigned to ${req.params.id}!`, order: updated });
});

// 4. Update Order Status
app.put('/api/admin/orders/:id/status', requireAdminAuth, (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ["PLACED", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = db.updateOrderStatus(req.params.id, status, note);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }

  res.json({ success: true, message: `Order updated to ${status}`, order: updated });
});

// 5. Send Targeted Alert to Selected Customers (Fixes issue #2)
app.post('/api/admin/send-alert', requireAdminAuth, (req, res) => {
  const { title, message, urgency, targetCustomerIds } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and message are required." });
  }

  const alertRecord = db.sendTargetedAlert({ title, message, urgency, targetCustomerIds });
  res.json({
    success: true,
    message: targetCustomerIds && targetCustomerIds.length > 0
      ? `Targeted health alert sent to ${targetCustomerIds.length} selected patient(s)!`
      : "Health alert broadcasted to all patients!",
    alert: alertRecord
  });
});

app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  const customers = db.getCustomers();
  const orders = db.getOrders();
  const searches = db.getSearchHistory();
  const followups = db.getFollowups();

  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const severeAlerts = searches.filter(s => s.triageLevel === 'SEVERE').length;
  const activeFollowups = followups.filter(f => f.status === 'PENDING' || f.status === 'ESCALATED_TO_DOCTOR').length;

  res.json({
    success: true,
    stats: {
      totalCustomers: customers.length,
      totalOrders: orders.length,
      totalRevenue: totalRevenue.toFixed(2),
      severeAlerts: severeAlerts,
      activeFollowups: activeFollowups,
      totalSearches: searches.length
    }
  });
});

app.get('/api/admin/customers', requireAdminAuth, (req, res) => {
  const customers = db.getCustomers();
  const orders = db.getOrders();
  const searches = db.getSearchHistory();

  const enhanced = customers.map(c => {
    const custOrders = orders.filter(o => o.customerId === c.id);
    const custSearches = searches.filter(s => s.customerId === c.id);
    return {
      ...c,
      totalOrders: custOrders.length,
      totalSearches: custSearches.length,
      lastSearch: custSearches[0] ? custSearches[0].query : "None"
    };
  });

  res.json({ success: true, count: enhanced.length, customers: enhanced });
});

app.get('/api/admin/symptom-history', requireAdminAuth, (req, res) => {
  res.json({ success: true, count: db.getSearchHistory().length, history: db.getSearchHistory() });
});

app.get('/api/admin/suggestions', requireAdminAuth, (req, res) => {
  const alerts = db.getTargetedAlerts();
  const suggestions = db.getSuggestions();
  res.json({ success: true, suggestions, targetedAlerts: alerts });
});

// Fallback route for all frontend page refreshes
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.status(404).json({ success: false, message: "Endpoint not found." });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 MedCare / Sanjeevani AI Medical Chatbot Server`);
  console.log(`🚀 Live on: http://localhost:${PORT}`);
  console.log(`📱 Customer Voice Portal: http://localhost:${PORT}/index.html`);
  console.log(`🛡️ Admin CRM Dashboard:   http://localhost:${PORT}/admin.html`);
  console.log(`=======================================================`);
});

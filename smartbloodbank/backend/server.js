const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const donorRoutes = require("./routes/donorRoutes");
const requestRoutes = require("./routes/requestRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/smartbloodbank")
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await createAdminAccount();
  })
  .catch(err => console.log("❌ MongoDB Error:", err));

// Create hardcoded admin account
async function createAdminAccount() {
  const User = require("./models/User");
  const bcrypt = require("bcryptjs");
  const existing = await User.findOne({ username: "admin" });
  if (!existing) {
    const hashed = await bcrypt.hash("123456789", 10);
    await User.create({
      username: "admin",
      password: hashed,
      fullName: "Administrator",
      role: "admin",
      phone: "0000000000",
      city: "HQ",
      bloodGroup: "O+",
      dob: new Date("1990-01-01"),
      weight: 70,
      isAdmin: true
    });
    console.log("✅ Admin account created");
  }
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

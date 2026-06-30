const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const JWT_SECRET = "smartbloodbank_secret_2024";

// REGISTER — public users only, no admin creation
router.post("/register", async (req, res) => {
  try {
    const { username, password, fullName, dob, bloodGroup, phone, city, weight } = req.body;

    if (!username || !password || !fullName || !dob || !bloodGroup || !phone || !city) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already exists" });

    // Block anyone trying to register as admin
    if (username.toLowerCase() === "admin") {
      return res.status(400).json({ message: "This username is not allowed" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username, password: hashed, fullName,
      dob: new Date(dob), bloodGroup, phone, city,
      weight: weight || 0, role: "user"
    });

    await user.save();
    res.json({ message: "Registration successful! Please login." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Check birthday
    const today = new Date();
    const dob = new Date(user.dob);
    const isBirthday = today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
    const age = user.age;
    const justTurned18 = isBirthday && age === 18;

    res.json({
      token,
      role: user.role,
      isAdmin: user.isAdmin,
      userId: user._id,
      fullName: user.fullName,
      age,
      isBirthday,
      justTurned18,
      bloodGroup: user.bloodGroup,
      canDonate: user.canDonate,
      daysUntilNextDonation: user.daysUntilNextDonation
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { fullName, city, weight, isAvailable } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, city, weight, isAvailable },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users (admin only)
router.get("/users", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    const users = await User.find({ isAdmin: false }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user (admin only)
router.delete("/users/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const BloodRequest = require("../models/BloodRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// CREATE blood request
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { bloodGroup, reason, city, urgency, message, isEmergency } = req.body;

    const request = new BloodRequest({
      receiver: user._id,
      receiverName: user.fullName,
      receiverPhone: user.phone,
      bloodGroup, reason, city, urgency,
      message, isEmergency: isEmergency || urgency === "emergency"
    });
    await request.save();

    // Notify all matching donors
    const donors = await User.find({ bloodGroup, isAdmin: false, role: "user" });
    const eligibleDonors = donors.filter(d => d.age >= 18 && d.canDonate && d.isAvailable);

    for (const donor of eligibleDonors) {
      await Notification.create({
        user: donor._id,
        title: `🩸 ${bloodGroup} Blood Needed!`,
        message: `Someone in ${city} urgently needs ${bloodGroup} blood. Click to respond!`,
        type: isEmergency ? "emergency" : "warning"
      });
    }

    // Notify admin
    const admin = await User.findOne({ isAdmin: true });
    if (admin) {
      await Notification.create({
        user: admin._id,
        title: `🚨 New Blood Request`,
        message: `${user.fullName} needs ${bloodGroup} blood in ${city}. ${isEmergency ? "EMERGENCY!" : ""}`,
        type: isEmergency ? "emergency" : "info"
      });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET my requests (receiver)
router.get("/my", auth, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ receiver: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET requests matching donor blood group
router.get("/matching", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const requests = await BloodRequest.find({
      bloodGroup: user.bloodGroup,
      status: "pending"
    }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all requests (admin)
router.get("/all", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    const requests = await BloodRequest.find().sort({ createdAt: -1 });

    // Attach matching donors for each request
    const enriched = await Promise.all(requests.map(async (r) => {
      const donors = await User.find({ bloodGroup: r.bloodGroup, isAdmin: false, role: "user" }).select("fullName phone city isAvailable lastDonationDate dob");
      const eligibleDonors = donors.filter(d => d.age >= 18);
      return { ...r.toJSON(), allMatchingDonors: eligibleDonors };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SHOW INTEREST (donor)
router.post("/:id/interest", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    // Check already interested
    const alreadyInterested = request.interestedDonors.find(d => d.donor.toString() === user._id.toString());
    if (alreadyInterested) return res.status(400).json({ message: "Already marked interested" });

    request.interestedDonors.push({
      donor: user._id,
      donorName: user.fullName,
      donorPhone: user.phone,
      donorCity: user.city
    });
    await request.save();

    // Notify admin
    const admin = await User.findOne({ isAdmin: true });
    if (admin) {
      await Notification.create({
        user: admin._id,
        title: "✅ Donor Interested!",
        message: `${user.fullName} is interested to donate ${user.bloodGroup} blood for request in ${request.city}`,
        type: "success"
      });
    }

    res.json({ message: "Interest registered!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// APPROVE / REJECT request (admin)
router.put("/:id/status", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    const { status } = req.body;
    const request = await BloodRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // Notify receiver
    await Notification.create({
      user: request.receiver,
      title: status === "approved" ? "✅ Request Approved!" : "❌ Request Rejected",
      message: status === "approved"
        ? "Your blood request has been approved. Admin will contact you shortly."
        : "Your blood request was rejected. Please try again or contact admin.",
      type: status === "approved" ? "success" : "warning"
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

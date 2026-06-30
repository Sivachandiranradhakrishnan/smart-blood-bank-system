const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Donation = require("../models/Donation");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// GET all donors (available, 18+)
router.get("/", async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;
    const query = { isAdmin: false, role: "user" };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.city = new RegExp(city, "i");

    const users = await User.find(query).select("-password");
    const donors = users.filter(u => u.age >= 18);
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET blood stock
router.get("/stock", async (req, res) => {
  try {
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const users = await User.find({ isAdmin: false, role: "user" });
    const eligibleDonors = users.filter(u => u.age >= 18);

    const stock = bloodGroups.map(bg => {
      const total = eligibleDonors.filter(u => u.bloodGroup === bg).length;
      const available = eligibleDonors.filter(u => u.bloodGroup === bg && u.canDonate && u.isAvailable).length;
      return { bloodGroup: bg, total, available };
    });

    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DONATE blood
router.post("/donate", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.age < 18) return res.status(400).json({ message: "Must be 18+ to donate" });
    if (!user.canDonate) return res.status(400).json({ message: `You must wait ${user.daysUntilNextDonation} more days` });

    // Generate certificate ID
    const certId = "BB" + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

    const donation = new Donation({
      donor: user._id,
      donorName: user.fullName,
      bloodGroup: user.bloodGroup,
      city: user.city,
      certificateId: certId
    });
    await donation.save();

    // Update user
    user.lastDonationDate = new Date();
    user.donationCount += 1;
    user.rewardPoints += 100;

    // Update streak
    const prevDonation = await Donation.findOne({ donor: user._id }).sort({ donationDate: -1 }).skip(1);
    if (prevDonation) {
      const daysBetween = Math.floor((new Date() - prevDonation.donationDate) / (1000 * 60 * 60 * 24));
      if (daysBetween <= 75) {
        user.donationStreak += 1;
        user.rewardPoints += 50; // streak bonus
      } else {
        user.donationStreak = 1;
      }
    } else {
      user.donationStreak = 1;
    }

    // Badges
    const badges = user.badges || [];
    if (user.donationCount >= 1 && !badges.includes("First Drop")) badges.push("First Drop");
    if (user.donationCount >= 5 && !badges.includes("Life Saver")) badges.push("Life Saver");
    if (user.donationCount >= 10 && !badges.includes("Hero Donor")) badges.push("Hero Donor");
    if (user.donationCount >= 20 && !badges.includes("Legend")) badges.push("Legend");
    user.badges = badges;

    await user.save();

    // Notify all users with matching blood requests
    const BloodRequest = require("../models/BloodRequest");
    const pendingRequests = await BloodRequest.find({ bloodGroup: user.bloodGroup, status: "pending" });
    for (const req of pendingRequests) {
      await Notification.create({
        user: user._id,
        title: "Blood Needed!",
        message: `Someone in ${req.city} needs ${user.bloodGroup} blood urgently!`,
        type: "emergency"
      });
    }

    res.json({ donation, user, certificateId: certId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET donation history
router.get("/history", auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id }).sort({ donationDate: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all donations (admin)
router.get("/all-history", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    const donations = await Donation.find().sort({ donationDate: -1 }).populate("donor", "fullName bloodGroup city");
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TOGGLE availability
router.put("/availability", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ isAvailable: user.isAvailable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET donor of the month
router.get("/donor-of-month", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const donations = await Donation.aggregate([
      { $match: { donationDate: { $gte: startOfMonth } } },
      { $group: { _id: "$donor", count: { $sum: 1 }, donorName: { $first: "$donorName" }, bloodGroup: { $first: "$bloodGroup" } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json(donations[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN edit user
router.put("/admin/user/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

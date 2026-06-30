const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const auth = require("../middleware/auth");

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE event (admin)
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    const event = new Event(req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REGISTER for event
router.post("/:id/register", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.registeredUsers.includes(req.user.id)) {
      return res.status(400).json({ message: "Already registered" });
    }
    if (event.availableSlots <= 0) {
      return res.status(400).json({ message: "No slots available" });
    }
    event.registeredUsers.push(req.user.id);
    await event.save();
    res.json({ message: "Registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE event (admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin only" });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

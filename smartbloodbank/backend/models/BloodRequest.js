const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverName: String,
  receiverPhone: String,
  bloodGroup: String,
  reason: String,
  city: String,
  urgency: { type: String, enum: ["normal", "urgent", "emergency"], default: "normal" },
  message: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  isEmergency: { type: Boolean, default: false },
  interestedDonors: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    donorName: String,
    donorPhone: String,
    donorCity: String,
    interestedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);

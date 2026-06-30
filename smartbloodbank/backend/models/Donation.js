const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  donorName: String,
  bloodGroup: String,
  city: String,
  donationDate: { type: Date, default: Date.now },
  certificateId: { type: String, unique: true },
  units: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("Donation", donationSchema);

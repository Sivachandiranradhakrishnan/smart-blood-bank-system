const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  bloodGroup: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  weight: { type: Number },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  isAdmin: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  rewardPoints: { type: Number, default: 0 },
  donationCount: { type: Number, default: 0 },
  donationStreak: { type: Number, default: 0 },
  lastDonationDate: { type: Date, default: null },
  badges: [{ type: String }],
  registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }]
}, { timestamps: true });

// Auto calculate age from DOB
userSchema.virtual("age").get(function () {
  const today = new Date();
  const dob = new Date(this.dob);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
});

// Check if eligible to donate
userSchema.virtual("canDonate").get(function () {
  if (this.age < 18) return false;
  if (!this.lastDonationDate) return true;
  const daysSince = Math.floor((new Date() - new Date(this.lastDonationDate)) / (1000 * 60 * 60 * 24));
  return daysSince >= 60;
});

// Days left in rest period
userSchema.virtual("daysUntilNextDonation").get(function () {
  if (!this.lastDonationDate) return 0;
  const daysSince = Math.floor((new Date() - new Date(this.lastDonationDate)) / (1000 * 60 * 60 * 24));
  return Math.max(0, 60 - daysSince);
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);

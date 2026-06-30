const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  city: String,
  totalSlots: { type: Number, default: 50 },
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  description: String
}, { timestamps: true });

eventSchema.virtual("availableSlots").get(function () {
  return this.totalSlots - this.registeredUsers.length;
});

eventSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);

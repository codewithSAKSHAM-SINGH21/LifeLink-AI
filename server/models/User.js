import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    bloodGroup: { type: String, default: "Not specified" },
    allergies: { type: String, default: "None" },
    emergencyContactName: { type: String, default: "" },
    emergencyContactPhone: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

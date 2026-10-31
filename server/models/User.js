import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 40 },
    bloodGroup: { type: String, default: "Not specified" },
    allergies: { type: String, default: "None", trim: true, maxlength: 500 },
    emergencyContactName: { type: String, default: "", trim: true, maxlength: 100 },
    emergencyContactPhone: { type: String, default: "", trim: true, maxlength: 40 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

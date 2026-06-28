import mongoose from "mongoose";

const sosSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: { type: String, default: "active" }, // active | resolved
  },
  { timestamps: true }
);

export default mongoose.model("SOS", sosSchema);

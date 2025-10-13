import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string; // explicitly declare _id as string
  name: string;
  email: string;
  password: string; // hashed in DB
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// When exporting, make sure TS knows the model type
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;

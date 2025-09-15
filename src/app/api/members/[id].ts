// pages/api/members/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb"; // your MongoDB connection
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const client = await connectToDatabase();
  const db = client.db("gymapp");
  const collection = db.collection("members");

  if (req.method === "PUT") {
    try {
      const updateData = req.body;
      await collection.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: updateData }
      );
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to update member" });
    }
  } else if (req.method === "DELETE") {
    try {
      await collection.deleteOne({ _id: new ObjectId(id as string) });
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

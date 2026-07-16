import mongoose from "mongoose"; // eslint-disable-line import/no-extraneous-dependencies
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log(`🔌 Port: ${conn.connection.port || 27017}`);
    console.log(
      `🟢 Connection State: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`,
    );

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("\n💡 Troubleshooting Tips:");
    console.log("1. Make sure MongoDB is running");
    console.log("2. Check your MONGO_URI:", process.env.MONGO_URI);
    console.log("3. Verify MongoDB is on port 27017");
    console.log("4. Check if MongoDB is accessible");
    process.exit(1);
  }
};

export default connectDB;

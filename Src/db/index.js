import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log("DATABASE connected!!");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1); // stop server if DB connection fails
    }
};

export default connectDB;

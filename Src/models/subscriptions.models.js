import mongoose, { Schema } from "mongoose";

const subsSchema = mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref : "User"
    },
    
    channle : {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timeStamps: true})

export const Subscription = mongoose.model("Subscription",subsSchema)
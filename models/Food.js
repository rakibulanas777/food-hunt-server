const mongoose = require("mongoose");
const FoodsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    resturant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    payment: {
      type: Boolean,
      default: false,
    },
    catagory: {
      type: String,
      required: true,
    },
    texture: {
      type: String,
    },
    weight: {
      type: String,
    },
    size: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    quntity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pause", "deliverd"],
      default: "active",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Food", FoodsSchema);

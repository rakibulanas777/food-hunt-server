const express = require("express");
const dotenv = require("dotenv");
const userRoute = require("./routes/users");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

dotenv.config();
const port = process.env.PORT || 8000;
app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello world ");
});

//connect with database
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB);
    console.log("Connected");
  } catch (error) {
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("disconnected");
});
mongoose.connection.on("connected", () => {
  console.log("connected");
});

//middlewares
app.use(express.json({ limit: "2mb" }));

app.use("/api/v1/user", userRoute);

app.listen(port, () => {
  connect();
  console.log(`LIstening on port ${port}`);
});

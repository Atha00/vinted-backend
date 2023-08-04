require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("./middleware/isAuthenticated");
const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/vinted");

const User = require("./models/User");
const Offer = require("./models/Offer");

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur le serveur Vinted !");
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// import des routes user :
const userRoutes = require("./routes/user");
app.use(userRoutes);

// import des routes offer :
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  return res.status(404).json("Cette route n'existe pas");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("Serveur Vinted online on PORT => ", PORT);
});

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2; // laissé l'import ici pour la config cloudinary
mongoose.connect(process.env.MONGODB_URI);

const app = express();

app.use(express.json());

app.use(cors());

// laissez la config cloudinary ici permet de l'avoir pour toute l'application :
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_PUBLIC,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur l'API Vinted");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// import et utilisation des routes :
const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all(/.*/, (req, res) => {
  return res.status(404).json("Not found");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started 👖👕");
});

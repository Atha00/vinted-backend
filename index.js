require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/vinted");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const Offer = require("./models/Offer");

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur notre serveur Vinted !");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.get("/offers", async (req, res) => {
  try {
    // console.log(req.query); // { title: 'robe', priceMax: '100' }

    let limit = 5;

    let page = 1;

    if (req.query.page) {
      page = req.query.page;
    }

    if (req.query.limit) {
      limit = req.query.limit;
    }

    // soit vous mettez une valeur par défaut aux filtres, qui changera si l'un d'eux est reçu
    // let priceMax = req.query.priceMax || 10000;

    const filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMax) {
      filters.product_price = { $lte: req.query.priceMax };
    }

    if (req.query.priceMin) {
      if (filters.product_price !== undefined) {
        filters.product_price.$gte = req.query.priceMin;
      } else {
        filters.product_price = { $gte: req.query.priceMin };
      }
    }

    const sortedObject = {};

    if (req.query.sort === "price-desc") {
      sortedObject.product_price = "desc";
    } else {
      sortedObject.product_price = "asc";
    }

    // const regex = new RegExp(req.query.title, "i");

    const foundOffers = await Offer.find(filters)
      .sort(sortedObject)
      .limit(limit)
      .skip((page - 1) * limit)
      .select("product_name product_price");

    return res.status(200).json(foundOffers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(3000, () => {
  console.log("Server started 🏃‍♂️🏃‍♂️🏃‍♂️");
});

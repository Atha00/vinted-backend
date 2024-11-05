const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middleware/isAuthenticated");

const Offer = require("../models/Offer");

const convertToBase64 = require("../utils/convertB64");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      console.log("user =>", req.user);
      // destructuring de l'objet req.body :
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: Number(price),
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        //  product_image: Object,
        owner: req.user,
      });

      // console.log("files =>", req.files.picture);
      if (req.files) {
        const base64Picture = convertToBase64(req.files.picture);
        const uploadResult = await cloudinary.uploader.upload(base64Picture);
        // console.log(uploadResult);
        newOffer.product_image = uploadResult;
      }

      console.log("newOffer =>", newOffer);
      await newOffer.save();
      return res.status(201).json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);
router.get("/offers", async (req, res) => {
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

module.exports = router;

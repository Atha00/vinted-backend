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

module.exports = router;

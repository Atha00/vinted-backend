const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const isAuthenticated = require("../middleware/isAuthenticated");
const convertBase64 = require("../utils/convertBase64");

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // récupération des données du form-data via req.body et req.files :
      // console.log(req.body);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // créer l'offre avec toutes les données sauf l'image hébergée par cloudinary

      // une fois l'utilisateur récupérer, on va pouvoir créer l'offre :
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

        owner: req.user, // récupéré depuis le middleware
      });
      // console.log(newOffer);
      // une fois l'offre crée, on va s'occupper d'y ajouter l'image :
      // console.log(req.files.picture);

      // formater notre image en base 64
      const convertedPicture = convertBase64(req.files.picture);
      // console.log(convertedPicture);
      // l'envoyer à cloudinary
      const uploadResult = await cloudinary.uploader.upload(convertedPicture);
      console.log(uploadResult);

      // récupérer la réponse pour l'ajouter à l'offre
      newOffer.product_image = uploadResult;
      await newOffer.save();
      return res.status(201).json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

router.get("/offers", async (req, res) => {
  try {
    console.log(req.query);
    const limit = 5;
    // par defaut, on affichera la page 1
    let skip = 0;
    // On va commencer par créer un objet vide
    // ceci afin de le remplir selon les query reçues
    const filters = {};
    // console.log(filters); // {}
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = { $gte: Number(req.query.priceMin) };
    }
    if (req.query.priceMax) {
      // ici il faut faire attention à ne pas tenter de créer une clef dans un objet qui n'existe pas encore, donc on vérifie si il y a une clef product_price dans filters :
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = { $lte: Number(req.query.priceMax) };
      }
    }
    // console.log(filters);  // { product_name: /robe/i, product_price: { '$gte': '70' } }

    const sortObject = {};
    if (req.query.sort) {
      // if (req.query.sort === "price-desc") {
      //   sortObject.product_price = "desc";
      // } else {
      //   sortObject.product_price = "asc";
      // }
      if (req.query.sort === "price-desc" || req.query.sort === "price-asc") {
        sortObject.product_price = req.query.sort.replace("price-", "");
      }
    }
    if (req.query.page) {
      skip = (Number(req.query.page) - 1) * limit;
    }
    // récupérer le nombre d'offres correspondantes aux filtres :
    const count = await Offer.countDocuments(filters);

    const allOffers = await Offer.find(filters)
      .sort(sortObject)
      .limit(limit)
      .skip(skip)
      .populate("owner");
    return res.status(200).json({ count: count, offers: allOffers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    console.log(req.params); // { id: '6a058cdcd8261f6f3dc7d53a' }
    if (req.params.id) {
      const offerDetails = await Offer.findById(req.params.id).populate({
        path: "owner",
        select: "account",
      });
      return res.status(200).json(offerDetails);
    } else {
      return res.status(400).json({ message: "This offer doesn't exist" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

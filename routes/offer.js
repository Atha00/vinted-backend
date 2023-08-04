const express = require("express");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middleware/isAuthenticated");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

const Offer = require("../models/Offer");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/offers", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    // trouver un moyen de recup les req.body => package express-fileupload, utilisé en tant que middleware
    // console.log(req.body);
    // {
    //   title: 'Robe bleue',
    //   description: 'Bla bla bla',
    //   price: '38',
    //   condition: 'Neuf',
    //   city: 'Paris',
    //   brand: 'Etam',
    //   size: 'XL',
    //   color: 'blue'
    // }

    // trouver un moyen d'authentifier l'utilisateur qui post (token)
    // envoyer un token avec la requête qu'on recuperera dans req.headers.authorization

    // console.log(req.headers.authorization); // Bearer s6tWy3DkBp7SPFsl

    // trouver un moyen de récup l'image envoyée
    // console.log(req.files.picture);
    // {
    //   name: 'wallpaper.png',
    //   data: <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 0a 00 00 00 06 40 08 02 00 00 00 3a ce 8c 97 00 00 92 16 49 44 41 54 78 da ec d9 51 15 00 10 00 ... 37405 more bytes>,
    //   size: 37455,
    //   encoding: '7bit',
    //   tempFilePath: '',
    //   truncated: false,
    //   mimetype: 'image/png',
    //   md5: 'c9cace5efb5b59daa564ff7346632741',
    //   mv: [Function: mv]
    // }
    // créer notre offre
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
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

      // image
      // owner
    });
    newOffer.owner = req.user;

    // trouver un moyen d'envoyer notre image à cloudinary
    const convertedFile = convertToBase64(req.files.picture);
    // console.log(convertedFile);
    const uploadResponse = await cloudinary.uploader.upload(convertedFile);
    newOffer.product_image = uploadResponse;

    // BONUS FOLDER :
    // const uploadResponse = await cloudinary.uploader.upload(convertedFile, {folder : `/vinted/offers/${newOffer._id}`});
    // console.log(uploadResponse);

    console.log(newOffer);
    // sauvegarder l'offre
    await newOffer.save();
    return res.status(201).json(newOffer);

    // console.log(owner);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    // on défini par default une limit à 5 offres par page :
    const limit = 5;
    // par défaut on renvoi la première page
    let page = 1;

    if (req.query.page) {
      page = req.query.page;
    }
    // indice :

    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }

    if (req.query.priceMax) {
      // si la clef product_price a déjà été créé, il faut éviter de réassigner une valeur à celle-ci car dans ce cas cela effacera l'ancienne valeur
      if (filters.product_price) {
        // si la clef product_price existe (donc a déjà été crée)
        // on peut rajouter directement à l'objet qu'elle renvoie
        filters.product_price.$lte = req.query.priceMax;
      } else {
        // sinon, il faut la créer et lui assigner un objet
        filters.product_price = { $lte: req.query.priceMax };
      }
    }

    const sortObject = {};

    if (req.query.sort === "price-asc") {
      sortObject.product_price = "asc";
    } else if (req.query.sort === "price-desc") {
      sortObject.product_price = "desc";
    }

    // { product_name: new RegExp(req.query.title, "i")}

    // { product_price : { $gte : req.query.priceMin}}

    // { product_price : { $lte : req.query.priceMax}}

    const offers = await Offer.find(filters)
      .sort(sortObject)
      .limit(limit)
      .skip((page - 1) * limit)
      .select("product_name product_price -_id");

    // console.log(Math.ceil(nombres d'offres / limit)); => nombre de pages
    // console.log(Math.ceil(27 / 5)); => nombre de pages
    // skip = (page - 1) * limit;
    // page 1 => 0
    // page 2 => 5
    // page 3 => 10
    // page 4 => 15
    // page 5 => 20

    return res.status(200).json(offers);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;

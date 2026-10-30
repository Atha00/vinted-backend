const express = require("express");
const router = express.Router();
const expressFileUpload = require("express-fileupload");
const convertFunc = require("../utils/convertToBase64"); // on importe la fonction de conversion en b64
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middleware/isAuthenticated");

// import des modèles :

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  expressFileUpload(),
  async (req, res) => {
    try {
      // console.log(req.body); // undefined si pas de middleware fileUpload !
      // {
      //   title: 'pantalon rouge',
      //   description: 'clinquant et incroyablement stylé',
      //   price: '20',
      //   condition: 'presque neuf',
      //   city: 'Paris',
      //   brand: 'H&M',
      //   size: 'L',
      //   color: 'rouge'
      // }
      // console.log(req.files.picture);
      // {
      //   name: 'pantalon-tailleur-classique-a-pinces-rouge-hippocampe-melle-boutique.jpeg',
      //   data: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 01 00 60 00 60 00 00 ff fe 00 3b 43 52 45 41 54 4f 52 3a 20 67 64 2d 6a 70 65 67 20 76 31 2e 30 20 28 75 73 69 ... 50135 more bytes>,
      //   size: 50185,
      //   encoding: '7bit',
      //   tempFilePath: '',
      //   truncated: false,
      //   mimetype: 'image/jpeg',
      //   md5: '4fad3bc9e12f90dbb525628542a17dc0',
      //   mv: [Function: mv]
      // }
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

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
        owner: req.user,
      });
      // console.log(newOffer);
      // {
      //   product_name: 'pantalon rouge',
      //   product_description: 'clinquant et incroyablement stylé',
      //   product_price: 20,
      //   product_details: [
      //     { MARQUE: 'H&M' },
      //     { TAILLE: 'L' },
      //     { 'ÉTAT': 'presque neuf' },
      //     { COULEUR: 'rouge' },
      //     { EMPLACEMENT: 'Paris' }
      //   ],
      //   owner: {
      //     account: { username: 'Max' },
      //     _id: new ObjectId('6ae1c2b55ea6ce1be12064c4'),
      //     email: 'max@lereacteur.io',
      //     newsletter: true,
      //     token: 'zLIlaHD63owV7WPs7sUJkXVU_dQXzwtv',
      //     hash: 'EzOAHR5UqZog7cNaLpf6TuxXbw+7nW2tikrC/tmLt8U=',
      //     salt: '-tsPmj7k6JZU1vW8UW2l7Y5W',
      //     __v: 0
      //   },
      //   _id: new ObjectId('6ae311a391bba29b2c2c4765')
      // }
      // on va maintenant s'occuper de l'image de note offre :
      // on va commencer par l'envoyer à cloudinary pour qu'ils l'hébergent :
      // on va avoir besoin de l'image convertie en base64 :
      if (req.files) {
        const base64Picture = convertFunc(req.files.picture);
        // une fois convertie, on peut l'envoyer à cloudinary
        const uploadResult = await cloudinary.uploader.upload(base64Picture);
        // console.log(uploadResult);
        // {
        //   asset_id: '96844aa27e8fab19a302b8a88ed58e0d',
        //   public_id: 'nvbwkw4ec36d5og72so4',
        //   version: 1793266599,
        //   version_id: '9127573be5d9a5f0f8d9de87e2b28a87',
        //   signature: '1c820b3a21edb7df295adf5f32c2656f7359e342',
        //   width: 988,
        //   height: 988,
        //   format: 'jpg',
        //   resource_type: 'image',
        //   created_at: '2026-10-29T09:36:39Z',
        //   tags: [],
        //   bytes: 50185,
        //   type: 'upload',
        //   etag: '4fad3bc9e12f90dbb525628542a17dc0',
        //   placeholder: false,
        //   url: 'http://res.cloudinary.com/dgeecqeey/image/upload/v1793266599/nvbwkw4ec36d5og72so4.jpg',
        //   secure_url: 'https://res.cloudinary.com/dgeecqeey/image/upload/v1793266599/nvbwkw4ec36d5og72so4.jpg',
        //   folder: '',
        //   api_key: '811139293529477'
        // }
        newOffer.product_image = uploadResult;
      }
      await newOffer.save();
      return res.status(201).json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

router.get("/offers", async (req, res) => {
  try {
    // on va définir une page par défaut :
    let page = 1;
    const limit = 5;
    // 2eme pb impossible de convertir undefined en Number
    const filters = {}; // pour le .find
    // si on a une query title
    if (req.query.title) {
      // on crée une clef product_name dans filters, et on lui assigne la valeur de la query title :
      filters.product_name = new RegExp(req.query.title, "i");
    }
    // si on a une query priceMax
    if (req.query.priceMax) {
      // on crée une clef product_price dans filters, et on lui assigne en valeur un objet :
      filters.product_price = {
        $lte: req.query.priceMax,
      };
    }
    // si on a une query priceMin
    if (req.query.priceMin) {
      if (filters.product_price) {
        // on crée une clef $gte dans filters.product_price, et on lui assigne en valeur la query
        filters.product_price.$gte = req.query.priceMin;
      } else {
        filters.product_price = {
          $gte: req.query.priceMin,
        };
      }
    }
    if (req.query.page) {
      page = req.query.page;
    }

    // 1er problème au niveau du sort : s'il est undefined la methode replace provoque une erreur
    const sortedObject = {}; // pour le sort
    if (req.query.sort) {
      sortedObject.product_price = req.query.sort.replace("price-", "");
    }

    const offers = await Offer.find(filters)
      .sort(sortedObject)
      .limit(limit)
      .skip((page - 1) * limit)
      .select("product_price product_name -_id");

    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get("/offers/:id", async (req, res) => {
  try {
    console.log(req.params); // { id : '6ae31ba13183ecf1a576f780' }
    // const offerDetails = await Offer.findOne({ _id : req.params.id}).populate({
    //   path: "owner",
    //   select: "account",
    // });
    // on peut mettre un objet dans le populate pour préciser avec la clef `select` quel(s) champs de la clef qui est populate on veut renvoyer
    const offerDetails = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    return res.status(200).json(offerDetails);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

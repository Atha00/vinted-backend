require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("./utils/convertB64");
const cors = require("cors");
// console.log(process.env);

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const User = require("./models/User");

const Offer = mongoose.model("Offer", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  product_image: Object,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur le server Vinted !");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// import des routes :
const userRoutes = require("./routes/user");
app.use(userRoutes);

app.post("/offer/publish", fileUpload(), async (req, res) => {
  try {
    // tout d'abord, on récupère le token de la requête, pour ensuite rechercher l'utilisateur correspondant :
    // si on aucun n'est présent :
    if (req.headers.authorization === undefined) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // si on a bien un token avec le requête :
    const bearerToken = req.headers.authorization;
    console.log(bearerToken); // Bearer Qc6QIQSZWrB8CP3r6-lK8BKKDdIGPjhO
    const token = bearerToken.replace("Bearer ", "");
    console.log(token);

    // une fois le token récupéré, on va rechercher dans la BDD si celui-ci correspond à celui d'un de nos utilisateurs :
    const foundUser = await User.findOne({ token: token });
    console.log(foundUser);
    // {
    //   account: { username: 'Max' },
    //   _id: new ObjectId('68245a06a055278d511fe513'),
    //   email: 'max@lereacteur.io',
    //   newsletter: true,
    //   token: 'Qc6QIQSZWrB8CP3r6-lK8BKKDdIGPjhO',
    //   hash: 'wAlSVN8dkYToJH0JtPhfAlAzPALYhS/aZF88uWozKVo=',
    //   salt: 'Z4BlGlAK9jwK8wTS0l4acZY7',
    //   __v: 0
    // }
    if (foundUser === null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // console.log("body =>", req.body);
    //  {
    //   title: 'pantalon rouge',
    //   description: 'Tout rouge',
    //   price: '80',
    //   condition: 'presque neuf',
    //   city: 'Lyon',
    //   brand: 'H&M',
    //   size: 'XL',
    //   color: 'rouge'
    // }
    // console.log("files =>", req.files.picture);
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

    // il va falloir créer une offre, et pour cela, nous aurons des infos suivantes :
    const newOffer = new Offer({
      product_name: req.body.title,
      product_description: req.body.description,
      product_price: Number(req.body.price),
      product_details: [
        {
          MARQUE: req.body.brand,
        },
        {
          TAILLE: req.body.size,
        },
        {
          ÉTAT: req.body.condition,
        },
        {
          COULEUR: req.body.color,
        },
        {
          EMPLACEMENT: req.body.city,
        },
      ],
    });
    // console.log(newOffer);
    // si on a une image dans form-data :
    if (req.files) {
      // upload de l'image sur cloudinary
      const uploadResponse = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );
      // console.log(uploadResponse);
      newOffer.product_image = uploadResponse;
    }
    newOffer.owner = foundUser._id;

    // sauvegarder l'offre
    await newOffer.save();
    return res.status(201).json(newOffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/offers", async (req, res) => {
  try {
    let page = 1; // mettre une page par défaut
    let limit = 10; // mettre une limite par défaut
    console.log(req.query); // { title: 'jean' }
    const filters = {};
    // l'arcane secrète du "OU inline" :
    // filters.product_name = req.query.title || ""

    // si il y a une query title, je rajoute une clef product_name à l'objet filter, et je lui assigne la valeur de la query title
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    // si il y a une query priceMax, je rajoute une clef product_price  à l'objet filter, et je lui assigne la valeur  d'un objet qui a une clef "$lte" qui renvoi la valeur de la query priceMax
    if (req.query.priceMax) {
      filters.product_price = { $lte: req.query.priceMax };
    }

    // ici on a deux problèmes :
    if (req.query.priceMin) {
      if (filters.product_price) {
        // ici risque que filters.product_price soit undefined (n'existe pas) et donc pas possible de créer une clef dedans
        filters.product_price.$gte = req.query.priceMin;
      } else {
        // ici risque d'écraser la valeur précédente de filters.product_price :
        filters.product_price = { $gte: req.query.priceMin };
      }
    }

    const sortedObject = {};
    if (req.query.sort) {
      // on retire "price-" de req.query.sort, afin de garder que "asc" ou "desc"
      const query = req.query.sort.replace("price-", "");
      sortedObject.product_price = query;
    }

    if (req.query.page) {
      page = req.query.page;
    }

    console.log(filters);
    const filteredOffers = await Offer.find(filters)
      .sort(sortedObject)
      .limit(limit)
      .skip((page - 1) * limit)
      .select("product_name product_price -_id");

    return res.status(200).json(filteredOffers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.all(/.*/, (req, res) => {
  return res.status(404).json("All routes");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server started 👖👗 on port : " + port);
});

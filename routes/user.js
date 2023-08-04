const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, newsletter, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing parameters" });
    } else {
      const existingUser = await User.findOne({ email: email });
      console.log(existingUser); // affiche un utilisateur trouvé ou null
      if (!existingUser) {
        // console.log(password); // azerty
        const salt = uid2(16); // crée une string de 16 caractères aléatoires
        const token = uid2(16); // crée une autre string de 16 caractères aléatoires
        // On récupère le password pour lui ajouter (en concaténant), le salt :
        const saltedPassword = password + salt;
        // console.log(saltedPassword); // azertyTX6uBvIZidXTnX-G
        const hash = SHA256(saltedPassword).toString(encBase64);
        // console.log(hash); // EX+ZvfkYXQQCoCwA3CM2sOEaNHuLOw8kYOh6l1AxUA0=
        const newUser = new User({
          email: email,
          account: {
            username: username,
          },
          newsletter: newsletter,
          token: token,
          hash: hash,
          salt: salt,
        });
        // console.log(newUser);
        // {
        //     email: 'johndoe@lereacteur.io',
        //     account: { username: 'JohnDoe' },
        //     newsletter: true,
        //     token: 'tvUAvcaThv2JDY1d',
        //     hash: 'n//vmKQsbfPAPFsN7wmAsL42ivrqd7XDrraMffg3/D0=',
        //     salt: '7pcer5j-orxALgTh',
        //     _id: new ObjectId("64ca1227a1aee9adaba3156c")
        //   }

        await newUser.save();
        const responseObject = {
          _id: newUser._id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
          },
        };
        return res.status(201).json(responseObject);
      } else {
        return res
          .status(409)
          .json({ message: "Cet email est déjà utilisé !" });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    console.log(req.body);
    // récupérer l'email pour retrouver l'utilisateur en base de données (s'il existe);
    const foundUser = await User.findOne({ email: req.body.email });
    console.log(foundUser);
    if (foundUser) {
      // vérifier le password
      const newHash = SHA256(req.body.password + foundUser.salt).toString(
        encBase64
      );
      if (newHash === foundUser.hash) {
        const responseObject = {
          _id: foundUser._id,
          token: foundUser.token,
          account: {
            username: foundUser.account.username,
          },
        };
        return res.status(200).json(responseObject);
      } else {
        return res.status(400).json({ message: "password or email incorrect" });
      }
    } else {
      return res.status(400).json({ message: "email or password incorrect" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;

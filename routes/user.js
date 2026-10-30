const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const router = express.Router();

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    req.body.username = req.body.username.trim();
    // etc...

    if (
      req.body.username &&
      req.body.email &&
      req.body.password &&
      typeof req.body.newsletter === "boolean"
    ) {
      // console.log(req.body);
      // {
      //   username: 'JohnDoe',
      //   email: 'johndoe@lereacteur.io',
      //   password: 'azerty',
      //   newsletter: true
      // }

      // le destructuring permet de se passer de req.body par la suite !
      const { username, email, password, newsletter } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json("Email already exist");
      }

      const salt = uid2(24);
      const token = uid2(32);

      const hash = encBase64.stringify(SHA256(password + salt));

      const newUser = new User({
        email,
        account: {
          username,
        },
        newsletter,
        token,
        hash,
        salt,
      });
      console.log(newUser);

      // de l'ordre du possible : modifier le document après sa création, mais avant sa sauvegarde ! 🤪
      // newUser.salt = salt;

      // console.log(newUser);
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
      return res.status(400).json("Missing parameters");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.body); // { email: 'johndoe@lereacteur.io', password: 'azerty' }

    const { email, password } = req.body;
    // d'abord utiliser le mail pour retrouver le user en BDD :
    const foundUser = await User.findOne({ email: email });
    // si aucun user n'a cet email :
    if (!foundUser) {
      return res.status(401).json("email or password incorrect");
    } else {
      // on crée un n ouveau hash à l'aide du password envoyé par la requete et le salt récupéré dans la BDD
      const newHash = encBase64.stringify(SHA256(password + foundUser.salt));
      // on compare ensuite le nouveau hash avec celui en BDD :
      if (newHash === foundUser.hash) {
        return res.status(200).json({
          _id: foundUser._id,
          token: foundUser.token,
          account: {
            username: foundUser.account.username,
          },
        });
      } else {
        return res.status(401).json("email or password incorrect");
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

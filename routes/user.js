const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const base64 = require("crypto-js/enc-base64");
const router = express.Router();

// import du modèle User :
const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // console.log(req.body);
    // {
    //   username: 'JohnDoe',
    //   email: 'johndoe@lereacteur.io',
    //   password: 'azerty',
    //   newsletter: true
    // }
    // destructuring  du body :
    // const { username, email, password, newsletter } = req.body;

    // vérification que toutes les infos ont été envoyées :
    if (!req.body.email || !req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Missing parameters" });
    }
    // vérification que l'email n'est pas déjà utilisé :
    const existingMail = await User.findOne({ email: req.body.email });
    if (existingMail) {
      return res.status(409).json({ message: "Cet email est déjà utilisé !" });
    }

    // création de notre token :
    const token = uid2(32);
    // creation du salt :
    const salt = uid2(24);
    // génération du hash :
    const hash = SHA256(req.body.password + salt).toString(base64);

    // création de notre utilisateur :
    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: true,
      salt: salt,
      token: token,
      hash: hash,
    });
    // console.log(newUser);
    // {
    //   email: 'johndoe@lereacteur.io',
    //   account: { username: 'JohnDoe' },
    //   newsletter: true,
    //   token: 'dRc_FXLdTrkP3YmdiLOZhLOhoVOj8ovq',
    //   hash: 'SAe617YnO4zrXzUseWMRygxhyED7AN0dxEwZWd1xZtU=',
    //   salt: '-W_My19y9sxXEBmMryiqzxH2',
    //   _id: new ObjectId('68245655283a2a5a01cfd1b3')
    // }
    await newUser.save();
    const responseObject = {
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    };

    return res.status(201).json(responseObject);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.body); // { email: 'johndoe@lereacteur.io', password: 'azerty' }
    // vérification que toutes les infos ont été envoyées :
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Missing parameters" });
    }
    // récupérer l'utilisateur correspondant à l'email :
    const foundUser = await User.findOne({ email: req.body.email });
    console.log(foundUser);
    // {
    //   account: { username: 'JohnDoe' },
    //   _id: new ObjectId('682456eeec20b37a03af2fb5'),
    //   email: 'johndoe@lereacteur.io',
    //   newsletter: true,
    //   token: 'cIRMHQsZctCLLNE80MkxvZhk2LB5stTJ',
    //   hash: 'aZws6YiazAInSTkdF9zTdiTFOWaWuC3YmqEp2kWNBrQ=',
    //   salt: 'zetkuhZfOIv58n48vzEexMHP',
    //   __v: 0
    // }
    // génération d'un nouveau hash avec le password envoyé par l'utilisateur (pour se connecter) et le salt récupéré en BDD :
    const newHash = SHA256(req.body.password + foundUser.salt).toString(base64);
    // comparons le nouveau obtenu avec celui en BDD :
    if (foundUser.hash === newHash) {
      const responseObject = {
        token: foundUser.token,
        account: foundUser.account,
        _id: foundUser._id,
      };
      return res.status(200).json(responseObject);
    } else {
      return res
        .status(401)
        .json({ message: "Mot de passe ou email incorrect" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

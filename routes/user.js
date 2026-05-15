const express = require("express");
const router = express.Router();

const uid = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User.js");

router.post("/user/signup", async (req, res) => {
  try {
    // console.log(req.body);
    // ici on contrôle que toutes les données nous parviennent
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Missing informations" });
    }
    // {
    //   username: 'JohnDoe',
    //   email: 'johndoe@lereacteur.io',
    //   password: 'azerty',
    //   newsletter: true
    // }
    const isEmailAlreadyExist = await User.findOne({ email: req.body.email });
    if (isEmailAlreadyExist) {
      return res.status(409).json({ message: "Email already exist" });
    }

    const token = uid(32);
    // console.log(token); // u5LOHQoXUJxxAL5cCGaMU5nE2wk91nxv
    const salt = uid(16);
    // console.log(salt); // 4Le8tzG9twAxnlub
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    // const hash2 = encBase64.stringify(SHA256(req.body.password + salt));

    // console.log(hash); // jDbwgI3nQbNIcUqpN4Z8VxdkO9f/T+CbVE4dCJj144c=
    // console.log(hash2); // jDbwgI3nQbNIcUqpN4Z8VxdkO9f/T+CbVE4dCJj144c=

    // CREATION DE L'UTILISATEUR :
    const newUser = new User({
      //   email: { type: String, unique: true },
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: true,
      token: token,
      hash: hash,
      salt: salt,
    });

    // console.log(newUser);
    await newUser.save();
    const objectResponse = {
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
      },
    };

    return res.status(201).json(objectResponse);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    if (!req.body.password || !req.body.email) {
      return res.status(400).json({ message: "Missing informations" });
    }
    // console.log(req.body); // { email: 'johndoe@lereacteur.io', password: 'azerty' }
    // on récupère le mail pour rechercher notre utilisateur en BDD :
    const foundUser = await User.findOne({ email: req.body.email });

    if (!foundUser) {
      return res.status(401).json("Wrong mail or password");
    }
    console.log(foundUser);
    // {
    //   account: { username: 'JohnDoe' },
    //   _id: new ObjectId('6a0435df867f58ba5626b5ad'),
    //   email: 'johndoe@lereacteur.io',
    //   newsletter: true,
    //   token: 'xyYa-5Ejc6qM8GZOvtlWvZJh2LMQiX7J',
    //   hash: 'gul9C742yfpF4bbn8ZwH5AJG3YNcOy4liZ8qhP/ykQs=',
    //   salt: '8ettp9b583vntYDf',
    //   __v: 0
    // }

    // on crée ensuite un nouveau hash avec le salt récupéré en BDD concaténer avec le password reçu en body (envoyé par l'utilisateur)
    const newHash = SHA256(req.body.password + foundUser.salt).toString(
      encBase64,
    );
    // comparer les deux hash (celui généré ici, et celui stocké en BDD)

    // si ils sont identiques,
    if (newHash === foundUser.hash) {
      // on renvoi un token (entre autres)
      const objectResponse = {
        _id: foundUser._id,
        token: foundUser.token,
        account: {
          username: foundUser.account.username,
        },
      };
      return res.status(200).json(objectResponse);
    } else {
      // sinon, on renvoi un status 401 : unauthorized
      return res.status(401).json("Wrong mail or password");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

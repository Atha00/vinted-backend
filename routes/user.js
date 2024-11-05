const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // console.log(req.body);
    // {
    //     username: 'JohnDoe',
    //     email: 'johndoe@lereacteur.io',
    //     password: 'azerty',
    //     newsletter: true
    // }

    // vérifier que le body contient bien un username :
    if (req.body.username) {
      // avant toute chose, on va regarder dans la BDD si l'email n'est pas déjà utilisé :
      const isEmailExist = await User.findOne({ email: req.body.email });
      // si le findOne ne trouve rien, il renverra null, sinon il renverra un objet !
      if (isEmailExist === null) {
        // commencer par générer un salt, et un token :
        const newSalt = uid2(16);
        const newToken = uid2(32);
        // crypter le password et le salt pour obtenir un hash
        const newHash = SHA256(req.body.password + newSalt).toString(encBase64);
        // console.log(newHash); // +Slv4zDYOK1XZ8nLC1ybl9HKEjuqwJBYTgwAXTengt4=
        // créer notre nouvel utilisateur
        const newUser = new User({
          email: req.body.email,
          account: {
            username: req.body.username,
          },
          newsletter: req.body.newsletter,
          token: newToken,
          hash: newHash,
          salt: newSalt,
        });
        // console.log(newUser);
        // enregistrer celui-ci en BDD
        await newUser.save();
        // préparer l'objet que l'on va répondre :
        const responseObject = {};
        responseObject._id = newUser._id;
        responseObject.token = newUser.token;
        responseObject.account = {
          username: newUser.account.username,
        };
        return res.status(201).json(responseObject);
      } else {
        return res.status(409).json("Email already used");
      }
    } else {
      return res.status(400).json("Missing informations");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.body); // { email: 'johndoe@lereacteur.io', password: 'azerty' }

    // récupérer l'utilisateur correspondant à l'email dans la BDD
    const userFound = await User.findOne({ email: req.body.email });
    // .select("account token -_id");
    console.log(userFound);
    // {
    //     account: { username: 'JohnDoe' },
    //     _id: new ObjectId('67212f794ff1d55e2875cc60'),
    //     email: 'johndoe@lereacteur.io',
    //     newsletter: true,
    //     token: 'Wv4g1Lo31S9uZx1RvQLc4XnjyhctXJeP',
    //     hash: 'QX0cico/XONFQhltjBK718uy+H3ZMLWtuGNppQk/HIY=',
    //     salt: 'C7Ctx3QILePXyQHk',
    //     __v: 0
    // }
    if (!userFound) {
      return res.status(401).json("Email ou mot de passe incorrect");
    } else {
      // on va recréer un nouveau hash avec la password envoyé (dans req.body) et le salt de l'utilisateur récupéré dans la BDD (cf ci-dessus)
      const newHash = SHA256(req.body.password + userFound.salt).toString(
        encBase64
      );
      //   console.log(newHash); // QX0cico/XONFQhltjBK718uy+H3ZMLWtuGNppQk/HIY=
      // comparer les deux hash (celui que l'on vient de générer, avec celui stocké avec l'utilisateur correspondant dans la BDD ):
      if (newHash === userFound.hash) {
        // si ce sont les mêmes, connection autorisée et renvoi du token

        // générer l'objet de réponse :
        const responseObject = {};
        responseObject._id = userFound._id;
        responseObject.token = userFound.token;
        responseObject.account = {
          username: userFound.account.username,
        };
        return res.status(200).json(responseObject);
      } else {
        // sinon, un BON GROS STATUS 401
        return res.status(401).json("Email ou mot de passe incorrect");
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

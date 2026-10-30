const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // vérifions qu'un token a bien été envoyé avec la requête :
  if (req.headers.authorization !== undefined) {
    // pour récupérer le "owner", on va utiliser le token qui a été envoyé avec la requête :
    // console.log(req.headers.authorization); // Bearer zLIlaHD63owV7WPs7sUJkXVU_dQXzwtv
    const token = req.headers.authorization.replace("Bearer ", "");
    // OU const token = req.headers.authorization.split("Bearer ")[1]
    // console.log(token); // zLIlaHD63owV7WPs7sUJkXVU_dQXzwtv

    // une fois le token récupéré, on peut rechercher notre utilisateur dans la base de données :
    const foundUser = await User.findOne({ token: token });
    if (foundUser) {
      req.user = foundUser;
      return next();
    } else {
      return res.status(401).json("Unauthorized");
    }
    // console.log(foundUser);
    // {
    //   account: { username: 'Max' },
    //   _id: new ObjectId('6ae1c2b55ea6ce1be12064c4'),
    //   email: 'max@lereacteur.io',
    //   newsletter: true,
    //   token: 'zLIlaHD63owV7WPs7sUJkXVU_dQXzwtv',
    //   hash: 'EzOAHR5UqZog7cNaLpf6TuxXbw+7nW2tikrC/tmLt8U=',
    //   salt: '-tsPmj7k6JZU1vW8UW2l7Y5W',
    //   __v: 0
    // }
  } else {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;

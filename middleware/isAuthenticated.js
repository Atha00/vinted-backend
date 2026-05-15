const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    // pour cela nous aurons besoin des infos de req.body, ainsi que des infos de l'utilisateur qui publie l'offre
    // récupérons le token de notre utilisateur :
    // console.log(req.headers.authorization);
    // retirer le "Bearer " de devant le token :
    const token = req.headers.authorization.slice(7);
    // console.log(token); // NZcLx4Q7rupMs1mnKx4wr7Owkk4lrb88
    // recherche si le token correspond à un utilisateur de notre base de données :
    const foundUser = await User.findOne({ token: token }).select("account");
    // console.log(foundUser); // OK
    if (foundUser === null) {
      return res.status(401).json({ message: "Unauthorized" });
    } else {
      // on ajoute une clef à l'objet req, qu'on pourra donc récupérer dans la route qui suit :
      req.user = foundUser;
      return next();
    }
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = isAuthenticated;

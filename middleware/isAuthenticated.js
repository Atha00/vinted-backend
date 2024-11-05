const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // commencer par authentifier l'utilisateur :
  // console.log(req.headers.authorization); // Bearer J-HdWKqsgss8a7i5yKcO_nG6rrypCzbn
  const token = req.headers.authorization.replace("Bearer ", "");

  // console.log(token); // J-HdWKqsgss8a7i5yKcO_nG6rrypCzbn
  const foundUser = await User.findOne({ token: token });
  // console.log(foundUser);
  if (foundUser === null) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    req.user = foundUser;
    return next();
  }
};

module.exports = isAuthenticated;

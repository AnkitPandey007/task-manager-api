const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const auth = async (req, res, next) => {
  try {
    const Bearer = req.header("Authorization");
    const token = Bearer.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    }); // just checking token exist for current user
    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    // Unauthorized
    res.status(401).send({ error: "Authentication Error" });
  }
};

module.exports = auth;

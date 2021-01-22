const { json } = require("express");
const jwt = require("jsonwebtoken");
const config = require("../../config/default");

function authenticate(req, res, next) {
  let { token } = req.cookies;
  if (!token)
    return res.status(401).send({ error: "access denied no token provided" });
  token = token.split(" ")[1];
  jwt.verify(token, config.privateKey, (err, decoded) => {
    if (decoded) {
      req.user = decoded;
      next();
    } else res.status(401).send({ error: "access denied, invalid signature" });
  });
}

module.exports = authenticate;

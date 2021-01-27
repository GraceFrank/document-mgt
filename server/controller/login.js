const validate = require("../api-validations/login");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { Role } = require("../models");

class Login {
  async post(req, res) {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    //checking if email exist in db
    const user = await User.findOne({ email: req.body.email });
    const role = await Role.findOne({ _id: user.role });
    if (!user)
      return res.status(400).send({ error: "invalid email or password" });

    //validating the user password is correct
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword)
      return res.status(400).send({ error: "invalid email or password" });

    const token = user.generateToken();

    res.cookie("token", token, { httpOnly: true });

    res.send({
      status: 200,
      message: "ok",
      payload: {
        ..._.pick(user, ["_id", "name", "email", "userName", "role"]),
        token,
        expiresIn: 86400,
      },
    });
  }
}

module.exports = new Login();

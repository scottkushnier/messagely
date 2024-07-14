const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");

User = require("../models/user");
const { SECRET_KEY } = require("../config");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function (req, res, next) {
  try {
    const valid = await User.authenticate(req.body.username, req.body.password);
    console.log("valid: ", valid);
    if (valid) {
      const username = req.body.username;
      const JWT_OPTIONS = { expiresIn: 60 * 60 * 24 }; // 1 day
      const payload = { username };
      const token = jwt.sign(payload, SECRET_KEY, JWT_OPTIONS);
      await User.updateLoginTimestamp(username);
      return res.json({ token: token });
    }
    return res.json({ errorMsg: "could not authenticate" });
  } catch (err) {
    next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function (req, res, next) {
  try {
    console.log("body: ", req.body);
    const details = await User.register(req.body);
    const username = req.body.username;
    const JWT_OPTIONS = { expiresIn: 60 * 60 }; // 1 hour
    const payload = { username };
    const token = jwt.sign(payload, SECRET_KEY, JWT_OPTIONS);
    await User.updateLoginTimestamp(username);
    return res.json({ token: token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

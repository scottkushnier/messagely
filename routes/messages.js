const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
} = require("../middleware/auth");

router.use(express.json());

Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    console.log("user:", req.user);

    message = await Message.get(req.params.id);
    if (
      message.from_user.username != req.user.username &&
      message.to_user.username != req.user.username
    ) {
      throw new ExpressError(
        "Sorry, message is private between sender and receiver",
        400
      );
    }
    return res.json({ message });
  } catch (err) {
    next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    if (req.body.from_username != req.user.username) {
      throw new ExpressError("Sorry, need to logged in to send a message", 400);
    }
    const message = await Message.create(req.body);
    return res.json({ message });
  } catch (err) {
    next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
  try {
    const message = await Message.get(req.params.id);
    // console.log(message);
    if (message.to_user.username != req.user.username) {
      throw new ExpressError(
        "Sorry, only recipient can mark a message as read",
        400
      );
    }
    const result = await Message.markRead(req.params.id);
    return res.json({ message: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

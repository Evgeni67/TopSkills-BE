const express = require("express");
const mongoose = require("mongoose");

const { authorize } = require("../../services/auth/middleware");
const {
  authenticate,
  refreshToken, //TODO
  cryptPassword,
} = require("../../services/auth/tools");

const accountRauter = express.Router();

const accountSchema = require("./schema");

accountRauter.post("/register", async (req, res, next) => {
  try {
    const password = await cryptPassword(req.body.password);
    req.body["password"] = password;
    const newAccount = new accountSchema(req.body);
    newAccount.save();
    res.send(newAccount._id);
  } catch (error) {
    next(error);
  }
});

accountRauter.get("/login/:email/:password", async (req, res, next) => {
  try {
    const email = req.params.email;
    const password = req.params.password;
    const user = await accountSchema.findByCredentials(email, password, {
      new: true,
    });
    console.log(email, password);
    console.log(user);

    if (user) {
      const tokens = await authenticate(user);
      res.send([tokens, user]);
    } else {
      res.send("Not found");
    }
  } catch (error) {
    next(error);
    console.error(error);
  }
});

accountRauter.get("/getMe", authorize, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

accountRauter.post("/logOut", authorize, async (req, res, next) => {
  try {
    const user = await accountSchema.findOne({ name: req.user.name });
    user.save();
    res.send("logged out");
  } catch (error) {
    next(error);
  }
});

module.exports = accountRauter;

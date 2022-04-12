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
    const password = await cryptPassword(req.body.body.password);
    req.body["password"] = password;
    const newAccount = new accountSchema(req.body.body);
    newAccount.save();
    res.send(newAccount._id);
  } catch (error) {
    3;
    next(error);
  }
});

accountRauter.put(
  "/addToFavourites/:movieId",
  authorize,
  async (req, res, next) => {
    try {
      console.log(req?.user?.favourites);

      if (req?.user?.favourites.includes(req.params.movieId)) {
        const filteredMovieIds = req?.user?.favourites.filter(
          (id) => id !== req.params.movieId
        );
        console.log(filteredMovieIds);
        await accountSchema.findByIdAndUpdate(
          mongoose.Types.ObjectId(req.user._id),
          {
            favourites: filteredMovieIds,
          }
        );
        res.send("Removed");
      } else {
        await accountSchema.findByIdAndUpdate(
          mongoose.Types.ObjectId(req.user._id),
          {
            $push: { favourites: req.params.movieId },
          }
        );
        res.send("Added");
      }
    } catch (error) {
      next(error);
    }
  }
);
accountRauter.put("/addNote/:movieId", authorize, async (req, res, next) => {
  try {
    await accountSchema.findByIdAndUpdate(
      mongoose.Types.ObjectId(req.user._id),
      {
        $push: { notes: req.body.body },
      }
    );
    res.send("Note added");
  } catch (error) {
    next(error);
  }
});
accountRauter.put("/deleteNote", authorize, async (req, res, next) => {
  try {
    console.log(req.body.body.note);
    const filteredNotes = req.user.notes.filter(
      (note) => note.note !== req.body.body.note
    );
    console.log(filteredNotes);
    await accountSchema.findByIdAndUpdate(
      mongoose.Types.ObjectId(req.user._id),
      {
        notes: filteredNotes,
      }
    );
    res.send("Note added");
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

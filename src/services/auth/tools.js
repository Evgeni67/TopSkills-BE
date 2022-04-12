const jwt = require("jsonwebtoken");
const User = require("../accounts/schema");
const mongoose = require("mongoose");
const saltRounds = process.env.SALT_ROUNDS;
const bcrypt = require("bcryptjs");
const authenticate = async (user) => {
  try {
    const newAccessToken = await generateJWT({ _id: user._id });
    const newRefreshToken = await generateRefreshJWT({ _id: user._id });
    const user2 = await User.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(user._id) },
      {
        $addToSet: {
          tokens: { token: newAccessToken, refreshToken: newRefreshToken },
        },
      },
      { useFindAndModify: false }
    );

    if (user2) {
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } else {
      return "Wrong Credentials";
    }
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
const cryptPassword = async (plainPW) => {
  try {
    return await bcrypt.hash(plainPW, parseInt(saltRounds));
  } catch (e) {
    console.log(e);
    next(e);
  }
};
const generateJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

verifyJWT = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};

const generateRefreshJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyRefreshToken = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const refreshToken = async (oldRefreshToken) => {
  const decoded = await verifyRefreshToken(oldRefreshToken);
  const user = await User.findOne({ _id: decoded._id });
  if (!user) {
    throw new Error(`Access is forbidden`);
  }

  const currentRefreshToken = user.refreshTokens.find(
    (t) => t.refreshToken === oldRefreshToken
  );
  if (!currentRefreshToken) {
    throw new Error(`Refresh token is wrong`);
  }
  const newAccessToken = await generateJWT({ _id: user._id });
  const newRefreshToken = await generateRefreshJWT({ _id: user._id });

  const newRefreshTokens = user.refreshTokens
    .filter((t) => t.refreshToken !== oldRefreshToken)
    .concat({ refreshToken: newRefreshToken });
  user.refreshTokens = [...newRefreshTokens];
  await user.save();
  return { token: newAccessToken, refreshToken: newRefreshToken };
};

module.exports = { authenticate, verifyJWT, refreshToken, cryptPassword };

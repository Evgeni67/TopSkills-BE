const jwt = require("jsonwebtoken");
const AccountModel = require("../accounts/schema");
const { verifyJWT } = require("./tools");

const authorize = async (req, res, next) => {
  try {
    //TODO Find out why do we get the token from different props
    // =TIP= Check get/post differences at axios/Front-End

    let token = "";
    const testToken1 = req?.headers?.authorization;
    const testToken2 = req?.body?.headers?.Authorization;
    if (testToken1) {
      token = testToken1.replace("Bearer ", "");
    } else if (testToken2) {
      token = testToken2.replace("Bearer ", "");
    }
    const decoded = await verifyJWT(token);
    const user = await AccountModel.findOne({
      _id: decoded._id,
    });

    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    console.log(e);
    const err = new Error("Please authenticate");
    err.httpStatusCode = 401;
    next(err);
  }
};

const adminOnlyMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === "admin") next();
  else {
    const err = new Error("Only for admins!");
    err.httpStatusCode = 403;
    next(err);
  }
};

module.exports = { authorize, adminOnlyMiddleware };

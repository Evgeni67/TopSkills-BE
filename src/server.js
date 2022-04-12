const express = require("express");
const cors = require("cors");

const accountRauter = require("./services/accounts");
const {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
} = require("./services/utilities/errorHandling");

const mongoose = require("mongoose");

const server = express();

const port = process.env.PORT || 3002;

server.use(express.json({ limit: "50mb" }));
server.use(cors());

server.use(express.json());
server.use("/account", accountRauter);
server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);
server.use((req, res, next) => {
  const corsWhitelist = [
    "http://localhost:3000",
    "http://77.85.14.6:3000",
    "https://domain3.example",
  ];
  if (corsWhitelist.indexOf(req.headers.origin) !== -1) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
  }

  next();
});
mongoose
  .connect(process.env.MONGO_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    server.listen(port, () => {
      console.log("Running on port", port);
    })
  )
  .catch((err) => console.log(err));

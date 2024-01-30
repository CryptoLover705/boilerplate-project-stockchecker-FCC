"use strict";

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

const apiRoutes = require("./routes/api.js");
const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner");


const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Enable helmet middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
  }),
);

// Serve static files
app.use("/public", express.static(process.cwd() + "/public"));

// Enable CORS
app.use(cors({ origin: "*" }));

// Parse JSON and urlencoded request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route for the root path
app.route("/").get(function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// FreeCodeCamp testing routes
fccTestingRoutes(app);

// API routes
apiRoutes(app);

// 404 error handler
app.use(function (req, res, next) {
  res.status(404).type("text").send("Not Found");
});

// Server listening
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
  if (process.env.NODE_ENV === "test") {
    console.log("Running Tests...");
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
        console.log("Tests are not valid:");
        console.error(e);
      }
    }, 3500);
  }
});


module.exports = app;

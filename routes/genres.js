const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { validateGenre, Genre } = require("../models/genre");
// wrapper function to wrap whole callback in a try/catch block
const trycatch = require("../middleware/try-catch");
// get JWT and set headers appropriately
const auth = require("../middleware/auth");
// validate request body
const validate = require("../middleware/validate");
// check if user is admin
const admin = require("../middleware/admin");

////// CONFIGURATION SETTINGS ////////
const validateData = validateGenre;
const Data = Genre;
const searchType = "_id";
/////////////////////////////////////

// GOOD ENDPOINTS
//    GET    /
//    POST   /
//    GET    /:genreId
//    PUT    /:genreId
// BAD ENDPOINTS
//    PUT    /
//    DELETE /
//    POST   /:genreId
//    DELETE /:genreId

// test rejected promise
router.get("/rejectedPromise", async (request, response, next) => {
  return Promise.reject(new Error("promise rejected"));
});

// test thrown error
router.get(
  "/throwError",
  trycatch(async (request, response, next) => {
    throw new Error("error thrown");
  })
);

// get entire dataset
router.get(
  "/",
  trycatch(async (request, response, next) => {
    // contact database
    const dataset = await Data.find();

    // send data back to client
    return response.send(dataset);
  })
);

// post to dataset (requires a token, validate body)
router.post(
  "/",
  [auth, validate(validateData)],
  trycatch(async (request, response) => {
    const body = request.body;

    // create new object to send to DB
    let data = new Data(body);

    // send data to DB, record the response to send back to client
    data = await data.save();

    // send data back to client
    response.send(data);
  })
);

// get individual entry
router.get(
  "/:entry",
  trycatch(async (request, response) => {
    let { entry } = request.params;

    // contact datbase and look for entry
    const data = await Data.findOne({
      [searchType]: entry,
    });

    // if data set is valid but entry is not found
    if (!data || data.length === 0)
      return response.status(404).send(`Error 404: Entry Not Found`);
    // send data!
    else response.send(data);
  })
);

// Update a single genre (requires a token & ADMIN ONLY, validate body)
router.put(
  "/:entry",
  [auth, admin, validate(validateData)],
  trycatch(async (request, response) => {
    let data = request.body;
    const { entry } = request.params;

    // try to contact DB
    const foundData = await Data.findOne({
      [searchType]: entry,
    });
    if (!foundData)
      return response.status(404).send(`Error 404: Entry Not Found.`);

    // set properties to those found in body of request
    Object.keys(foundData.toObject()).forEach((prop) => {
      // only set property if it was defined in body
      if (data[prop]) {
        foundData[prop] = data[prop];
      }
    });

    // contact DB to update item
    data = await foundData.save();

    // send original object back
    response.send(data);
  })
);

// BAD API CALLS
router.put("/", (request, response) => {
  return response.status(400).send("Error 400: Cannot Update Entire Dataset");
});
router.delete("/", (request, response) => {
  return response.status(400).send(`Error 400: Cannot Delete Entire Dataset`);
});
router.post("/:entry", (request, response) => {
  return response.status(400).send("Error 400: Cannot Post Data To An Entry");
});
router.delete("/:entry", async (request, response) => {
  return response
    .status(400)
    .send("Error 400: Genre Cannot Be Deleted Once Created");
});

module.exports = router;

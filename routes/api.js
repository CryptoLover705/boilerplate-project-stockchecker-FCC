'use strict';

const axios = require("axios");
const bcrypt = require("bcrypt");
const bcryptPassword = process.env['bcrypt_password']


let dummyDatabase = [];
const hashSetings = {
  saltRounds: 12,
}

const stockPriceCheckerUrl = symbol => `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;

const saveInDataBase = (item) => {
  dummyDatabase.push(item);
};

const updateDataBaseByIp = (item, ipAddress, like) => {
  const indexItemFound = dummyDatabase
    .findIndex((storedItem) =>
      bcrypt.compareSync(ipAddress, storedItem.ipAdressHash) &&
      storedItem.stock === item.stock);

  if (indexItemFound >= 0) {
    dummyDatabase[indexItemFound].stock = item.stock;
    dummyDatabase[indexItemFound].price = item.price;
    dummyDatabase[indexItemFound].ipAdressHash = item.ipAdressHash;

    if (dummyDatabase[indexItemFound].likes > 0) {
      if (like) {
        dummyDatabase[indexItemFound].likes += 1;
      } else {
        dummyDatabase[indexItemFound].likes -= 1;
      }
    }
  }
};

const existInDataBase = (ipAddress, stockName) => {
  return dummyDatabase
    .some(item =>
      bcrypt.compareSync(ipAddress, item.ipAdressHash) && item.stock === stockName);
};

const responseWithErrorMessage = (response) => {
  response
    .status(404)
    .type("text")
    .send("Not Found");
};

const getStockData = () => {
  let stockData = [];

  if (dummyDatabase.length == 1) {

    stockData = dummyDatabase.map(
      ({ stock, price, likes }) => ({ stock, price, likes })
    );
    stockData = stockData[0];

  } else if (dummyDatabase.length > 1) {

    stockData = dummyDatabase.map(
      ({ stock, price }, index) =>
        ({ stock, price, ...(index === 0 ? { rel_likes: -1043 } : { rel_likes: 1043 }) })
    );

  }
  dummyDatabase = [];
  return stockData;
};

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (request, response){

      let stockName = request.query.stock ? request.query.stock : null;
      let like = request.query.like ? request.query.like : null;
      const ipAddress = request.ip ? request.ip : null;

      if (stockName === null && like === null) {
        return responseWithErrorMessage(response);
      }

      if (!Array.isArray(stockName)) {
        stockName = [stockName]
      }

      for (const stock of stockName) {
        let apiResponse = await axios.get(stockPriceCheckerUrl(stock))
          .then(response => response.data);

        like = like === "true" ? true : false;

        if (existInDataBase(ipAddress, stock)) {
          const item = {
            stock: apiResponse.symbol,
            price: apiResponse.latestPrice,
            likes: like,
            ipAdressHash: bcrypt.hashSync(ipAddress, hashSetings.saltRounds),
          };
          updateDataBaseByIp(item, ipAddress, like);
        } else {
          saveInDataBase({
            stock: apiResponse.symbol,
            price: apiResponse.latestPrice,
            likes: like ? 1 : 0,
            ipAdressHash: bcrypt.hashSync(ipAddress, hashSetings.saltRounds),
          });
        }
      }

      response.status(200).json({ stockData: getStockData() });
    });
};

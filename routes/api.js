"use strict";

const https = require("https");
const Stock = require("../models/stock");

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;
    const multipleStocks = Array.isArray(stock);

    // Validate query parameters
    if (!stock || (multipleStocks && stock.length !== 2)) {
      return res.json({
        error: "Two stock symbols are required for comparison",
      });
    }

    // Fetch stock data from the proxy API
    const apiUrl = Array.isArray(stock)
      ? `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock.join(
          ",",
        )}/quote`
      : `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;

    try {
      const response = await fetchData(apiUrl);
      let stockData;

      try {
        stockData = JSON.parse(response);
      } catch (parseError) {
        //console.error("Error parsing stock data:", parseError);
        return res.json({ error: "Error parsing stock data" });
      }

      // Log stockData for debugging purposes
      //console.log("Received stockData:", stockData);

      // Check for invalid stock symbol
      if (Array.isArray(stock)) {
        const invalidSymbol = stock.find(
          (s) => stockData[s] && stockData[s].hasOwnProperty("Invalid symbol"),
        );
        if (invalidSymbol) {
          return res.json({ error: "Invalid stock symbol", invalidSymbol });
        }
      } else if (stockData.hasOwnProperty("Invalid symbol")) {
        return res.json({
          error: "Invalid stock symbol",
          invalidSymbol: stock,
        });
      }

      // Update likes based on the 'like' query parameter
      let likes = 0;
      if (like) {
        // Anonymize IP address (you may use a library for this)
        const hashedIP = anonymizeIPAddress(req.ip);

        // Check if IP already liked any of the stocks
        const existingLikes = await Stock.find({
          stock: { $in: stock },
          ip: hashedIP,
        });

        // If not, increment likes for each stock and save IP to database
        if (!existingLikes.length) {
          likes += 1;
          await Stock.create(
            stock.map((symbol) => ({ stock: symbol, ip: hashedIP })),
          );
        }
      }

      // Prepare stock data response
      let responseData;
      if (multipleStocks) {
        const [stock1, stock2] = stock;
        const relLikes = stockData[stock1]?.likes - stockData[stock2]?.likes;

        const stockDataArray = stock.map((symbol) => ({
          stock: symbol,
          price: stockData[symbol]?.latestPrice, // Update this line
          rel_likes: relLikes,
        }));

        responseData = { stockData: stockDataArray };
      } else {
        const symbol = stock; // Single stock
        responseData = {
          stockData: {
            stock: symbol,
            price: stockData?.latestPrice, // Update this line
            likes: likes,
          },
        };
      }

      // Log responseData for debugging purposes
      //console.log("Response data:", responseData);

      // Send the response
      res.json(responseData);
    } catch (error) {
      //console.error("Error fetching stock data:", error);
      res.json({ error: "Error fetching stock data" });
    }
  });
};

function anonymizeIPAddress(ip) {
  // Implement IP anonymization logic (e.g., hashing, truncating, or setting part to 0)
  // This is a placeholder; use a proper library or method for anonymization
  return ip;
}

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        // A chunk of data has been received.
        response.on("data", (chunk) => {
          data += chunk;
        });

        // The whole response has been received.
        response.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

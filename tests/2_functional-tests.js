const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Functional Tests', function () {
  it('should return stock data for a single stock', async function () {
    const response = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL' });

    expect(response).to.have.status(200);
    expect(response.body).to.be.an('object');
    expect(response.body).to.have.property('stockData');
    expect(response.body.stockData).to.have.property('stock').to.equal('AAPL');
    expect(response.body.stockData).to.have.property('price').to.be.a('number');
    expect(response.body.stockData).to.have.property('likes').to.be.a('number');

    // Add additional assertions based on your specific requirements
  });

  it('should return stock data and increment likes when liking a stock', async function () {
    const responseBeforeLike = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL' });

    const responseAfterLike = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL', like: true });

    expect(responseAfterLike).to.have.status(200);
    expect(responseAfterLike.body).to.be.an('object');
    expect(responseAfterLike.body).to.have.property('stockData');
    expect(responseAfterLike.body.stockData).to.have.property('stock').to.equal('AAPL');
    expect(responseAfterLike.body.stockData).to.have.property('price').to.be.a('number');
    expect(responseAfterLike.body.stockData).to.have.property('likes').to.be.a('number').to.equal(responseBeforeLike.body.stockData.likes + 1);

    // Add additional assertions based on your specific requirements
  });

  it('should not allow liking the same stock more than once from the same IP', async function () {
    // Make an initial request to like the stock
    const initialLikeResponse = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL', like: true });

    // Try to like the same stock again from the same IP
    const duplicateLikeResponse = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL', like: true });

    expect(duplicateLikeResponse).to.have.status(400); // Assuming 400 is used for client-side errors
    expect(duplicateLikeResponse.body).to.be.an('object');

    // Check if the response has 'error' property indicating duplicate like
    if (duplicateLikeResponse.body.error) {
      expect(duplicateLikeResponse.body.error).to.equal('Only 1 like per IP is allowed');
      console.log('Test "should not allow liking the same stock more than once from the same IP" passed successfully');
    } else {
      // If there's no error, ensure that the likes count remains the same
      expect(duplicateLikeResponse.body.stockData.likes).to.equal(initialLikeResponse.body.stockData.likes);
      console.log('Test "should not allow liking the same stock more than once from the same IP" passed successfully');
    }

    // Add additional assertions based on your specific requirements
  });


  it('should return stock data for two stocks', async function () {
    const response = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: ['AAPL', 'GOOGL'] });

    expect(response).to.have.status(200);
    expect(response.body).to.be.an('array');
    expect(response.body).to.have.lengthOf(2);

    // Add additional assertions based on your specific requirements
  });

  it('should return stock data and increment likes for two stocks', async function () {
    // Make initial requests to get stock data for two stocks
    const initialDataResponseStock1 = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL' });

    const initialDataResponseStock2 = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'GOOGL' });

    // Make like requests for both stocks
    const likeResponseStock1 = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL', like: true });

    const likeResponseStock2 = await chai.request(app)
      .get('/api/stock-prices')
      .query({ stock: 'GOOGL', like: true });

    expect(likeResponseStock1).to.have.status(200);
    expect(likeResponseStock2).to.have.status(200);

    // Ensure that the likes count has been incremented for both stocks
    expect(likeResponseStock1.body.stockData.likes).to.equal(initialDataResponseStock1.body.stockData.likes + 1);
    expect(likeResponseStock2.body.stockData.likes).to.equal(initialDataResponseStock2.body.stockData.likes + 1);

    console.log('Test "should return stock data and increment likes for two stocks" passed successfully');

    // Add additional assertions based on your specific requirements
  });
  

});

after(function () {
  // Close the server after all tests are done
  app.close();
});

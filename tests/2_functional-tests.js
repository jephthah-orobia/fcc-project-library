/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const book = require('../data/models/book');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  /* test('#example Test GET /api/books', function (done) {
    chai.request(server)
      .get('/api/books')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  }); */
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function () {

    const newBookKeys = ['_id', 'title'];
    const bookKeys = ['comments', '_id', 'title', 'commentcount'];

    const book1 = {
      title: "Book 1",
      _id: null,

      /**
       * @description fires when a property changes.
       * @param {String} propertyName the name of property of this object that changed.
       */
      onChange: [],
      /**
       * @description sets the ObjectId in string format
       * @param {mongoose.Schema.Types.ObjectId} newId
      */
      set id(newId) {
        this._id = newId;
        for (let cb in this.onChange)
          cb('id');
      },

      /**
      * @returns the ObjectId in string format
      */
      get id() {
        return this._id;
      }
    };


    suite('POST /api/books with title => create book object/expect book object', function () {
      test('Test POST /api/books with title', function (done) {
        chai.request(server)
          .post('/api/books')
          .send({ title: book1.title })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.hasAllKeys(res.body, newBookKeys);
            assert.propertyVal(res.body, 'title', book1.title);
            book1.id = res.body._id;
            done();
          });
      });

      test('Test POST /api/books with no title given', function (done) {
        chai.request(server)
          .post('/api/books')
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required field title');
            done();
          });
      });

    });

    suite('GET /api/books => array of books', function () {

      test('Test GET /api/books', function (done) {
        chai.request(server)
          .get('/api/books')
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtLeast(res.body.length, 1);
            for (let i in res.body)
              assert.hasAllKeys(res.body[i], bookKeys);
            done();
          });
      });

    });

    suite('GET /api/books/[id] => book object with [id]', function () {

      test('Test GET /api/books/[id] with id not in db', function (done) {
        chai.request(server)
          .get('/api/books/' + Math.round(Math.random() * 100000000000000))
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });

      test('Test GET /api/books/[id] with valid id in db', function (done) {
        const runTest = (changedProperty) =>
          changedProperty == 'id' && chai.request(server)
            .get('/api/books/' + book1.id)
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body);
              assert.hasAllKeys(res.body, bookKeys);
              assert.equal(res.body.title, book1.title);
              assert.equal(res.body._id, book1.id);
              done();
            });

        if (!book.id)
          runTest('id');
        else
          book1.onChange.push(runTest);
      });

    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function () {

      test('Test POST /api/books/[id] with comment', function (done) {
        const runTest = (propertyName) =>
          propertyName == 'id' && chai.request(server)
            .post('/api/books/' + book1.id)
            .send({ comment: 'Test comment' })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.hasAllKeys(res.body, bookKeys);
              assert.equal(res.body.title, book1.title);
              assert.equal(res.body._id, book1.id);
              assert.equal(res.body.commentcount, 1);
              assert.isArray(res.body.comments);
              assert.equal(res.body.comments[0], 'Test comment');
              done();
            });

        if (book1.id)
          runTest('id');
        else
          book1.onChange.push(runTest);
      });

      test('Test POST /api/books/[id] without comment field', function (done) {
        const runTest = (propertyName = 'id') =>
          propertyName == 'id' && chai.request(server)
            .post('/api/books/' + book1.id)
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'missing required field comment');
              done();
            });
        if (book1.id)
          runTest();
        else
          book1.onChange.push(runTest);
      });

      test('Test POST /api/books/[id] with comment, id not in db', function (done) {
        chai.request(server)
          .post('/api/books/asbacag123easdba')
          .send({ comment: 'Some comment' })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });

    });

    suite('DELETE /api/books/[id] => delete book object id', function () {

      test('Test DELETE /api/books/[id] with valid id in db', function (done) {
        chai.request(server)
          .delete('/api/books/' + book1._id)
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'delete successful');
            done();
          });
      });

      test('Test DELETE /api/books/[id] with  id not in db', function (done) {
        chai.request(server)
          .delete('/api/books/aasddava1s6d212a3')
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });

      test('DELETE /api/books => delete ALL books', function (done) {
        chai.request(server)
          .delete('/api/books')
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'complete delete successful');
            done();
          });
      });
    });


  });

});

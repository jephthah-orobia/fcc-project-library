/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const { Error } = require("mongoose");
const book = require("../data/models/book");
const user = require("../data/models/user");

const { setDebugging, log, logEr, logRequest, logParams, logBody } = require('../log-utils');

setDebugging(process.env.DEBUG == 'yes');

// middleware to be use to set req.user
const setReqUser = (req, res, next) => {
  // since it's a "personal library", then each collection of books should by user
  // here, user will be identified by ipaddress
  const findUser = (done) => user.findOne({ ip: req.ip })
    .populate('books')
    .exec(done);

  const createUser = (done) => new user({ ip: req.ip })
    .save(done);

  const init = () => findUser((err, userDoc) => {
    if (err)
      res.send(err + '');
    else if (!userDoc)
      createUser((err, newUser) => {
        if (err)
          res.send(err + '');
        else
          init();
      });
    else {
      req.user = userDoc;
      next();
    }
  });

  init();
};

module.exports = function (app) {

  app.use('/api/books', logRequest, setReqUser);

  app.route('/api/books')

    .get(function (req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      res.json(req.user.books);
    })

    .post(
      logBody,

      //create book doc in db, if successful, set the doc to req.newBook
      (req, res, next) => {
        let title = req.body.title;
        //response will contain new book object including atleast _id and title
        if (!title || title == '')
          res.send("missing required field title");
        else
          (new book({ title: title })).save((err, newBook) => {
            if (err && err instanceof Error.ValidationError)
              res.send("missing required field title");
            else if (err)
              res.send(err + '');
            else {
              req.newBook = newBook;
              next();
            }
          });
      },

      // add new book to list of books in req.user then save.
      // if there are errors in added save the user doc, rollback the req.newBook.
      (req, res) => {
        req.user.books.unshift(req.newBook._id);
        req.user.save((err) => {
          if (err) {
            // if user docs is not successfully saved, then delete the created book.
            req.newBook.remove()
              .then(() =>
                res.send(err + '')
              ).catch(e =>
                res.send(err + '\n' + e)
              );
          }
          else
            res.json({ _id: req.newBook._id, title: req.newBook.title });
        });
      }
    )

    .delete(function (req, res) {
      //if successful response will be 'complete delete successful'
      book.deleteMany({ _id: { $in: req.user.books } }).then(data => {
        if (data.deletedCount == req.user.books.length) {
          req.user.set('books', []);
          req.user.save((err) => {
            if (err)
              res.send(err + '');
            else
              res.send('complete delete successful');
          });
        } else {
          res.send("Not all were deleted");
        }

      });
    });



  app.use('/api/books/:id', logRequest, setReqUser);
  app.route('/api/books/:id')

    .get(logParams,
      function (req, res) {
        let bookid = req.params.id;
        //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
        let books = req.user.books.filter(elem => elem._id == bookid);
        if (books.length == 1)
          res.json(books[0]);
        else
          res.send('no book exists');
      })

    .post(logParams, logBody, function (req, res) {
      let bookid = req.params.id;
      let comment = req.body.comment;
      if (!comment) {
        logEr('<< missing required field comment');
        res.send('missing required field comment');
      }

      let books = req.user.books.filter(elem => elem._id == bookid);

      if (books.length == 1) {
        books[0].comments.unshift(comment);
        books[0].save(err => {
          if (err) {
            logEr('<< ' + err);
            res.send(err + '');
          }
          else {
            logEr(JSON.stringify(books[0]));
            res.json(books[0]);
          }
        });
      }
      else {
        logEr('<< no book exists');
        res.send('no book exists');
      }

    })

    .delete(logParams, logBody, function (req, res) {
      let bookid = req.params.id;
      //if successful response will be 'delete successful'

      let books = req.user.books.filter(elem => elem._id == bookid);

      if (books.length == 1) {
        books[0].remove(err => {
          if (err) {
            logEr('<<' + err);
            res.send(err + '');
          }
          else {
            req.user.set('books', req.user.books.filter(elem => elem._id != bookid))
            req.user.save(err => {
              if (err) {
                logEr('<< ' + err);
                res.send(err + '');
              }
              else {
                log('<< delete successful');
                res.send('delete successful')
              }
            });
          }
        });
      }
      else {
        logEr('<< no book exists');
        res.send('no book exists');
      }
    });

};

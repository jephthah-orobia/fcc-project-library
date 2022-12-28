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

const { setDebugging, log, logRequest, logParams, logQuery, logBody } = require('../log-utils');

setDebugging(process.env.DEBUG == 'yes');

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

  app.route('/api/books')


    .get(setReqUser,
      function (req, res) {
        //response will be array of book objects
        //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
        res.json(req.user.books);
      })

    .post(
      logBody,
      setReqUser,

      //create book doc in db, if successful, set the doc to req.newBook
      (req, res, next) => {
        let title = req.body.title;
        log("this is the value of title:", title);
        log("this is the value of !title:", !title);
        //response will contain new book object including atleast _id and title
        if (!title || title == '') {
          log("sending error message:")
          res.send("missing required field title");
        }
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

    .delete(setReqUser, function (req, res) {
      //if successful response will be 'complete delete successful'
      book.deleteMany({ _id: { $in: req.user.books } }).then(data => {
        if (data.deletedCount == req.user.boooks.length) {
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



  app.route('/api/books/:id')

    .get(setReqUser, function (req, res) {
      let bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      let books = req.user.books.filter(elem => elem._id == bookid);
      if (books.length == 1)
        res.json(books[0]);
      else
        res.send('no book exists');
    })

    .post(setReqUser, function (req, res) {
      let bookid = req.params.id;
      let comment = req.body.comment;
      if (!comment)
        res.send('missing required field comment');

      let books = req.user.books.filter(elem => elem._id == bookid);

      if (books.length == 1) {
        books[0].comments.unshift(comment);
        books[0].save(err => {
          if (err)
            res.send(err + '');
          else
            res.json(books);
        });
      }
      else
        res.send('no books exists');

    })

    .delete(setReqUser, function (req, res) {
      let bookid = req.params.id;
      //if successful response will be 'delete successful'


      let books = req.user.books.filter(elem => elem._id == bookid);

      if (books.length == 1) {
        books[0].remove(err => {
          if (err)
            res.send(err + '');
          else {
            req.user.set('books', req.user.books.filter(elem => elem._id != bookid))
            req.user.save(err => {
              if (err)
                res.send(err + '');
              else
                res.send('delete successful')
            });
          }
        });
      }
      else
        res.send('no book exists');
    });

};

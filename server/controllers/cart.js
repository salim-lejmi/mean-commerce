const CART = require('mongoose').model('Cart');
const BOOK = require('mongoose').model('Book');
const RECEIPT = require('mongoose').model('Receipt');
const USER = require('mongoose').model('User');

module.exports = {
    getCartSize: (req, res) => {
        let userId = req.user.id;
        CART.findOne({ user: userId }).then((cart) => {
            res.status(200).json({
                message: '',
                data: cart.books.length
            });
        });
    },

    getCart: (req, res) => {
        let userId = req.user.id;

        CART.findOne({ user: userId })
            .populate('books')
            .then((cart) => {
                res.status(200).json({
                    message: '',
                    data: cart
                });
            });
    },

    addToCart: (req, res) => {
        let userId = req.user.id;
        let bookId = req.params.bookId;

        BOOK.findById(bookId).then((book) => {
            if (!book) {
                return res.status(400).json({
                    message: 'There is no book with the given id in our database.'
                });
            }

            CART.findOne({ user: userId }).then((cart) => {
                let bookIds = [];

                for (let b of cart.books) {
                    bookIds.push(b.toString());
                }

                if (bookIds.indexOf(bookId) !== -1) {
                    return res.status(400).json({
                        message: 'Book is already in your cart'
                    });
                }

                cart.books.push(bookId);
                cart.totalPrice += book.price;
                cart.save();

                res.status(200).json({
                    message: 'Book added to cart!',
                    data: cart
                });
            });
        }).catch((err) => {
            console.log(err);
            return res.status(400).json({
                message: 'Something went wrong, please try again.'
            });
        });
    },

    removeFromCart: (req, res) => {
        let userId = req.user.id;
        let bookId = req.params.bookId;

        BOOK.findById(bookId).then((book) => {
            if (!book) {
                return res.status(400).json({
                    message: 'There is no book with the given id in our database.'
                });
            }

            CART.findOne({ user: userId }).then((cart) => {
                cart.books = cart.books
                    .map(b => b.toString())
                    .filter(b => b !== bookId);
                cart.totalPrice -= book.price;
                cart.save();

                res.status(200).json({
                    message: 'Book removed from cart!',
                    data: cart
                });
            });
        }).catch((err) => {
            console.log(err);
            return res.status(400).json({
                message: 'Something went wrong, please try again.'
            });
        });
    },

    checkout: (req, res) => {
        let userId = req.user.id;
        let totalPrice = 0;
        let products = [];
        const usePoints = req.body.usePoints;
      
        CART.findOne({ user: userId })
            .populate('books')
            .then((cart) => {
                for (let book of cart.books) {
                    totalPrice += book.price * req.body[book._id.toString()];
                    products.push({
                      id: book._id,
                      title: book.title,
                      author: book.author,
                      cover: book.cover,
                      price: book.price,
                      qty: req.body[book._id.toString()],
                      url: book.url // Include the 'url' property
                    });
                }
      
                // Fetch user to check if they have enough wallet or points
                USER.findOne({ _id: userId })
                    .then((user) => {
                      if (!user) {
                          return res.status(400).json({
                              message: 'User not found'
                          });
                      } else if (usePoints && user.points < totalPrice / 3) {
                          return res.status(400).json({
                              message: 'You don\'t have enough points'
                          });
                      } else if (!usePoints && user.wallet < totalPrice) {
                          return res.status(400).json({
                              message: 'You don\'t have enough money'
                          });
                      } else {
                          // If the user has enough wallet or points, proceed with the transaction
                          USER.findOneAndUpdate(
                              { _id: userId },
                              { $inc: { wallet: usePoints ? 0 : -totalPrice, points: usePoints ? -totalPrice / 3 : 0 } },
                              { new: true, runValidators: true }
                          )
                          .then((user) => {
                             if (!user) {
                                 return res.status(400).json({
                                     message: 'User not found'
                                 });
                             } else if (user.wallet < 0 && user.points < totalPrice / 3) {
                                 return res.status(400).json({
                                     message: 'You don\'t have enough money and points'
                                 });
                             } else {
                                 // Wallet updated successfully, proceed with creating receipt
                                 RECEIPT.create({
                                     user: userId,
                                     productsInfo: products,
                                     totalPrice: totalPrice
                                 })
                                 .then((receipt) => {
                                     // Update user with the receipt ID
                                     USER.updateOne(
                                       { _id: userId },
                                       { $push: { receipts: receipt._id } }
                                     )
                                     .then(() => {
                                        // Clear the cart
                                        cart.books = [];
                                        cart.totalPrice = 0;
                                        cart.save();
      
                                        return res.status(200).json({
                                            message: 'Thank you for your order! Books will be sent to you as soon as possible!',
                                            data: receipt
                                        });
                                     })
                                     .catch((err) => {
                                        console.log(err);
                                        return res.status(400).json({
                                            message: 'Something went wrong while updating user with receipt ID.'
                                        });
                                     });
                                 })
                                 .catch((err) => {
                                     console.log(err);
                                     return res.status(400).json({
                                        message: 'Something went wrong while creating the receipt.'
                                     });
                                 });
                             }
                          })
                          .catch((err) => {
                             console.log(err);
                             return res.status(400).json({
                                 message: 'Something went wrong while updating the user wallet and points.'
                             });
                          });
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                      return res.status(400).json({
                          message: 'Something went wrong while fetching the user.'
                      });
                    });
            })
            .catch((err) => {
                console.log(err);
                return res.status(400).json({
                    message: 'Something went wrong while fetching the cart.'
                });
            });
      }
      
     
    }
 
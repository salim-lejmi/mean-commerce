    const USER_CONTROLLER = require('../controllers/user');
    const BOOK_CONTROLLER = require('../controllers/book');
    const COMMENT_CONTROLLER = require('../controllers/comment');
    const CART_CONTROLLER = require('../controllers/cart');
    const ERROR_CONTROLLER = require('../controllers/error');
    const REPORT_CONTROLLER = require('../controllers/report');
    const AUTH = require('./auth');
    const multer = require('multer');
    const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Make sure this uploads directory exists
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
    });

    const upload = multer({ storage: storage });

    module.exports = (APP) => {
        APP.post('/user/register', USER_CONTROLLER.register);
        APP.post('/user/login', USER_CONTROLLER.login);
        APP.get('/user/profile/:username', AUTH.isAuth, USER_CONTROLLER.getProfile);
        APP.get('/user/purchaseHistory', AUTH.isAuth, USER_CONTROLLER.getPurchaseHistory);
        APP.post('/user/changeAvatar', AUTH.isAuth, USER_CONTROLLER.changeAvatar);
        APP.post('/user/blockComments/:userId', AUTH.isInRole('Admin'), USER_CONTROLLER.blockComments);
        APP.post('/user/unlockComments/:userId', AUTH.isInRole('Admin'), USER_CONTROLLER.unblockComments);
        APP.post('/user/buyPoints', USER_CONTROLLER.buyPoints);

        APP.get('/cart/getSize', AUTH.isAuth, CART_CONTROLLER.getCartSize);
        APP.get('/user/cart', AUTH.isAuth, CART_CONTROLLER.getCart);
        APP.post('/user/cart/add/:bookId', AUTH.isAuth, CART_CONTROLLER.addToCart);
        APP.delete('/user/cart/delete/:bookId', AUTH.isAuth, CART_CONTROLLER.removeFromCart);
        APP.post('/user/cart/checkout', AUTH.isAuth, CART_CONTROLLER.checkout);
        APP.get('/book/genre/:genre', BOOK_CONTROLLER.getByGenre);

        APP.get('/book/search', BOOK_CONTROLLER.search);
        APP.get('/book/details/:bookId', BOOK_CONTROLLER.getSingle);
        APP.post('/book/add', AUTH.isAuth, upload.single('url'), BOOK_CONTROLLER.add);
        APP.put('/book/edit/:bookId', AUTH.isInRole('Admin'), BOOK_CONTROLLER.edit);
        APP.delete('/book/delete/:bookId', AUTH.isInRole('Admin'), BOOK_CONTROLLER.delete);
        APP.post('/book/rate/:bookId', AUTH.isAuth, BOOK_CONTROLLER.rate);
        APP.post('/book/addToFavorites/:bookId', AUTH.isAuth, BOOK_CONTROLLER.addToFavorites);
        APP.get('/book/download/:bookId', BOOK_CONTROLLER.downloadBook);

        APP.get('/comment/getLatestFiveByUser/:userId', AUTH.isAuth, COMMENT_CONTROLLER.getLatestFiveByUser);
        APP.get('/comment/:bookId/:skipCount', COMMENT_CONTROLLER.getComments);
        APP.post('/comment/add/:bookId', AUTH.isAuth, COMMENT_CONTROLLER.add);
        APP.put('/comment/edit/:commentId', AUTH.isAuth, COMMENT_CONTROLLER.edit);
        APP.delete('/comment/delete/:commentId', AUTH.isAuth, COMMENT_CONTROLLER.delete);

    APP.post('/report/:commentId', AUTH.isAuth, REPORT_CONTROLLER.reportComment);
    APP.get('/report', AUTH.isInRole('Admin'), REPORT_CONTROLLER.getReports);

        APP.all('*', ERROR_CONTROLLER.error);
    };
const MONGOOSE = require('mongoose');

const ENCRYPTION = require('../utilities/encryption');
const STRING = MONGOOSE.Schema.Types.String;
const NUMBER = MONGOOSE.Schema.Types.Number;
const BOOLEAN = MONGOOSE.Schema.Types.Boolean;
const OBJECT_ID = MONGOOSE.Schema.Types.ObjectId;

const USER_SCHEMA = MONGOOSE.Schema({
    username: { type: STRING, required: true, unique: true },
    email: { type: STRING, required: true, unique: true },
    avatar: { type: STRING, default: 'https://i.imgur.com/4s5qLzU.png' },
    password: { type: STRING, required: true },
    wallet: { type: NUMBER, default: 1000 }, // default value is 1000
    points: { type: NUMBER, default: 0 }, // default value is 0
    salt: { type: STRING, required: true },
    isAdmin: { type: BOOLEAN, default: false },
    isCommentsBlocked: { type: BOOLEAN, default: false },
    commentsCount: { type: NUMBER, default: 0 },
    roles: [{ type: OBJECT_ID, ref: 'Role' }],
    cart: { type: OBJECT_ID, ref: 'Cart' },
    receipts: [{ type: OBJECT_ID, ref: 'Receipt' }],
    favoriteBooks: [{ type: OBJECT_ID, ref: 'Book' }]
});

USER_SCHEMA.method({
    authenticate: function (password) {
        let hashedPassword = ENCRYPTION.generateHashedPassword(this.salt, password);

        if (hashedPassword === this.password) {
            return true;
        }

        return false;
    }
});

const USER = MONGOOSE.model('User', USER_SCHEMA);

module.exports = USER;
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    ip: {
        type: String,
        required: true,
        unique: true
    },
    books: [{
        type: Schema.Types.ObjectId,
        ref: 'book'
    }]
},
    {
        collection: 'users',
        toJSON: { versionKey: false },
        toObject: { versionKey: false }
    });


module.exports = model('user', userSchema);
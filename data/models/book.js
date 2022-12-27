const { Schema, model } = require("mongoose");


const bookSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    comments: [String]
}, {
    collection: 'books',
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false }
});

bookSchema.virtual('commentcount').get(function () { return this.comments.length; });

module.exports = model('book', bookSchema);
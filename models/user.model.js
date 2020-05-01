const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        name: {
            type: String,
        },
        surname: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
        },
        password: {
            type: String,
        },
        dateReg: {
            type: Date,
            default: Date.now()
        },
        lastVisited: {
            type: [String],
            default: []
        },
        markedBooks: {
            type: [String],
            default: []
        },
        img: {
            type: String,
            default: ""
        },
        rated: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
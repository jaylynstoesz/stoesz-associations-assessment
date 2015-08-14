// var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/mm');
// mongoose.set('debug', true);
//
// var userSchema = new mongoose.Schema({
//   type: String,
//   name: String,
//   email: String,
//   password: String,
//   connections: Array,
//   meetings: Array
// })
//
// var meetingSchema = new mongoose.Schema({
//   date: Date,
//   creator: String,
//   invitee: String,
// })
//
// var User = mongoose.model("User", userSchema)
// var Meeting = mongoose.model("Meeting", meetingSchema)
//
// module.exports = {
//
//   uppercase: function (input) {
//     console.log("LIB FN:", input.toUpperCase());
//     return input.toUppercase;
//   },
//
//   findAllUsers: function () {
//     User.find({}).then(function (records) {
//       console.log("LIB FIND:", records);
//       return records
//     })
//   }
//
// };

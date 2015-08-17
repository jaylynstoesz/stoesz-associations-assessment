var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mm');
mongoose.set('debug', true);

var userSchema = new mongoose.Schema({
  type: String,
  name: String,
  email: String,
  password: String,
  connections: [String],
  meetings: [String]
})

var meetingSchema = new mongoose.Schema({
  date: Date,
  creator: String,
  invitee: String,
})

var User = mongoose.model("User", userSchema)
var Meeting = mongoose.model("Meeting", meetingSchema)

module.exports = {
  deleteAllUsers: function () {
    return User.remove({});
  },

  getAllRecords: function () {
    return User.find({}).then(function (result) {
      // console.log("ALL USERS:", result);
      return result
    })
  },

  dbLookupCreator: function (id) {
    return Meeting.find({creator: id}).then(function (results) {
      return results;
    })
  },

  dbLookupInvitee: function (id) {
    return Meeting.find({invitee: id}).then(function (results) {
      return results;
    })
  },

  getOneUser: function (id) {
    return User.findOne({_id: id}).then(function (result) {
      return result
    })
  },

  createNewUser: function (type, name, email, password) {
    return User.create(
      {
        type: type,
        name: name,
        email: email,
        password: password
      },
      function(err, user) {
        if (err) {
          console.log(err);
        } else {
          console.log("NEW USER CREATED:", user);
        }
      }
    );
  },

  getMeetingInfo: function (id) {
    var meetingObj = {}
    return Meeting.findOne({_id: id}).then(function (record) {
      meetingObj.date = record.date
      return User.findOne({_id: record.creator}).then(function (result) {
        meetingObj.creator = result.name
        meetingObj.creatorId = result._id
        return meetingObj
      }).then(function () {
        return User.findOne({_id: record.invitee}).then(function (result) {
          meetingObj.invitee = result.name
          meetingObj.inviteeId = result._id
          return meetingObj
        })
      }).then(function (result) {
        console.log("LIB MO:", meetingObj);
        return meetingObj
      })
    })
  },

  createNewMeeting: function (date, creatorId, inviteeId) {
    return Meeting.create(
      {
        date: date,
        creator: creatorId,
        invitee: inviteeId
      },
      function(err, meeting) {
        if (err) {
          console.log(err);
        } else {
          // newMeeting = meeting;
          console.log("NEW MEETING CREATED:", meeting);
        }
      }
    );
  },

  updateMeetings: function (id, newMeeting) {
    return User.findOne({_id: id}).then(function (record) {
      console.log("Record.meetings:", typeof record.meetings, record.meetings);
      console.log("new meeting:", newMeeting);
      var meetTemp = record.meetings;
      meetTemp.push(newMeeting);
      console.log("MEET TEMP:", meetTemp);
      return User.update({_id: id}, {$set: {meetings: meetTemp}})
      // return record.meetings.push(newMeeting);
    })
  },

  deleteAcct: function (id) {
    return User.remove({_id: id});
  },

  login: function (email, password) {
    var validate = {}
    validate.user = true;
    validate.password = true;
    return User.findOne({email: email}).then(function(user){
      console.log(user);
      validate.id = user._id
      validate.name = user.name
      if (user === null) {
        validate.user = false;
      } else if (password !== user.password) {
        validate.password = false;
      }
      console.log("LIB VAL:", validate);
      return validate
    })
  }

}

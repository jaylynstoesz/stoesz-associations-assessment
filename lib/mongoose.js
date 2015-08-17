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
  date: String,
  creator: String,
  invitee: String,
  topic: String
})

var User = mongoose.model("User", userSchema)
var Meeting = mongoose.model("Meeting", meetingSchema)

module.exports = {
  connect: function (id, connId) {
    return User.findOne({_id: id}).then(function (record) {
      var connTemp = record.connections;
      connTemp.push(connId);
      return User.update({_id: id}, {$set: {connections: connTemp}})
    })
  },

  createNewMeeting: function (date, creatorId, inviteeId, topic) {
    return Meeting.create(
      {
        date: date,
        creator: creatorId,
        invitee: inviteeId,
        topic: topic
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

  deleteAcct: function (id) {
    return User.remove({_id: id});
  },

  deleteAllUsers: function () {
    return User.remove({});
  },

  deleteAllMeetings: function () {
    return Meeting.remove({});
  },

  deleteMeeting: function (id) {
    return Meeting.remove({_id: id});
  },

  disconnect: function (id, connId) {
    return User.findOne({_id: id}).then(function (record) {
      var connTemp = []
      record.connections.forEach(function (connection) {
        if (connection !== connId) {
          connTemp.push(connection)
        }
      })
      return User.update({_id: record.id}, {$set: {connections: connTemp}})
    })
  },

  getAllMeetings: function () {
    return Meeting.find({}).then(function (result) {
      console.log("ALL Meetings:", result);
      return result
    })
  },

  getAllRecords: function () {
    return User.find({}).then(function (result) {
      console.log("ALL USERS:", result);
      return result
    })
  },

  getMeetingInfo: function (id) {
    var meetingObj = {}
    return Meeting.findOne({_id: id}).then(function (record) {
      meetingObj.date = record.date
      meetingObj._id = record._id
      meetingObj.topic = record.topic
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
        // console.log("LIB MO:", meetingObj);
        return meetingObj
      })
    })
  },

  getOneUser: function (id) {
    return User.findOne({_id: id}).then(function (result) {
      return result
    })
  },

  login: function (email, password) {
    var validate = {}
    validate.user = true;
    validate.password = true;
    return User.findOne({email: email}).then(function(user){
      if (user !== null) {
        validate.id = user._id
        validate.name = user.name
        if (password !== user.password) {
          validate.password = false;
        }
      } else {
        validate.user = false;
      }
      return validate
    })
  },
  
  join: function (id) {
    return User.findOne({_id: id}).then(function (record) {
      return Promise.all(record.connections.map(function (connection) {
        // get info about each of the user's connections
        return User.findOne({_id: connection}).then(function (res) {
          var conObj = {}
          conObj.name = res.name
          conObj._id = res._id
          conObj.meetings = []
          // get meeting info as an object for each connection's meetings
          return Promise.all(res.meetings.map(function (meeting) {
            return Meeting.findOne({_id: meeting}).then(function (result) {
              for (var i = 0; i < record.meetings.length; i++) {
                if (record.meetings[i] == result._id) {
                  conObj.meetings.push(result)
                }
              }
              // console.log("result", result);
              return result
            })
          })).then(function (result) {
            return conObj
          })
        })
      })).then(function (result) {
        return result
      })
    }).then(function (result) {
      return result
    })
  },

  removeMeeting: function (id, meetingId) {
    return User.findOne({_id: id}).then(function (record) {
      console.log("TO BE DELETED:", meetingId);
      console.log("CURRENT MEETINGS:", record.meetings);
      var meetTemp = []
      record.meetings.forEach(function (meeting) {
        console.log(meeting);
        if (meeting !== meetingId) {
          console.log("MATCH");
          meetTemp.push(meeting)
        }
      })
      console.log("LIB MEETINGS LIST:", meetTemp);
      return User.update({_id: record.id}, {$set: {meetings: meetTemp}})
    })
  },

  updateMeetings: function (id, newMeeting) {
    return User.findOne({_id: id}).then(function (record) {
      var meetTemp = record.meetings;
      meetTemp.push(newMeeting);
      return User.update({_id: id}, {$set: {meetings: meetTemp}})
      // return record.meetings.push(newMeeting);
    })
  },

  updateThisMeeting: function (id, topic, date) {
    return Meeting.update({_id: id}, {$set: {topic: topic, date: date}})
  }

}

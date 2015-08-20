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
    function connectUsers (a, b) {
      return User.findOne({_id: a}).then(function (record) {
        var connTemp = record.connections;
        connTemp.push(b);
        return User.update({_id: a}, {$set: {connections: connTemp}})
      })
    }
    connectUsers(id, connId)
    connectUsers(connId, id)
  },

  createNewMeeting: function (date, creatorId, inviteeId, topic) {
    return Meeting.create(
      {
        date: date,
        creator: creatorId,
        invitee: inviteeId,
        topic: topic,
      },
      function(err, meeting) {
        if (err) {
          console.log(err);
        } else {
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

  deleteAcct: function (id) {
    return User.remove({_id: id}).then(function (results) {
      return results
    })
  },

  deleteAllUsers: function () {
    return User.remove({}).then(function (results) {
      return results
    })
  },

  deleteAllMeetings: function () {
    return Meeting.remove({}).then(function (results) {
      return results
    })
  },

  disconnect: function (id, connId) {
    function disconnectUsers(a, b) {
      return User.findOne({_id: a}).then(function (record) {
        var connTemp = record.connections.filter(function (connection) {
          return connection !== b
        })
        return User.update({_id: record._id}, {$set: {connections: connTemp}})
      })
    }
    disconnectUsers(id, connId)
    disconnectUsers(connId, id)
  },

  getAllMeetings: function () {
    return Meeting.find({}).then(function (result) {
      console.log("ALL Meetings:", result);
      return result
    })
  },

  getAllRecords: function () {
    return User.find({})
  },

  getMeetingInfo: function (id) {
    function getInfo (record, attribute, obj) {
      var findThis = record[attribute]
      return User.findOne({_id: findThis}).then(function (result) {
        obj[attribute] = result.name
        obj[attribute + "Id"] = result._id
        return obj
      })
    }

    return Meeting.findOne({_id: id}).then(function (record) {
      var meetingObj = {}
      meetingObj.date = record.date
      meetingObj._id = record._id
      meetingObj.topic = record.topic
      return getInfo(record, "creator", meetingObj).then(function (meetingObj) {
        return getInfo(record, "invitee", meetingObj)
      })
    })
  },

  getOneUser: function (id) {
    return User.findOne({_id: id})
  },

  getUserProfile: function (profileId, userId) {
    var that = this
    return that.getOneUser(profileId).then(function (record) {
      var profile = {}
      profile.connections = record.connections
      profile._id = record._id
      profile.type = record.type
      profile.name = record.name
      profile.email = record.email
      profile.meetings = record.meetings
      profile.connected = false
      profile.connections.forEach(function (connection) {
        if (connection === userId) {
          profile.connected = true
        }
      })
      return profile
    }).then(function (profile) {
      return Promise.all(profile.connections.map(function (connection) {
        return that.getOneUser(connection)
      })).then(function (connInfo) {
        profile.connectionsInfo = connInfo;
        return profile
      })
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

  findRelevant: function(obj, record) {
    return obj.meetTemp.filter(function (meetingId) {
      for (var i = 0; i < record.meetings.length; i++) {
        if (record.meetings[i] === meetingId) {
          return meetingId
        }
      }
    })
  },

  join: function (record) {
    var connPromises = record.connections.map(function (connection) {
      return User.findOne({_id: connection}).then(function (res) {
        var conObj = {}
        conObj.name = res.name
        conObj._id = res._id
        conObj.meetings = []
        conObj.meetTemp = res.meetings
        return conObj
      })
    })
    var that = this
    return Promise.all(connPromises).then(function (result) {
      result.forEach(function (conObj) {
        conObj.meetings = that.findRelevant(conObj, record)
      })
      return result
    }).then(function (objArray) {
      return Promise.all(objArray.map(function (obj) {
        return Promise.all(obj.meetings.map(function (anId) {
          return Meeting.findOne({_id: anId})
        })).then(function (meetingInfo) {
          obj.meetingInfo = meetingInfo
          return obj
        })
      }))
    })
  },

  removeMeeting: function (id, connId, meetingId) {
    function update(a, b) {
      return User.findOne({_id: a}).then(function (record) {
        var meetTemp = record.meetings.filter(function (meeting) {
          return meeting !== b
        })
        return User.update({_id: record._id}, {$set: {meetings: meetTemp}})
      })
    }
    update(id, meetingId)
    update(connId, meetingId)
    Meeting.remove({_id: meetingId}).then(function (results) {
      return results
    })
  },

  updateMeetings: function (id, connId, newMeeting) {
    function update(a, b) {
      return User.findOne({_id: a}).then(function (record) {
        var meetTemp = record.meetings;
        meetTemp.push(b);
        return User.update({_id: a}, {$set: {meetings: meetTemp}})
      })
    }
    update(id, newMeeting)
    update(connId, newMeeting)
  },

  updateThisMeeting: function (id, topic, date) {
    return Meeting.update({_id: id}, {$set: {topic: topic, date: date}})
  }

}

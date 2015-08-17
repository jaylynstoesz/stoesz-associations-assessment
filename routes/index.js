var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var lib = require('../lib/mongoose.js');

/* GET index page. */
router.get('/', function(req, res, next) {
  lib.getAllRecords().then(function () {
    res.render('index', { title: 'MentorMatter' });
  })
});

router.get('/deleteAll', function (req, res, next) {
  lib.deleteAllUsers().then(function () {
    lib.getAllRecords().then(function () {
      res.redirect('/');
    })
  })
});

router.get('/home', function(req, res, next) {
  // db.findAllUsers();
  var id = req.cookies.id
  var allUsers;
  lib.getAllRecords("User").then(function (allUsers) {

  var userMeetings
  return lib.getOneUser(id).then(function (user) {
    Promise.all(user.meetings.map(function (id) {
      return lib.getMeetingInfo(id)
    })).then(function (objs) {
      console.log("OBJS:", objs);
      console.log(user._id);
      objs.forEach(function (obj) {
        if (obj.creatorId.toString() === user._id.toString()) {
          obj.creator = "you"
        }
        if (obj.inviteeId.toString() === user._id.toString()) {
          obj.invitee = "you"
        }
      })
      console.log(objs);
      res.render('home', {id: user._id, name: user.name, connections: user.connections, meetings: objs, allUsers: allUsers})
    })
    console.log(user);

    // console.log("GETONEUSER RESULT:", user);


    // var meetingList = [];
    // var promiseArray = []
    // for (var i = 0; i < user.meetings.length; i++) {
    //   var subProm = []
    //   user.meetings[i].meetingObj = {}
    //   user.meetings[i].meetingObj.date = user.meetings[i].date
    //   subProm.push(User.findOne({_id: user.meetings[i].creator}))
    //   subProm.push(User.findOne({_id: user.meetings[i].invitee}))
    //   promiseArray.push(Promise.all(subProm))
    // }
    // Promise.all(promiseArray).then(function (data) {
    //   user.meetings.forEach(function (meeting, i) {
    //
    //     if (meeting.creator.toString() === user._id.toString()) {
    //       meeting.meetingObj.creator = "you"
    //     } else {
    //       meeting.meetingObj.creator = data[i][0].name
    //     }
    //
    //     if (meeting.invitee.toString() === user._id.toString()) {
    //       meeting.meetingObj.invitee = "you"
    //     } else {
    //       meeting.meetingObj.invitee = data[i][1].name
    //     }
    //
    //   })

      // console.log('meeting data!!!!', user.meetings)
      // console.log('allUsers!!!!', allUsers)
    })
  })
  // })

});

router.post('/create', function (req, res, next) {
  var type = req.body.type;
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  lib.createNewUser(type, name, email, password).then(function (newUser) {
    console.log("NEWUSER:", newUser);
    res.cookie('name', newUser.name)
    res.cookie('id', newUser._id)
    res.redirect('/home');
  });
});

router.post('/login', function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  lib.login(email, password).then(function (validate) {
    console.log("INDX VAL:", validate);
    if (!validate.user) {
      res.render('index', {msg: "User not found."})
    } else if (!validate.password) {
      res.render('index', {msg: "Password does not match."})
    } else {
      res.cookie('id', validate.id)
      res.cookie('name', validate.name)
      res.redirect('/home')
    }
  })
});

router.get('/logout', function (req, res, next) {
  res.clearCookie('id');
  res.clearCookie('name');
  res.redirect('/')
})

router.get('/deleteAcct', function (req, res, next) {
  lib.deleteAcct(req.cookies.id).then(function () {
    res.clearCookie('id');
    res.clearCookie('name');
    res.redirect('/');
  })
})

router.get('/profile/:id', function (req, res, next) {
  lib.dbLookupCreator(req.params.id).then(function (meetingDocs) {
    return lib.dbLookupInvitee(req.params.id).then(function (result) {
      return meetingDocs.concat(result)
    })
  }).then(function (allMeetings) {
    lib.getOneUser(req.params.id).then(function (record) {
      console.log("PROFILE FOR:", record);
      record.meetings.forEach(function (meeting) {
        console.log("MEETING:", meeting);
      })
      res.render('profile', {id: req.cookies.id, thePerson: record, meetings: allMeetings})
    })
  })
})

router.post('/meeting/:id', function (req, res, next) {
  var date = req.body.date
  lib.createNewMeeting(date, req.cookies.id, req.params.id).then(function (newMeeting) {
    console.log("NEW MEETING:", newMeeting);
    lib.updateMeetings(req.cookies.id, newMeeting._id);
    lib.updateMeetings(req.params.id, newMeeting._id);
    res.redirect('/profile/' + req.params.id)
  })
})

router.get('/connect/:id', function (req, res, next) {

})

router.get('/disconnect/:id', function (req, res, next) {

})
module.exports = router;

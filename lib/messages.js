module.exports = {
  meetingErr: function (topic, date) {
    var msg = []
    if (topic === '') {
      console.log("NO TOPIC");
      msg.push("Topic can not be blank.")
    }
    if (date === '') {
      console.log("NO DATE");
      msg.push("Please choose a date.")
    }
    return msg
  },

  loginErr: function (email, password) {
    var msg = []
    if (email === '') {
      console.log("NO EMAIL");
      msg.push("Email can not be blank.")
    }
    if (password === '') {
      console.log("NO PASS");
      msg.push("Password can not be blank.")
    }
    return msg
  },

  createErr: function (email, password, confirm) {
    var msg = []
    if (email === '') {
      console.log("NO EMAIL");
      msg.push("Email can not be blank.")
    }
    if (password === '') {
      console.log("NO PASS");
      msg.push("Password can not be blank.")
    }
    if (password.length < 8) {
      console.log("LENGTH ERR");
      msg.push("Password must be at least 8 characters long.")
    }
    if (password !== confirm) {
      console.log("MISMATCH");
      msg.push("Please re-type your password.")
    }
    return msg
  }
}

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
  }
}

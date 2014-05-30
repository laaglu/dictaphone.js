var status = require('status').status;

function message(msg) {
  status.show(msg, 2000);
}

module.exports = { message: message };

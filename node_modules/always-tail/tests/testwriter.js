var fs = require('fs');
i = 0

var rollover = function() {
  console.log("doing rollover");
  fs.renameSync('/tmp/hello', '/tmp/hello.1');
}

var truncate = function() {
  console.log("doing truncation");
  fs.writeFileSync('/tmp/hello', '');
}

setInterval(function() {
  if (i % 20 == 5) {
    truncate();
  } else if (i % 20 == 10) {
    rollover();
  }
  fs.appendFileSync('/tmp/hello', i + "\n");
  i += 1;
}, 100);

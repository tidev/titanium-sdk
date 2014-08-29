var fs = require('fs');
i = 0

var write = function(max) {

  while (i < max) {
    fs.appendFileSync('/tmp/hello', i + "\n");
    i += 1;
  }
  console.log("wrote:", max);
}

write(100);

var rollover = function() {
  console.log("doing rollover");
  fs.rename('/tmp/hello', '/tmp/hello.1');
}

setInterval(function() {
  rollover();
  write(i + 100);
}, 3000);



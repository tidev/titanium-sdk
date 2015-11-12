var Tail = require('../index');
var fs = require('fs');

var filename = "/tmp/hello";

if (!fs.existsSync()) fs.writeFileSync(filename, "");

var t = new Tail(filename, '\n', { start: 50000,  interval: 50 })

t.on('line', function(data) {
  console.log("line:", data);
})


t.on('error', function(data) {
  console.log("error:", data);
});

t.watch();

// setTimeout(function() {
//   t.unwatch();
// }, 1000);

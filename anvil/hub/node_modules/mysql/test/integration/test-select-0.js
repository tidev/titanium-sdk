var common     = require('../common');
var connection = common.createConnection({debug: true});
var assert     = require('assert');

connection.query('SELECT ""', function(err, rows) {
  if (err) throw err;

  console.log(rows);
});

connection.end();

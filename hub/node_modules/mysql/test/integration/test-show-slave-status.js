var common     = require('../common');
var connection = common.createConnection();
var assert     = require('assert');

common.useTestDb(connection);

connection.query('show slave status', function(err, rows, fields) {
  if (err) throw err;

  console.log(rows);
});

connection.end();

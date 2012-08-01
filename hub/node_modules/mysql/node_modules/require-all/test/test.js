var assert = require('assert');
var requireAll = require('..');

var controllers = requireAll({
  dirname: __dirname + '/controllers',
  filter: /(.+Controller)\.js$/
});

assert.deepEqual(controllers, {
  'main-Controller': {
    index: 1,
    show: 2,
    add: 3,
    edit: 4
  },

  'other-Controller': {
    index: 1,
    show: 'nothing'
  }
});


if (process.version > 'v0.6.0') {
  var mydir = requireAll({
    dirname: __dirname + '/mydir',
    filter: /(.+)\.(js|json)$/
  });

  assert.deepEqual(mydir, {
    foo: 'bar',
    hello: { world: true, universe: 42 },
    sub: {
      config: { settingA: 'A', settingB: 'B' },
      yes: true
    }
  });
}

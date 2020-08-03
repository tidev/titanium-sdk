'use strict';

const postAppCreate = require('../../../../cli/lib/webpack-post-create');

exports.id = 'template.angular.post-create';
exports.init = postAppCreate(__dirname);

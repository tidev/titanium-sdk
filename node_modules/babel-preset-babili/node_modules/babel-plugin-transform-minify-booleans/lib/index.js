/*istanbul ignore next*/"use strict";

exports.__esModule = true;

exports.default = function ( /*istanbul ignore next*/_ref) {
  /*istanbul ignore next*/var t = _ref.types;

  return {
    visitor: { /*istanbul ignore next*/
      Literal: function Literal(path) {
        if (typeof path.node.value === "boolean") {
          path.replaceWith(t.unaryExpression("!", t.numericLiteral(+!path.node.value), true));
        }
      }
    }
  };
};

/*istanbul ignore next*/module.exports = exports["default"];
/*istanbul ignore next*/"use strict";

exports.__esModule = true;

exports.default = function ( /*istanbul ignore next*/_ref) {
  /*istanbul ignore next*/var t = _ref.types;

  return {
    visitor: { /*istanbul ignore next*/
      ReferencedIdentifier: function ReferencedIdentifier(path) {
        if (path.node.name === "undefined") {
          path.replaceWith(t.unaryExpression("void", t.numericLiteral(0), true));
        }
      }
    }
  };
};

/*istanbul ignore next*/module.exports = exports["default"];
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var evaluate = require("babel-helper-evaluate-path");
// Assuming all the static methods from below array are side effect free evaluation
// except Math.random
var VALID_CALLEES = ["String", "Number", "Math"];
var INVALID_METHODS = ["random"];

module.exports = function (_ref) {
  var t = _ref.types;

  var BuiltInReplacer = function () {
    function BuiltInReplacer(program) {
      _classCallCheck(this, BuiltInReplacer);

      this.program = program;
      this.pathsToUpdate = new Map();
    }

    _createClass(BuiltInReplacer, [{
      key: "run",
      value: function run() {
        this.collect();
        this.replace();
      }
    }, {
      key: "collect",
      value: function collect() {
        var context = this;

        var collectVisitor = {
          MemberExpression(path) {
            if (path.parentPath.isCallExpression()) {
              return;
            }

            if (!isComputed(path) && isBuiltin(path)) {
              var expName = memberToString(path.node);

              if (!context.pathsToUpdate.has(expName)) {
                context.pathsToUpdate.set(expName, []);
              }
              context.pathsToUpdate.get(expName).push(path);
            }
          },

          CallExpression: {
            exit(path) {
              var callee = path.get("callee");
              if (!callee.isMemberExpression()) {
                return;
              }

              // computed property should be not optimized
              // Math[max]() -> Math.max()
              if (!isComputed(callee) && isBuiltin(callee)) {
                var result = evaluate(path);
                // deopt when we have side effecty evaluate-able arguments
                // Math.max(foo(), 1) --> untouched
                // Math.floor(1) --> 1
                if (result.confident && hasPureArgs(path)) {
                  path.replaceWith(t.valueToNode(result.value));
                } else {
                  var expName = memberToString(callee.node);

                  if (!context.pathsToUpdate.has(expName)) {
                    context.pathsToUpdate.set(expName, []);
                  }
                  context.pathsToUpdate.get(expName).push(callee);
                }
              }
            }
          }
        };

        this.program.traverse(collectVisitor);
      }
    }, {
      key: "replace",
      value: function replace() {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.pathsToUpdate[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _ref2 = _step.value;

            var _ref3 = _slicedToArray(_ref2, 2);

            var expName = _ref3[0];
            var paths = _ref3[1];

            // Should only transform if there is more than 1 occurence
            if (paths.length > 1) {
              var uniqueIdentifier = this.program.scope.generateUidIdentifier(expName);
              var newNode = t.variableDeclaration("var", [t.variableDeclarator(uniqueIdentifier, paths[0].node)]);

              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                for (var _iterator2 = paths[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var path = _step2.value;

                  path.replaceWith(uniqueIdentifier);
                }
                // hoist the created var to top of the program
              } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                  }
                } finally {
                  if (_didIteratorError2) {
                    throw _iteratorError2;
                  }
                }
              }

              this.program.unshiftContainer("body", newNode);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }]);

    return BuiltInReplacer;
  }();

  return {
    name: "minify-builtins",
    visitor: {
      Program(path) {
        var builtInReplacer = new BuiltInReplacer(path);
        builtInReplacer.run();
      }
    }
  };

  function memberToString(memberExpr) {
    var object = memberExpr.object,
        property = memberExpr.property;

    var result = "";

    if (t.isIdentifier(object)) result += object.name;
    if (t.isMemberExpression(object)) result += memberToString(object);
    if (t.isIdentifier(property)) result += property.name;

    return result;
  }

  function isBuiltin(memberExpr) {
    var _memberExpr$node = memberExpr.node,
        object = _memberExpr$node.object,
        property = _memberExpr$node.property;


    if (t.isIdentifier(object) && t.isIdentifier(property) && VALID_CALLEES.indexOf(object.name) >= 0 && INVALID_METHODS.indexOf(property.name) < 0) {
      return true;
    }
    return false;
  }
};

function hasPureArgs(path) {
  var args = path.get("arguments");
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = args[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var arg = _step3.value;

      if (!arg.isPure()) {
        return false;
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return true;
}

function isComputed(path) {
  var node = path.node;

  return node.computed;
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("babel-helper-mark-eval-scopes"),
    markEvalScopes = _require.markEvalScopes,
    isEvalScopesMarked = _require.isMarked,
    hasEval = _require.hasEval;

var PATH_RENAME_MARKER = Symbol("PATH_RENAME_MARKER");

module.exports = function (_ref) {
  var t = _ref.types,
      traverse = _ref.traverse;

  var hop = Object.prototype.hasOwnProperty;

  var Mangler = function () {
    function Mangler(charset, program) {
      var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          _ref2$blacklist = _ref2.blacklist,
          blacklist = _ref2$blacklist === undefined ? {} : _ref2$blacklist,
          _ref2$keepFnName = _ref2.keepFnName,
          keepFnName = _ref2$keepFnName === undefined ? false : _ref2$keepFnName,
          _ref2$eval = _ref2.eval,
          _eval = _ref2$eval === undefined ? false : _ref2$eval,
          _ref2$topLevel = _ref2.topLevel,
          topLevel = _ref2$topLevel === undefined ? false : _ref2$topLevel,
          _ref2$keepClassName = _ref2.keepClassName,
          keepClassName = _ref2$keepClassName === undefined ? false : _ref2$keepClassName;

      _classCallCheck(this, Mangler);

      this.charset = charset;
      this.program = program;
      this.blacklist = toObject(blacklist);
      this.keepFnName = keepFnName;
      this.keepClassName = keepClassName;
      this.eval = _eval;
      this.topLevel = topLevel;

      this.unsafeScopes = new Set();
      this.visitedScopes = new Set();

      this.referencesToUpdate = new Map();
    }

    _createClass(Mangler, [{
      key: "run",
      value: function run() {
        this.cleanup();
        this.collect();
        this.charset.sort();
        this.mangle();
      }
    }, {
      key: "cleanup",
      value: function cleanup() {
        traverse.clearCache();
        this.program.scope.crawl();
      }
    }, {
      key: "isBlacklist",
      value: function isBlacklist(name) {
        return hop.call(this.blacklist, name) && this.blacklist[name];
      }
    }, {
      key: "markUnsafeScopes",
      value: function markUnsafeScopes(scope) {
        var evalScope = scope;
        do {
          this.unsafeScopes.add(evalScope);
        } while (evalScope = evalScope.parent);
      }
    }, {
      key: "collect",
      value: function collect() {
        var mangler = this;

        if (!isEvalScopesMarked(mangler.program.scope)) {
          markEvalScopes(mangler.program);
        }

        if (this.charset.shouldConsider) {
          var collectVisitor = {
            Identifier(path) {
              var node = path.node;


              if (path.parentPath.isMemberExpression({ property: node }) || path.parentPath.isObjectProperty({ key: node })) {
                mangler.charset.consider(node.name);
              }
            },
            Literal(_ref3) {
              var node = _ref3.node;

              mangler.charset.consider(String(node.value));
            }
          };

          mangler.program.traverse(collectVisitor);
        }
      }
    }, {
      key: "mangleScope",
      value: function mangleScope(scope) {
        var mangler = this;

        if (!mangler.eval && hasEval(scope)) return;

        if (mangler.visitedScopes.has(scope)) return;
        mangler.visitedScopes.add(scope);

        var i = 0;
        function getNext() {
          return mangler.charset.getIdentifier(i++);
        }

        // This is useful when we have vars of single character
        // => var a, ...z, A, ...Z, $, _;
        // to
        // => var aa, a, b ,c;
        // instead of
        // => var aa, ab, ...;
        // TODO:
        // Re-enable after enabling this feature
        // This doesn't work right now as we are concentrating
        // on performance improvements
        // function resetNext() {
        //   i = 0;
        // }

        var bindings = scope.getAllBindings();
        var names = Object.keys(bindings);

        for (var _i = 0; _i < names.length; _i++) {
          var oldName = names[_i];
          var binding = bindings[oldName];

          if (
          // arguments
          oldName === "arguments"
          // other scope bindings
          || !scope.hasOwnBinding(oldName)
          // labels
          || binding.path.isLabeledStatement()
          // ClassDeclaration has binding in two scopes
          //   1. The scope in which it is declared
          //   2. The class's own scope
          // - https://github.com/babel/babel/issues/5156
          || binding.path.isClassDeclaration() && binding.path === scope.path
          // blacklisted
          || mangler.isBlacklist(oldName)
          // function names
          || (mangler.keepFnName ? isFunction(binding.path) : false)
          // class names
          || (mangler.keepClassName ? isClass(binding.path) : false)) {
            continue;
          }

          var next = void 0;
          do {
            next = getNext();
          } while (!t.isValidIdentifier(next) || hop.call(bindings, next) || scope.hasGlobal(next) || scope.hasReference(next));

          // TODO:
          // re-enable this - check above
          // resetNext();
          mangler.rename(scope, oldName, next);
        }
      }
    }, {
      key: "mangle",
      value: function mangle() {
        var mangler = this;

        if (mangler.topLevel) {
          mangler.mangleScope(mangler.program.scope);
        }

        this.program.traverse({
          Scopable(path) {
            mangler.mangleScope(path.scope);
          }
        });
      }
    }, {
      key: "rename",
      value: function rename(scope, oldName, newName) {
        var binding = scope.getBinding(oldName);

        // rename at the declaration level
        var bindingPaths = binding.path.getBindingIdentifierPaths(true, false);

        // we traverse through all bindingPaths because,
        // there is no binding.identifierPath in babel
        for (var name in bindingPaths) {
          if (name !== oldName) continue;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = bindingPaths[name][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var idPath = _step.value;

              if (binding.identifier === idPath.node) {
                idPath.replaceWith(t.identifier(newName));
                binding.identifier = idPath.node;
                idPath[PATH_RENAME_MARKER] = true;
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

        var bindings = scope.bindings;

        bindings[newName] = binding;
        delete bindings[oldName];

        // update all constant violations & redeclarations
        var violations = binding.constantViolations;

        var _loop = function _loop(i) {
          if (violations[i].isLabeledStatement()) return "continue";

          var bindings = violations[i].getBindingIdentifierPaths();
          Object.keys(bindings).map(function (b) {
            if (b === oldName && !bindings[b][PATH_RENAME_MARKER]) {
              bindings[b].replaceWith(t.identifier(newName));
              bindings[b][PATH_RENAME_MARKER] = true;
            }
          });
        };

        for (var i = 0; i < violations.length; i++) {
          var _ret = _loop(i);

          if (_ret === "continue") continue;
        }

        // update all referenced places
        var refs = binding.referencePaths;
        for (var i = 0; i < refs.length; i++) {
          var path = refs[i];
          if (path[PATH_RENAME_MARKER]) continue;

          var node = path.node;

          if (!path.isIdentifier()) {
            // Ideally, this should not happen
            // it happens in these places now -
            // case 1: Export Statements
            // This is a bug in babel
            // https://github.com/babel/babel/pull/3629
            // case 2: Replacements in other plugins
            // eg: https://github.com/babel/babili/issues/122
            // replacement in dce from `x` to `!x` gives referencePath as `!x`
            path.traverse({
              ReferencedIdentifier(refPath) {
                if (refPath.node.name === oldName && refPath.scope === scope && !refPath[PATH_RENAME_MARKER]) {
                  refPath.node.name = newName;
                }
              }
            });
          } else if (!isLabelIdentifier(path)) {
            node.name = newName;
          }
        }
      }
    }]);

    return Mangler;
  }();

  return {
    name: "minify-mangle-names",
    visitor: {
      Program(path) {
        // If the source code is small then we're going to assume that the user
        // is running on this on single files before bundling. Therefore we
        // need to achieve as much determinisim and we will not do any frequency
        // sorting on the character set. Currently the number is pretty arbitrary.
        var shouldConsiderSource = path.getSource().length > 70000;

        var charset = new Charset(shouldConsiderSource);

        var mangler = new Mangler(charset, path, this.opts);
        mangler.run();
      }
    }
  };
};

var CHARSET = ("abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ$_").split("");

var Charset = function () {
  function Charset(shouldConsider) {
    var _this = this;

    _classCallCheck(this, Charset);

    this.shouldConsider = shouldConsider;
    this.chars = CHARSET.slice();
    this.frequency = {};
    this.chars.forEach(function (c) {
      _this.frequency[c] = 0;
    });
    this.finalized = false;
  }

  _createClass(Charset, [{
    key: "consider",
    value: function consider(str) {
      var _this2 = this;

      if (!this.shouldConsider) {
        return;
      }

      str.split("").forEach(function (c) {
        if (_this2.frequency[c] != null) {
          _this2.frequency[c]++;
        }
      });
    }
  }, {
    key: "sort",
    value: function sort() {
      var _this3 = this;

      if (this.shouldConsider) {
        this.chars = this.chars.sort(function (a, b) {
          return _this3.frequency[b] - _this3.frequency[a];
        });
      }

      this.finalized = true;
    }
  }, {
    key: "getIdentifier",
    value: function getIdentifier(num) {
      if (!this.finalized) {
        throw new Error("Should sort first");
      }

      var ret = "";
      num++;
      do {
        num--;
        ret += this.chars[num % this.chars.length];
        num = Math.floor(num / this.chars.length);
      } while (num > 0);
      return ret;
    }
  }]);

  return Charset;
}();

// convert value to object


function toObject(value) {
  if (!Array.isArray(value)) {
    return value;
  }

  var map = {};
  for (var i = 0; i < value.length; i++) {
    map[value[i]] = true;
  }
  return map;
}

// for keepFnName
function isFunction(path) {
  return path.isFunctionExpression() || path.isFunctionDeclaration();
}

// for keepClassName
function isClass(path) {
  return path.isClassExpression() || path.isClassDeclaration();
}

function isLabelIdentifier(path) {
  var node = path.node;

  return path.parentPath.isLabeledStatement({ label: node }) || path.parentPath.isBreakStatement({ label: node }) || path.parentPath.isContinueStatement({ label: node });
}
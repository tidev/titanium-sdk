#!/usr/bin/env python
import os, re, sys, json

thisDir = os.path.abspath(os.path.dirname(__file__))
genDir = os.path.join(os.path.dirname(thisDir), "generated")
androidDir = os.path.abspath(os.path.join(thisDir, "..", "..", ".."))

bindingPaths = []
bindingPaths.append(os.path.join(androidDir, "titanium", ".apt_generated", "org", "appcelerator", "titanium", "bindings", "titanium.json"))

modulesDir = os.path.join(androidDir, "modules")
for module in os.listdir(modulesDir):
	jsonPath = os.path.join(modulesDir, module, ".apt_generated", "org", "appcelerator", "titanium", "bindings", module + ".json")
	if os.path.exists(jsonPath):
		bindingPaths.append(jsonPath)

bindings = { "proxies": {}, "modules": {} }
apiTree = {}
initTable = []
headers = ""

for bindingPath in bindingPaths:
	moduleName = os.path.basename(bindingPath).replace(".json", "")
	binding = json.load(open(bindingPath))
	bindings["proxies"].update(binding["proxies"])
	bindings["modules"].update(binding["modules"])

def getDependencies(proxy):
	deps = []
	proxyObj = bindings["proxies"][proxy]
	while True:
		superPackage = proxyObj["superPackageName"]
		superProxy = proxyObj["superProxyClassName"]
		if superProxy in ("KrollProxy", "KrollModule", "EventEmitter"):
			break

		superProxyName = superPackage + "." + superProxy
		if superProxyName not in bindings["proxies"]:
			break

		superAPIName = bindings["proxies"][superProxyName]["proxyAttrs"]["fullAPIName"]
		deps.insert(0, superAPIName)

		proxyObj = bindings["proxies"][superProxyName]

	return deps

def addToInitTable(proxy):
	global headers, initTable
	fullAPI = bindings["proxies"][proxy]["proxyAttrs"]["fullAPIName"]
	namespaces = map(lambda n: n.lower(), fullAPI.split(".")[:-1])
	if "titanium" not in namespaces:
		namespaces.insert(0, "titanium")
	namespace = "::".join(namespaces)
	className = bindings["proxies"][proxy]["proxyClassName"]

	headers += "#include \"%s.h\"\n" % proxy
	fullAPI = fullAPI.replace("Titanium.", "")
	initFunction = "%s::%s::bindProxy" % (namespace, className)

	initTable.append("%s, %s" % (proxy, initFunction))

def addToAPITree(proxyKey):
	fullAPI = bindings["proxies"][proxyKey]["proxyAttrs"]["fullAPIName"]
	tree = apiTree
	apiNames = fullAPI.split(".")
	for api in apiNames:
		if api == "Titanium": continue
		if api not in tree:
			tree[api] = {
				"_dependencies": getDependencies(proxyKey),
			}
		tree = tree[api]
	tree["_className"] = proxy

for proxy in bindings["proxies"]:
	addToAPITree(proxy)
	addToInitTable(proxy)


JS_DEFINE_PROPERTIES = \
"""
Object.defineProperties(%(var)s, {
%(properties)s
});
"""

JS_GETTER = \
"""	\"%(child)s\": {
		get: function() {
"""

JS_DEPENDENCY = \
"""		// Ensure %(name)s is initialized
		var dep%(index)d = Titanium.%(name)s;
"""

JS_LAZY_GET = \
"		%(decl)s lazyGet(this, \"%(className)s\", \"%(api)s\", \"%(namespace)s\");\n"

JS_DEFINE_GETTER = \
"""		%(prototype)s.get%(upperName)s = function() { return this.%(name)s; }
"""

JS_DEFINE_SETTER = \
"""		%(prototype)s.set%(upperName)s = function(value) { this.%(name)s = value; }
"""

JS_PROPERTY = \
"""	"%(name)s": {
		get: function() { return %(getter)s; },
		set: function(value) { %(setter)s; },
		enumerable: true
	},
"""

JS_GET_PROPERTY = """this.getProperty(\"%(name)s\")"""
JS_SET_PROPERTY = """this.setPropertyAndFire(\"%(name)s\", value)"""

JS_CREATE = \
"""		%(name)s.create%(type)s = function() {
			return new %(name)s%(accessor)s(arguments);
		}
"""

JS_DEFINE_TOP_LEVEL = \
"""	global.%(name)s = function() {
		return %(namespace)s.%(mapping)s.apply(%(namespace)s, arguments);
	}
"""

JS_CLOSE_GETTER = \
"""		},
		configurable: true
	},
"""

def indentCode(code, amount = 1):
	lines = code.splitlines()
	for i in range(0, len(lines)):
		lines[i] = amount * "\t" + lines[i]
	return "\n".join(lines) + "\n"

def isBoundMethod(proxyMap, methodName):
	if "methods" not in proxyMap: return False
	for method in proxyMap["methods"]:
		if method == methodName: return True
		if proxyMap["methods"][method]["name"] ==  methodName: return True
	return False

topLevelJS = ""

def genBootstrap(node, namespace = "", indent = 0):
	js = ""

	hasDependencies = "_dependencies" in node and len(node["_dependencies"]) > 0
	if hasDependencies:
		i = 0
		for dependency in node["_dependencies"]:
			js += JS_DEPENDENCY % { "name": dependency, "index": i }
			i += 1

	apiName = namespace.split(".")[-1]
	var = apiName

	if namespace == "":
		var = "Titanium"
		namespace = "Titanium"
		apiName = "Titanium"
		decl = "";

	childAPIs = node.keys()
	className = node["_className"]
	proxyMap = bindings["proxies"][className]
	accessors = proxyMap["proxyAttrs"]["propertyAccessors"]
	isModule = proxyMap["isModule"]

	# ignore _dependencies and _className in the childAPIs count
	hasChildren = len(childAPIs) > 2
	hasAccessors = len(accessors) > 0 or "dynamicProperties" in proxyMap
	hasCreateProxies = isModule and "createProxies" in bindings["modules"][className]

	if namespace != "Titanium":
		decl = "var %s =" % var
		if not (hasChildren or hasAccessors or hasCreateProxies):
			decl = "return"

		js += JS_LAZY_GET % { "decl": decl, "className": className, "api": apiName, "namespace": namespace }

	childJS = ""
	for childAPI in childAPIs:
		if childAPI in ("_dependencies", "_className"): continue
		childNamespace = namespace + "." + childAPI
		if namespace == "Titanium":
			childNamespace = childAPI

		childJS += JS_GETTER % { "var": var, "child": childAPI }
		childJS += indentCode(genBootstrap(node[childAPI], childNamespace, indent + 1))
		childJS += JS_CLOSE_GETTER

	if hasChildren:
		js += indentCode(JS_DEFINE_PROPERTIES % { "var": var, "properties": childJS }, 2)

	prototype = var if isModule else var + ".prototype"

	def defineAccessor(template, accessor):
		upperName = accessor[0:1].upper() + accessor[1:]
		return template % { "prototype": prototype, "name": accessor, "upperName": upperName }

	for accessor in accessors:
		js += defineAccessor(JS_DEFINE_GETTER, accessor)
		js += defineAccessor(JS_DEFINE_SETTER, accessor)

	if "dynamicProperties" in proxyMap: 
		properties = ""
		for dpName in proxyMap["dynamicProperties"]:
			dp = proxyMap["dynamicProperties"][dpName]
			getter = JS_GET_PROPERTY % {"name": dp["name"]}
			if dp["get"]:
				getter = "this.%s()" % dp["getMethodName"]
			setter = JS_SET_PROPERTY % {"name": dp["name"]}
			if dp["set"]:
				setter = "this.%s(value)" % dp["setMethodName"]
			properties += JS_PROPERTY % { "prototype": prototype, \
				"name": dp["name"], "getter": getter, "setter": setter }
		for accessor in accessors:
			getter = JS_GET_PROPERTY % {"name": accessor}
			setter = JS_SET_PROPERTY % {"name": accessor}
			properties += JS_PROPERTY % { "prototype": prototype, \
				"name": accessor, "getter": getter, "setter": setter }
		js += indentCode(JS_DEFINE_PROPERTIES % { "var": prototype, "properties": properties }, 2)

	if hasCreateProxies:
		createProxies = bindings["modules"][className]["createProxies"]
		for create in createProxies:
			# 2DMatrix: noooooooooooooooooope.
			if re.match(r"^[0-9]", create["name"]):
				accessor = "[\"%s\"]" % create["name"]
			else:
				accessor = "." + create["name"]

			js += JS_CREATE % {"name": var, "type": create["name"], "accessor": accessor}

	if "topLevelMethods" in proxyMap:
		global topLevelJS
		for method in proxyMap["topLevelMethods"]:
			ns = namespace
			if not ns.startswith("Titanium"):
				ns = "Titanium." + ns
			topLevelNames = proxyMap["topLevelMethods"][method]
			for name in topLevelNames:
				topLevelJS += JS_DEFINE_TOP_LEVEL % {"name": name, "mapping": method, "namespace": ns}

	if hasChildren or hasAccessors or hasCreateProxies:
		js += "		return %s;\n" % var

	return js

bootstrapJS = genBootstrap(apiTree)

bootstrapJS = topLevelJS + bootstrapJS

jsTemplate = open(os.path.join(thisDir, "bootstrap.js")).read()
gperfTemplate = open(os.path.join(thisDir, "bootstrap.gperf")).read()

bootstrap = os.path.join(genDir, "bootstrap.js")
genBindings = os.path.join(genDir, "KrollGeneratedBindings.gperf")
open(bootstrap, "w").write(
	jsTemplate % { "bootstrap": bootstrapJS })
open(genBindings, "w").write(
	gperfTemplate % { "headers": headers, "bindings": "\n".join(initTable) })

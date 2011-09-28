#!/usr/bin/env python
import os, re, sys, json

thisDir = os.path.abspath(os.path.dirname(__file__))
androidDir = os.path.abspath(os.path.join(thisDir, "..", "..", ".."))

bindingPaths = []
bindingPaths.append(os.path.join(androidDir, "titanium", ".apt_generated", "org", "appcelerator", "titanium", "bindings", "titanium.json"))

modulesDir = os.path.join(androidDir, "modules")
for module in os.listdir(modulesDir):
	jsonPath = os.path.join(modulesDir, module, ".apt_generated", "org", "appcelerator", "titanium", "bindings", module + ".json")
	if os.path.exists(jsonPath):
		bindingPaths.append(jsonPath)

bindings = { "proxies": {}, "modules": {} }
initTree = {}

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

def addToTree(proxy):
	fullAPI = bindings["proxies"][proxy]["proxyAttrs"]["fullAPIName"]
	tree = initTree
	apiNames = fullAPI.split(".")
	for api in apiNames:
		if api == "Titanium": continue
		if api not in tree:
			tree[api] = { "_dependencies": getDependencies(proxy) }
		tree = tree[api]

for proxy in bindings["proxies"]:
	addToTree(proxy)

JS_DEPENDENCY = \
"""	// Ensure %(name)s is initialized
	var dep%(index)d = Titanium.%(name)s;
"""

JS_LAZY_GET = "	%(decl)s lazyGet(this, \"%(namespace)s\", \"%(api)s\");\n"

JS_DEFINE_PROPERTIES = \
"""
Object.defineProperties(%(var)s, {
%(properties)s
});
"""

JS_GETTER = "	\"%(child)s\": { get: function() {\n"
JS_CLOSE_GETTER = "	}},\n"

def indentCode(code, amount=1):
	lines = code.splitlines()
	for i in range(0, len(lines)):
		lines[i] = amount * "\t" + lines[i]
	return "\n".join(lines) + "\n"

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

	# ignore _dependencies in the childAPIs count
	hasChildren = len(childAPIs) > 1

	if namespace != "Titanium":
		decl = "var %s =" % var
		if not hasChildren:
			decl = "return"

		js += JS_LAZY_GET % { "decl": decl, "namespace": namespace, "api": apiName }

	childJS = ""
	for childAPI in childAPIs:
		if childAPI == "_dependencies": continue
		childNamespace = namespace + "." + childAPI
		if namespace == "Titanium":
			childNamespace = childAPI

		childJS += JS_GETTER % { "var": var, "child": childAPI }
		childJS += indentCode(genBootstrap(node[childAPI], childNamespace, indent + 1))
		childJS += JS_CLOSE_GETTER

	if hasChildren:
		js += indentCode(JS_DEFINE_PROPERTIES % { "var": var, "properties": childJS })

	return js

template = open(os.path.join(thisDir, "bootstrap.js")).read()
print template % { "bootstrap": genBootstrap(initTree) }

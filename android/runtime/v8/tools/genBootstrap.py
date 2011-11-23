#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Generates javascript bootstrapping code for Titanium Mobile
#

import os, re, sys

try:
	import json
except:
	import simplejson as json

import optparse

thisDir = os.path.abspath(os.path.dirname(__file__))
genDir = os.path.join(os.path.dirname(thisDir), "generated")

if not os.path.exists(genDir):
	os.makedirs(genDir)

androidDir = os.path.abspath(os.path.join(thisDir, "..", "..", ".."))
jsonDir = os.path.abspath(os.path.join(androidDir, "..", "dist", "android", "json"))

bindingPaths = []

for module in os.listdir(jsonDir):
	bindingsDir = os.path.join(jsonDir, "org", "appcelerator", "titanium", "bindings")
	for binding in os.listdir(bindingsDir):
		jsonPath = os.path.join(bindingsDir, binding)
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
	#fullApi = bindings["proxies"][proxy]["proxyAttrs"]["fullAPIName"]
	fullApi = getFullApiName(bindings["proxies"][proxy])
	namespaces = map(lambda n: n.lower(), fullApi.split(".")[:-1])
	if "titanium" not in namespaces:
		namespaces.insert(0, "titanium")
	namespace = "::".join(namespaces)
	className = bindings["proxies"][proxy]["proxyClassName"]

	headers += "#include \"%s.h\"\n" % proxy
	fullApi = fullApi.replace("Titanium.", "")
	initFunction = "%s::%s::bindProxy" % (namespace, className)
	disposeFunction = "%s::%s::dispose" % (namespace, className)

	initTable.append("%s, %s, %s" % (proxy, initFunction, disposeFunction))

Kroll_DEFAULT = "org.appcelerator.kroll.annotations.Kroll.DEFAULT"

def getParentModuleClass(proxyMap):
	creatableInModule = proxyMap["proxyAttrs"].get("creatableInModule", None)
	parentModule = proxyMap["proxyAttrs"].get("parentModule", None)
	if creatableInModule and creatableInModule != Kroll_DEFAULT:
		return creatableInModule
	if parentModule and parentModule != Kroll_DEFAULT:
		return parentModule
	return None

def getFullApiName(proxyMap):
	fullApiName = proxyMap["proxyAttrs"]["name"]
	parentModuleClass = getParentModuleClass(proxyMap)

	while parentModuleClass:
		parent = bindings["proxies"][parentModuleClass]
		parentName = parent["proxyAttrs"]["name"]
		fullApiName = parentName + "." + fullApiName

		parentModuleClass = getParentModuleClass(parent)

	return fullApiName

def addToApiTree(proxyKey):
	#fullAPI = bindings["proxies"][proxyKey]["proxyAttrs"]["fullAPIName"]
	fullApi = getFullApiName(bindings["proxies"][proxyKey])
	tree = apiTree
	apiNames = fullApi.split(".")
	for api in apiNames:
		if api == "Titanium": continue
		if api not in tree:
			tree[api] = {
				"_dependencies": [],
			}
		tree = tree[api]
	tree["_className"] = proxy

for proxy in bindings["proxies"]:
	addToApiTree(proxy)
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
"""		%(name)s.constructor.prototype.create%(type)s = function() {
			return new %(name)s%(accessor)s(arguments);
		}
"""

JS_INVOCATION_API = \
"""	addInvocationAPI(Titanium, \"%(namespace)s\", \"%(api)s\");
"""

JS_DEFINE_TOP_LEVEL = \
"""	kroll.log("bootstrap", "global.%(name)s");
	global.%(name)s = function() {
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

globalsJS = ""
invocationJS = ""
genAPITree = True
modulesWithCreate = []

def genBootstrap(node, namespace = "", indent = 0):
	global genAPITree
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
	isModule = proxyMap["isModule"]

	# ignore _dependencies and _className in the childAPIs count
	hasChildren = len(childAPIs) > 2
	hasCreateProxies = isModule and "createProxies" in bindings["modules"][className]

	if hasCreateProxies:
		if apiName not in modulesWithCreate:
			modulesWithCreate.append(namespace)

	invocationAPIs = []
	if "methods" in proxyMap:
		for method in proxyMap["methods"]:
			methodMap = proxyMap["methods"][method]
			if methodMap["hasInvocation"]:
				invocationAPIs.append(methodMap)
	if "dynamicProperties" in proxyMap:
		for dp in proxyMap["dynamicProperties"]:
			dpMap = proxyMap["dynamicProperties"][dp]
			if dpMap["getHasInvocation"]:
				invocationAPIs.append({ "apiName": dpMap["getMethodName"] })
			if dpMap["setHasInvocation"]:
				invocationAPIs.append({ "apiName": dpMap["setMethodName"] })
	hasInvocationAPIs = len(invocationAPIs) > 0

	needsReturn = hasChildren or \
		hasCreateProxies or hasInvocationAPIs

	if namespace != "Titanium" and genAPITree:
		decl = "var %s =" % var
		if not needsReturn:
			decl = "return"

		js += JS_LAZY_GET % { "decl": decl, "className": className, "api": apiName, "namespace": namespace }

	childJS = ""
	for childAPI in childAPIs:
		if childAPI in ("_dependencies", "_className"): continue
		childNamespace = namespace + "." + childAPI
		if namespace == "Titanium":
			childNamespace = childAPI

		if genAPITree:
			childJS += JS_GETTER % { "var": var, "child": childAPI }

		childJS += indentCode(genBootstrap(node[childAPI], childNamespace, indent + 1))
		if genAPITree:
			childJS += JS_CLOSE_GETTER

	if hasChildren and genAPITree:
		js += "		if (!(\"__propertiesDefined__\" in %s)) {" % var
		js += indentCode(JS_DEFINE_PROPERTIES % { "var": var, "properties": childJS }, 2)

	if isModule:
		prototype = var
	else:
		prototype = var + ".prototype"

	def defineAccessor(template, accessor):
		upperName = accessor[0:1].upper() + accessor[1:]
		return template % { "prototype": prototype, "name": accessor, "upperName": upperName }

	if hasCreateProxies:
		createProxies = bindings["modules"][className]["createProxies"]
		for create in createProxies:
			# 2DMatrix: noooooooooooooooooope.
			if re.match(r"^[0-9]", create["name"]):
				accessor = "[\"%s\"]" % create["name"]
			else:
				accessor = "." + create["name"]

			invocationAPIs.append({ "apiName": "create%s" % create["name"] })
			if genAPITree:
				js += JS_CREATE % {"name": var, "type": create["name"], "accessor": accessor }

	if hasChildren and genAPITree:
		js += "		}\n";
		js += "		%s.__propertiesDefined__ = true;\n" % var

	global globalsJS, invocationJS
	if "topLevelMethods" in proxyMap:
		for method in proxyMap["topLevelMethods"]:
			ns = namespace
			if not ns.startswith("Titanium"):
				ns = "Titanium." + ns
			topLevelNames = proxyMap["topLevelMethods"][method]
			for name in topLevelNames:
				globalsJS += JS_DEFINE_TOP_LEVEL % {"name": name, "mapping": method, "namespace": ns}

	for api in invocationAPIs:
		invocationJS += JS_INVOCATION_API % { "namespace": namespace, "api": api["apiName"] }

	if needsReturn and genAPITree:
		js += "		return %s;\n" % var

	return js

def main():
	parser = optparse.OptionParser()
	parser.add_option("", "--disable-api-tree", dest="apiTree",
		action="store_false", default=True)
	parser.add_option("-o", "--output",
		dest="output", default=None)

	(options, args) = parser.parse_args()

	global genAPITree
	genAPITree = options.apiTree

	global apiTree, globalsJS, invocationJS
	bootstrapJS = genBootstrap(apiTree)

	jsTemplate = open(os.path.join(thisDir, "bootstrap.js")).read()
	gperfTemplate = open(os.path.join(thisDir, "bootstrap.gperf")).read()

	if options.output == None:
		bootstrap = os.path.join(genDir, "bootstrap.js")
	else:
		bootstrap = options.output

	genBindings = os.path.join(genDir, "KrollGeneratedBindings.gperf")

	bootstrapContext = {
		"globalsJS": globalsJS,
		"invocationJS": invocationJS,
		"bootstrapJS": bootstrapJS,
		"modulesWithCreate": json.dumps(modulesWithCreate)
	}

	gperfContext = {
		"headers": headers,
		"bindings": "\n".join(initTable)
	}

	open(bootstrap, "w").write(jsTemplate % bootstrapContext)
	open(genBindings, "w").write(gperfTemplate % gperfContext)

if __name__ == "__main__":
	main()


#!/usr/bin/env python
#
# Generates V8 bootstrapping JS code
#
import os, re, sys, optparse

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "common")))

try:
	import json
except ImportError:
	import simplejson as json

Kroll_DEFAULT = "org.appcelerator.kroll.annotations.Kroll.DEFAULT"

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
		var dep%(index)d = module.%(name)s;
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
"""	addInvocationAPI(module, \"%(moduleNamespace)s\", \"%(namespace)s\", \"%(api)s\");
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

class Bootstrap(object):
	def __init__(self, runtime, bindings, moduleId=None, moduleName=None):
		self.runtime = runtime
		self.bindings = bindings
		self.genAPITree = runtime == "v8"
		self.apiTree = {}
		self.initTable = []
		self.headers = ""
		self.globalsJS = ""
		self.invocationJS = ""
		self.modulesWithCreate = []
		self.moduleId = moduleId
		self.moduleName = moduleName
		self.moduleNamespace = moduleId.lower()
		self.needsReturn = False

		for proxy in self.bindings["proxies"]:
			self.addToApiTree(proxy)
			self.addToInitTable(proxy)

	def getDependencies(self, proxy):
		deps = []
		proxyObj = self.bindings["proxies"][proxy]
		while True:
			superPackage = proxyObj["superPackageName"]
			superProxy = proxyObj["superProxyClassName"]
			if superProxy in ("KrollProxy", "KrollModule", "EventEmitter"):
				break

			superProxyName = superPackage + "." + superProxy
			if superProxyName not in self.bindings["proxies"]:
				break

			superAPIName = self.bindings["proxies"][superProxyName]["proxyAttrs"]["fullAPIName"]
			deps.insert(0, superAPIName)

			proxyObj = self.bindings["proxies"][superProxyName]

		return deps

	def addToInitTable(self, proxy):
		fullApi = self.getFullApiName(self.bindings["proxies"][proxy])
		namespaces = map(lambda n: n.lower(), fullApi.split(".")[:-1])
		if self.moduleNamespace not in namespaces:
			moduleNs = "::".join(self.moduleNamespace.split("."))
			namespaces.insert(0, moduleNs)

		namespace = "::".join(namespaces)
		className = self.bindings["proxies"][proxy]["proxyClassName"]

		self.headers += "#include \"%s.h\"\n" % proxy
		initFunction = "::%s::%s::bindProxy" % (namespace, className)
		disposeFunction = "::%s::%s::dispose" % (namespace, className)

		self.initTable.append("%s, %s, %s" % (proxy, initFunction, disposeFunction))

	def getParentModuleClass(self, proxyMap):
		creatableInModule = proxyMap["proxyAttrs"].get("creatableInModule", None)
		parentModule = proxyMap["proxyAttrs"].get("parentModule", None)
		if creatableInModule and creatableInModule != Kroll_DEFAULT:
			return creatableInModule
		if parentModule and parentModule != Kroll_DEFAULT:
			return parentModule
		return None

	def getFullApiName(self, proxyMap):
		fullApiName = proxyMap["proxyAttrs"]["name"]
		parentModuleClass = self.getParentModuleClass(proxyMap)

		while parentModuleClass:
			parent = self.bindings["proxies"][parentModuleClass]
			parentName = parent["proxyAttrs"]["name"]
			fullApiName = parentName + "." + fullApiName

			parentModuleClass = self.getParentModuleClass(parent)

		return fullApiName

	def addToApiTree(self, proxyKey):
		fullApi = self.getFullApiName(self.bindings["proxies"][proxyKey])
		tree = self.apiTree
		apiNames = fullApi.split(".")
		for api in apiNames:
			if api == self.moduleName: continue
			if api not in tree:
				tree[api] = {
					"_dependencies": [],
				}
			tree = tree[api]
		tree["_className"] = proxyKey

	def indentCode(self, code, amount = 1):
		lines = code.splitlines()
		for i in range(0, len(lines)):
			lines[i] = amount * "\t" + lines[i]
		return "\n".join(lines) + "\n"

	def isBoundMethod(self, proxyMap, methodName):
		if "methods" not in proxyMap: return False
		for method in proxyMap["methods"]:
			if method == methodName: return True
			if proxyMap["methods"][method]["name"] ==  methodName: return True
		return False

	def processNode(self, node, namespace = "", indent = 0):
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
			var = "module"
			namespace = self.moduleName
			apiName = self.moduleName
			decl = "";

		childAPIs = node.keys()
		className = node["_className"]
		proxyMap = self.bindings["proxies"][className]
		isModule = proxyMap["isModule"]

		# ignore _dependencies and _className in the childAPIs count
		hasChildren = len(filter(lambda x: x not in ("_className", "_dependencies"), childAPIs)) > 0
		hasCreateProxies = isModule and "createProxies" in self.bindings["modules"][className]

		if hasCreateProxies:
			if apiName not in self.modulesWithCreate:
				self.modulesWithCreate.append(namespace)

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
			hasCreateProxies or hasInvocationAPIs or \
			self.needsReturn

		if namespace != self.moduleName and self.genAPITree:
			decl = "var %s =" % var
			if not needsReturn:
				decl = "return"

			js += JS_LAZY_GET % { "decl": decl, "className": className, "api": apiName, "namespace": namespace }

		childJS = ""
		for childAPI in childAPIs:
			if childAPI in ("_dependencies", "_className"): continue
			childNamespace = namespace + "." + childAPI
			if namespace == self.moduleName:
				childNamespace = childAPI

			if self.genAPITree:
				childJS += JS_GETTER % { "var": var, "child": childAPI }

			childJS += self.indentCode(self.processNode(node[childAPI], childNamespace, indent + 1))
			if self.genAPITree:
				childJS += JS_CLOSE_GETTER

		if hasChildren and self.genAPITree:
			js += "		if (!(\"__propertiesDefined__\" in %s)) {" % var
			js += self.indentCode(JS_DEFINE_PROPERTIES % { "var": var, "properties": childJS }, 2)

		if isModule:
			prototype = var
		else:
			prototype = var + ".prototype"

		def defineAccessor(template, accessor):
			upperName = accessor[0:1].upper() + accessor[1:]
			return template % { "prototype": prototype, "name": accessor, "upperName": upperName }

		if hasCreateProxies:
			createProxies = self.bindings["modules"][className]["createProxies"]
			for create in createProxies:
				# 2DMatrix: noooooooooooooooooope.
				if re.match(r"^[0-9]", create["name"]):
					accessor = "[\"%s\"]" % create["name"]
				else:
					accessor = "." + create["name"]

				invocationAPIs.append({ "apiName": "create%s" % create["name"] })
				if self.genAPITree:
					js += JS_CREATE % {"name": var, "type": create["name"], "accessor": accessor }

		if hasChildren and self.genAPITree:
			js += "		}\n";
			js += "		%s.__propertiesDefined__ = true;\n" % var

		if "topLevelMethods" in proxyMap:
			for method in proxyMap["topLevelMethods"]:
				ns = namespace
				if not ns.startswith("Titanium"):
					ns = "Titanium." + ns
				topLevelNames = proxyMap["topLevelMethods"][method]
				for name in topLevelNames:
					self.globalsJS += JS_DEFINE_TOP_LEVEL % {"name": name, "mapping": method, "namespace": ns}

		for api in invocationAPIs:
			self.invocationJS += JS_INVOCATION_API % { "moduleNamespace": self.moduleName, "namespace": namespace, "api": api["apiName"] }

		if needsReturn and self.genAPITree:
			js += "		return %s;\n" % var

		return js

	def generateJS(self, jsTemplate, gperfTemplate, outDir):
		tree = self.apiTree
		namespace = ""
		#if "_className" not in tree:
			# 3rd party modules don't have a root Titanium object
			# so we get the root key by walking into the first top level entry
			#namespace = tree.keys()[0]
			#tree = tree[namespace]

		bootstrapJS = self.processNode(tree, namespace)

		bootstrap = os.path.join(outDir, "bootstrap.js")
		genBindings = os.path.join(outDir, "KrollGeneratedBindings.gperf")

		moduleClass = self.apiTree["_className"]
		bootstrapContext = {
			"globalsJS": self.globalsJS,
			"invocationJS": self.invocationJS,
			"bootstrapJS": bootstrapJS,
			"modulesWithCreate": json.dumps(self.modulesWithCreate),
			"moduleClass": moduleClass,
			"moduleName": self.moduleName
		}

		open(bootstrap, "w").write(jsTemplate % bootstrapContext)

		gperfContext = {
			"headers": self.headers,
			"bindings": "\n".join(self.initTable),
			"moduleName": self.moduleName[0].upper() + self.moduleName[1:]
		}

		open(genBindings, "w").write(gperfTemplate % gperfContext)

	def generateNative(self, javaTemplate, cppTemplate, javaDir, cppDir):
		jniPackage = self.moduleId.replace(".", "_")
		className = self.moduleName[0:1].upper() + self.moduleName[1:]

		context = {
			"moduleId": self.moduleId,
			"className": className,
			"jniPackage": jniPackage,
			"runtime": self.runtime
		}

		if self.runtime == "v8":
			bootstrapPath = os.path.join(javaDir, self.moduleId.replace(".", os.sep),)
			if not os.path.exists(bootstrapPath):
				os.makedirs(bootstrapPath)

			bootstrapJava = os.path.join(bootstrapPath, className + "Bootstrap.java")
			bootstrapCpp = os.path.join(cppDir, className + "Bootstrap.cpp")

			open(bootstrapJava, "w").write(javaTemplate % context)
			open(bootstrapCpp, "w").write(cppTemplate % context)
		else: # TODO rhino
			pass

def main():
	thisDir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
	sdkDir = os.path.abspath(os.path.join(thisDir, "..", ".."))
	sys.path.append(sdkDir)

	from manifest import Manifest

	if len(sys.argv) < 6:
		print >>sys.stderr, "Usage: %s <runtime> <moduleId> <moduleName> <moduleJSON> <outDir>" % sys.argv[0]
		sys.exit(1)

	runtime = sys.argv[1]
	moduleId = sys.argv[2]
	moduleName = sys.argv[3]
	moduleJSON = sys.argv[4]
	outDir = sys.argv[5]

	moduleBindings = json.load(open(moduleJSON))
	moduleClassName = moduleBindings["modules"].keys()[0]
	moduleName = moduleBindings["modules"][moduleClassName]["apiName"]

	b = Bootstrap(runtime, moduleBindings, moduleId=moduleId, moduleName=moduleName)
	b.needsReturn = True

	jsTemplate = open(os.path.join(thisDir, "generated", "bootstrap.js")).read()
	gperfTemplate = open(os.path.join(thisDir, "generated", "bootstrap.gperf")).read()

	b.generateJS(jsTemplate, gperfTemplate, outDir)

	javaTemplate = open(os.path.join(thisDir, "generated", "Bootstrap.java")).read()
	cppTemplate = open(os.path.join(thisDir, "generated", "bootstrap.cpp")).read()

	javaDir = os.path.join(outDir, "java")

	b.generateNative(javaTemplate, cppTemplate, javaDir, outDir)

if __name__ == "__main__":
	main()

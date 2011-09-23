#!/usr/bin/env python

import os, sys, json

GPERF_HEADER = """
%%define lookup-function-name lookupModuleInit
%%{
#include <string.h>
#include <v8.h>
%s
namespace internal {
typedef void (*ModuleInit)(v8::Handle<v8::Object> target);
using namespace titanium;

%s

%%}
struct moduleInit { const char *name; ModuleInit fn; };
%%%%
"""

GPERF_KEY = "%(key)s, _%(moduleName)s_init\n"

GPERF_FOOTER = """
}
"""

code = ""
modules = []
bindingPaths = []

thisDir = os.path.abspath(os.path.dirname(__file__))
androidDir = os.path.dirname(thisDir)
bindingPaths.append(os.path.join(androidDir, "titanium", ".apt_generated", "org", "appcelerator", "titanium", "bindings", "titanium.json"))

modulesDir = os.path.join(androidDir, "modules")
for module in os.listdir(modulesDir):
	jsonPath = os.path.join(modulesDir, module, ".apt_generated", "org", "appcelerator", "titanium", "bindings", module + ".json")
	if os.path.exists(jsonPath):
		bindingPaths.append(jsonPath)

for bindingPath in bindingPaths:
	moduleName = os.path.basename(bindingPath).replace(".json", "")
	modules.append(moduleName)
	binding = json.load(open(bindingPath))
	for module in binding["modules"]:
		code += GPERF_KEY % {"key": binding["modules"][module]["apiName"], "moduleName": moduleName}
	for proxy in binding["proxies"]:
		creatableInModule = binding["proxies"][proxy]["proxyAttrs"].get("creatableInModule", None)
		if creatableInModule and "DEFAULT" not in creatableInModule:
			api = binding["modules"][creatableInModule]["apiName"]
			code += GPERF_KEY % {"key": api.replace("Titanium", "") + binding["proxies"][proxy]["proxyAttrs"]["name"], "moduleName": moduleName }

code += "%%\n"

headers = ""
modulesCode = ""
for bindingPath in bindingPaths:
	moduleName = os.path.basename(bindingPath).replace(".json", "")
	binding = json.load(open(bindingPath))
	modulesCode += "static void _%s_init(v8::Handle<v8::Object> target)\n{\n" % moduleName

	initOrder = {}
	def addProxy(proxy):
		if proxy not in binding["proxies"]: return
		proxyObj = binding["proxies"][proxy]
		superPackage = proxyObj["superPackageName"]
		superProxy = proxyObj["superProxyClassName"]
		if "EventEmitter" not in superProxy:
			addProxy(superPackage + "." + superProxy)
		initOrder[proxy] = initOrder.get(proxy, 0) + 1

	for proxy in binding["proxies"]:
		addProxy(proxy)

	proxies = initOrder.keys()
	proxies.sort(lambda a, b: initOrder[a] - initOrder[b])
	proxies.reverse()

	for proxy in proxies:
		className = binding["proxies"][proxy]["proxyClassName"]
		if className in ("KrollProxy", "KrollModule"): continue

		headers += "#include \"%s.h\"\n" % proxy
		modulesCode += "\t%s::Initialize(target);\n" % className
	modulesCode += "}\n"

print (GPERF_HEADER % (headers, modulesCode)) + code + GPERF_FOOTER





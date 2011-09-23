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

%%}
struct moduleInit { const char *name; ModuleInit fn; };
%%%%
"""

GPERF_KEY = "%(apiName)s, %(className)s::Initialize\n"

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

headers = ""
for bindingPath in bindingPaths:
	binding = json.load(open(bindingPath))
	for proxy in binding["proxies"]:
		className = binding["proxies"][proxy]["proxyClassName"]
		apiName = binding["proxies"][proxy]["proxyAttrs"]["fullAPIName"]
		if className in ("KrollProxy", "KrollModule"): continue
		apiName = apiName.replace("Titanium.", "")

		code += GPERF_KEY % {"apiName": apiName, "className": className }
		headers += "#include \"%s.h\"\n" % proxy

code += "%%\n"

print (GPERF_HEADER % headers) + code + GPERF_FOOTER

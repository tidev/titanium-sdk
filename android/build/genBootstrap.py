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

GPERF_KEY = "%(moduleName)s, _%(moduleName)s_init\n"

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
	code += GPERF_KEY % {"moduleName": moduleName}

code += "%%\n"

headers = ""
modules_code = ""
for bindingPath in bindingPaths:
	moduleName = os.path.basename(bindingPath).replace(".json", "")
	binding = json.load(open(bindingPath))
	modules_code += "static void _%s_init(v8::Handle<v8::Object> target)\n{\n" % moduleName

	for proxy in binding["proxies"]:
		headers += "#include \"%s.h\"\n" % proxy
		modules_code += "\t%s::Initialize(target);\n" % binding["proxies"][proxy]["proxyClassName"]
	modules_code += "}\n"

print (GPERF_HEADER % (headers, modules_code)) + code + GPERF_FOOTER





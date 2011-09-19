#!/usr/bin/env python

import os, sys, json

GPERF_HEADER = """
%%define lookup-function-name lookupModuleInit
%%{
%s
namespace titanium {

%%}
struct moduleInit { const char *moduleName, ModuleInit fn };
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
for bindingPath in bindingPaths:
	moduleName = os.path.basename(bindingPath).replace(".json", "")
	binding = json.load(open(bindingPath))
	code += "void _%s_init(Handle<Object> ti)\n{\n" % moduleName

	for proxy in binding["proxies"]:
		headers += "#include \"%s.h\"\n" % proxy
		code += "\t%s::Initialize(ti);\n" % binding["proxies"][proxy]["proxyClassName"]
	code += "}\n"

print (GPERF_HEADER % headers) + code + GPERF_FOOTER





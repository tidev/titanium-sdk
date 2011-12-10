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
androidModuleDir = os.path.abspath(os.path.join(androidDir, "..", "support", "module", "android"))
jsonDir = os.path.abspath(os.path.join(androidDir, "..", "dist", "android", "json"))

sys.path.append(androidModuleDir)
import bootstrap

def loadBindings():
	bindingPaths = []
	bindings = { "proxies": {}, "modules": {} }
	for module in os.listdir(jsonDir):
		bindingsDir = os.path.join(jsonDir, "org", "appcelerator", "titanium", "bindings")
		for binding in os.listdir(bindingsDir):
			jsonPath = os.path.join(bindingsDir, binding)
			if os.path.exists(jsonPath):
				bindingPaths.append(jsonPath)

	for bindingPath in bindingPaths:
		moduleName = os.path.basename(bindingPath).replace(".json", "")
		binding = json.load(open(bindingPath))
		bindings["proxies"].update(binding["proxies"])
		bindings["modules"].update(binding["modules"])

	return bindings

def main():
	parser = optparse.OptionParser()
	parser.add_option("-r", "--runtime", dest="runtime", default=None)
	parser.add_option("-o", "--output", dest="output", default=None)

	(options, args) = parser.parse_args()

	if not options.runtime:
		print >>sys.stderr, "Error: --runtime is required"
		sys.exit(1)

	runtime = options.runtime
	bindings = loadBindings()

	b = bootstrap.Bootstrap(runtime, bindings,
		moduleId="titanium", moduleName="Titanium")

	jsTemplate = open(os.path.join(thisDir, "bootstrap.js")).read()
	gperfTemplate = open(os.path.join(thisDir, "bootstrap.gperf")).read()

	outDir = genDir
	if options.output != None:
		outDir = options.output

	b.generateJS(jsTemplate, gperfTemplate, outDir)

if __name__ == "__main__":
	main()


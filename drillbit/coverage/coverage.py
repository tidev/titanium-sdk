#!/usr/bin/env python
# Generates a Coverage Matrix given the following inputs:
# - Drillbit Test Coverage (Android, iOS)
# - Existing API points (Android, iOS)
# - TDoc2

import os
import sys
import re
import platform
import optparse
import logging
import codecs
import zipfile
import shutil
import yaml
import subprocess
from itertools import chain

try:
	import json
except ImportError, e:
	import simplejson as json

coverageDir = os.path.dirname(os.path.abspath(__file__))
drillbitDir = os.path.dirname(coverageDir)
mobileDir = os.path.dirname(drillbitDir)
supportAndroidDir = os.path.join(mobileDir, "support", "android")
sys.path.append(supportAndroidDir)

from mako.template import Template
from mako import exceptions

import bindings
import mappings

logging.basicConfig(
	format = '[%(asctime)s] [%(levelname)s] %(message)s',
	level = logging.INFO)
log = logging.getLogger("coverage")

def upperFirst(str):
	return str[0:1].upper() + str[1:]

def lowerFirst(str):
	return str[0:1].lower() + str[1:]


# lazily initialize a hierarchy of map of maps, and returns the final map
def lazyInitMap(root, *mapKeys):
	top = root
	for mapKey in mapKeys:
		if mapKey not in top:
			top[mapKey] = {}
		top = top[mapKey]
	return top

# iterate N levels of a map-of-map-of...N maps
def mapDeepIter(deepMap, nLevels, *mapKeys):
	if nLevels == 0:
		yield tuple(mapKeys)
	for key in deepMap.keys():
		obj = deepMap[key]
		if isinstance(obj, dict):
			mapDeepIter(obj, nLevels - 1)

# load up JSON blacklists for API sets
def loadBlacklist(apiname, platform):
	blacklistPath = os.path.join(coverageDir, "blacklist", platform.lower(), "%s.json" % apiname)
	if not os.path.isfile(blacklistPath):
		return { "functions": [], "properties": [] }

	print blacklistPath
	return json.load(open(blacklistPath))

class CoverageData(object):
	CATEGORY_TDOC = "tdoc"
	CATEGORY_BINDING = "binding"
	CATEGORY_DRILLBIT = "drillbit"
	TOP_LEVEL = "[Top Level]"
	TOTAL = "total"
	TOTAL_YES = "totalYes"

	ALL_CATEGORIES = [CATEGORY_TDOC, CATEGORY_BINDING, CATEGORY_DRILLBIT]
	categoryDesc = {
		CATEGORY_TDOC: "API Docs (TDoc)",
		CATEGORY_BINDING: "API Bindings",
		CATEGORY_DRILLBIT: "Drillbit Tests"
	}

	PLATFORM_ANDROID = "android"
	PLATFORM_IOS = "ios"
	ALL_PLATFORMS = [PLATFORM_ANDROID, PLATFORM_IOS]
	platformDesc = {
		PLATFORM_ANDROID: "Android",
		PLATFORM_IOS: "iOS"
	}

	STATUS_YES = "yes"
	STATUS_NO = "no"
	STATUS_NA = "na"

	statusDesc = {
		STATUS_YES: "Yes",
		STATUS_NO: "No",
		STATUS_NA: "N/A"
	}

	def __init__(self):
		self.modules = {}
		self.proxies = {}
		self.topLevel = {}
		self.disabledCategories = []
		self.category = None

		self.apiCount = { self.TOTAL: 0 }
		for category in self.ALL_CATEGORIES:
			self.apiCount[category] = { self.TOTAL : 0, self.TOTAL_YES: 0 }
			for platform in self.ALL_PLATFORMS:
				self.apiCount[category][platform] = {
					self.STATUS_YES: 0,
					self.STATUS_NO: 0,
					self.STATUS_NA: 0,
					self.TOTAL: 0
				}

	def getCategoryDesc(self, category):
		return self.categoryDesc[category]

	def disableCategory(self, category, platform):
		self.disabledCategories.append((category, platform))

	def setCategory(self, category):
		self.category = category

	def lazyGet(self, map, key):
		if not key.startswith("Titanium") and map != self.topLevel:
			key = "Titanium.%s" % key
		key = mappings.mapType(key)
		if key not in map:
			map[key] = {
				"properties": {}, "functions": {}
			}
		return map[key]

	def lazyGetFunctions(self, map, key):
		return self.lazyGet(map, key)["functions"]

	def lazyGetProperties(self, map, key):
		return self.lazyGet(map, key)["properties"]

	def addCreateFunction(self, module, proxy, platforms):
		self.addFunction("create" + proxy, module, platforms, isModule=True)

	def countAPI(self, map, key, platforms):
		if key not in map:
			map[key] = {}
			for category in self.ALL_CATEGORIES:
				map[key][category] = {}
				for platform in self.ALL_PLATFORMS:
					disabled = (category, platform) in self.disabledCategories
					if platform not in platforms or disabled:
						map[key][category][platform] = self.STATUS_NA
					else:
						map[key][category][platform] = self.STATUS_NO

		for platform in platforms:
			if platform in platforms:
				map[key][self.category][platform] = self.STATUS_YES

	def countAPIs(self):
		for componentType in [self.modules, self.proxies, self.topLevel]:
			for componentName in componentType.keys():
				component = componentType[componentName]
				for apiType in component.keys():
					apiTypeMap = component[apiType]
					for api in apiTypeMap.keys():
						apiMap = apiTypeMap[api]
						for category in apiMap.keys():
							categoryMap = apiMap[category]
							hasYes = False
							for platform in categoryMap.keys():
								status = categoryMap[platform]
								self.apiCount[category][platform][status] += 1
								if status != self.STATUS_NA:
									self.apiCount[category][platform][self.TOTAL] += 1
								if status == self.STATUS_YES:
									hasYes = True
							self.apiCount[category][self.TOTAL] += 1
							if hasYes:
								self.apiCount[category][self.TOTAL_YES] += 1
					self.apiCount[self.TOTAL] += 1

	def addFunction(self, fn, component, platforms, isModule=False, isTopLevel=False):
		if isModule:
			fns = self.lazyGetFunctions(self.modules, component)
		elif isTopLevel:
			fns = self.lazyGetFunctions(self.topLevel, component)
		else:
			fns = self.lazyGetFunctions(self.proxies, component)

		self.countAPI(fns, fn, platforms)

	def addProperty(self, property, component, platforms, isModule=False, getter=False, setter=False):
		if isModule:
			properties = self.lazyGetProperties(self.modules, component)
		else:
			properties = self.lazyGetProperties(self.proxies, component)

		self.countAPI(properties, property, platforms)

		upper = upperFirst(property)
		if getter:
			self.addFunction("get" + upper, component, platforms, isModule=isModule)
		if setter:
			self.addFunction("set" + upper, component, platforms, isModule=isModule)

	def getPlatformAPICount(self, platform):
		apiCount = 0
		for category in self.apiCount:
			if category == self.TOTAL: continue
			apiCount = max(apiCount, self.apiCount[category][platform][self.TOTAL])
		return apiCount

	def getPlatformCategoryPercent(self, category, platform):
		return self.formatPercent(
			self.apiCount[category][platform][self.STATUS_YES],
			self.getPlatformAPICount(platform))

	def formatPercent(self, n1, n2):
		if n2 == 0: return "100.00%"
		return "%.2f" % (100 * (n1 / float(n2)))

	def toJSON(self):
		return CoverageEncoder().encode({
			"modules": self.modules,
			"proxies": self.proxies,
			"topLevel": self.topLevel,
			"apiCount": self.apiCount
		})

class CoverageEncoder(json.JSONEncoder):
	def default(self, o):
		try:
			iterable = iter(o)
		except TypeError:
			pass
		else:
			return list(iterable)
		return json.JSONEncoder.default(self, o)

class CoverageMatrix(object):
	def __init__(self, seedData=None):
		self.data = CoverageData()
		self.delta = None
		if seedData:
			self.drillbitTests = seedData["drillbitTests"]
			self.androidBindings = seedData["androidBindings"]
			self.iosBindings = seedData["iosBindings"]
			self.drillbitCoverage = seedData["drillbitCoverage"]
			self.tdocTypes = seedData["tdocTypes"]
			if "delta" in seedData:
				self.delta = seedData["delta"]

	def initSources(self, options):
		self.initAndroidBindings(options.distAndroidDir)
		self.initIOSBindings(options.distIOSDir)
		self.initDrillbitCoverage(options.drillbitResultsDir)
		self.initDrillbitTests()
		self.initTDocData(options.tdocDir)

	def initAndroidBindings(self, distAndroidDir=None):
		log.info("Initializing Android bindings")
		self.androidBindings = []

		if distAndroidDir == None:
			distAndroidDir = os.path.join(mobileDir, "dist", "android")

		if not os.path.exists(distAndroidDir):
			log.warn("Skipping Android bindings, %s not found" % distAndroidDir)
			self.data.disableCategory(self.data.CATEGORY_BINDING, self.data.PLATFORM_ANDROID)
			return

		for jar in os.listdir(distAndroidDir):
			if not jar.endswith('.jar'): continue
			jarPath = os.path.join(distAndroidDir, jar)
			moduleBindings = bindings.get_module_bindings(zipfile.ZipFile(jarPath))
			if moduleBindings != None:
				self.androidBindings.append(moduleBindings)

	def initIOSBindings(self, distIOSDir=None):
		log.info("Initializing iOS bindings")
		self.iosBindings = []

		if distIOSDir == None:
			distIOSDir = os.path.join(mobileDir, "dist", "ios")

		if not os.path.exists(distIOSDir):
			log.warn("Skipping iOS bindings, %s not found" % distIOSDir)
			self.data.disableCategory(self.data.CATEGORY_BINDING, self.data.PLATFORM_IOS)
			return

		for file in os.listdir(distIOSDir):
			if not file.endswith('.json'): continue
			abspath = os.path.join(distIOSDir, file)
			data = open(abspath, "r").read()
			if data != '': self.iosBindings.append(json.loads(data))

	def initDrillbitCoverage(self, drillbitResultsDir=None):
		log.info("Initializing Drillbit coverage")
		self.drillbitCoverage = {}

		if drillbitResultsDir == None:
			drillbitBuildDir = os.path.join(mobileDir, "build", "drillbit")
			if platform.system() == "Darwin":
				drillbitContentsDir = os.path.join(drillbitBuildDir, "Drillbit.app", "Contents")
			else:
				drillbitContentDir = os.path.join(drillbitBuildDir, "Drillbit")
			drillbitResultsDir = os.path.join(drillbitContentsDir, "Resources", "test_results")

		if not os.path.exists(drillbitResultsDir):
			log.warn("Skipping Drillbit Test Coverage, %s not found" % drillbitResultsDir)
			for p in self.data.ALL_PLATFORMS:
				self.data.disableCategory(self.data.CATEGORY_DRILLBIT, p)
			return

		for f in os.listdir(drillbitResultsDir):
			if f.endswith("Coverage.json"):
				data = json.loads(open(os.path.join(drillbitResultsDir, f), "r").read())
				self.mergeDrillbitCoverage(data)

		self.pruneDrillbitCoverage()

		for p in self.data.ALL_PLATFORMS:
			if p not in self.drillbitCoverage:
				log.warn("Skipping Drillbit Test Coverage for %s platform, no data was found" % p)
				self.data.disableCategory(self.data.CATEGORY_DRILLBIT, p)

	def mergeDrillbitCoverage(self, data):
		for platform in data.keys():
			if platform not in self.drillbitCoverage:
				self.drillbitCoverage[platform] = {}
			for apiType in data[platform].keys():
				if apiType not in self.drillbitCoverage[platform]:
					self.drillbitCoverage[platform][apiType] = {}
				for component in data[platform][apiType].keys():
					if component not in self.drillbitCoverage[platform][apiType]:
						self.drillbitCoverage[platform][apiType][component] = {}
					for api in data[platform][apiType][component].keys():
						if api not in self.drillbitCoverage[platform][apiType][component]:
							self.drillbitCoverage[platform][apiType][component][api] = {}
						for coverageType in data[platform][apiType][component][api].keys():
							if coverageType == "_type":
								self.drillbitCoverage[platform][apiType][component][api]["_type"] = data[platform][apiType][component][api]["_type"]
								continue
							start = 0
							if coverageType in self.drillbitCoverage[platform][apiType][component][api]:
								start = self.drillbitCoverage[platform][apiType][component][api][coverageType]
							self.drillbitCoverage[platform][apiType][component][api][coverageType] = start + data[platform][apiType][component][api][coverageType]

	def pruneDrillbitCoverage(self):
		for platform in self.drillbitCoverage.keys():
			platformMap = self.drillbitCoverage[platform]
			for apiType in platformMap:
				componentMap = platformMap[apiType]
				for componentName in componentMap:
					allBlacklist = loadBlacklist(componentName, "all")
					platformBlacklist = loadBlacklist(componentName, platform)
					if apiType in platformMap and componentName in componentMap:
						component = componentMap[componentName]
						for fn in chain(allBlacklist["functions"], platformBlacklist["functions"]):
							log.warn("Removing %s.%s from drillbit coverage" % (componentName, fn))
							if fn in component:
								del component[fn]
						for property in chain(allBlacklist["properties"], platformBlacklist["properties"]):
							log.warn("Removing %s.%s from drillbit coverage" % (componentName, property))
							if property in component:
								del component[property]
			if platform == "android":
				for yahooMethod in ["b64_hmac_sha1", "oauthRequest",\
					"percentEscape", "setOAuthParameters", "yql", "yqlO"]:
					platformMap["modules"]["Titanium.Yahoo"][yahooMethod]["_type"] = "function"

	def initDrillbitTests(self):
		os.chdir(drillbitDir)
		rhinoJar = os.path.join(mobileDir, "android", "titanium", "lib", "js.jar")
		self.drillbitTests = json.loads(subprocess.Popen(
			["java", "-jar", rhinoJar, "drillbit.js"], stdout=subprocess.PIPE).communicate()[0])

	def initTDocData(self, tdocDir=None):
		log.info("Initializing TDoc data")
		self.tdocTypes = []

		if tdocDir == None:
			tdocDir = os.path.join(mobileDir, "apidoc")

		if not os.path.exists(tdocDir):
			log.warn("Skipping TDoc data, %s not found" % tdocDir)
			for platform in self.data.ALL_PLATFORMS:
				self.data.disabledCategory(self.data.CATEGORY_TDOC, platform)
			return

		for root, dirs, files in os.walk(tdocDir):
			for file in files:
				if file.endswith(".yml") and not file.endswith("template.yml"):
					absolutePath = os.path.join(root, file)
					self.tdocTypes.extend([t for t in yaml.load_all(codecs.open(absolutePath, 'r', 'utf8').read())])

	def findAndroidBinding(self, className):
		for binding in self.androidBindings:
			if "proxies" in binding:
				for proxyClass in binding["proxies"].keys():
					if proxyClass == className: return binding["proxies"][proxyClass]
		return None

	def findAndroidModuleForPackage(self, packageName):
		for binding in self.androidBindings:
			if "proxies" in binding and "modules" in binding:
				for proxyClass in binding["proxies"].keys():
					if binding["proxies"][proxyClass]["isModule"] and binding["proxies"][proxyClass]["packageName"] == packageName:
						return binding["proxies"][proxyClass]
		return None

	def genAndroidBindingData(self):
		log.info("Generating coverage for Android bindings")
		self.data.setCategory(self.data.CATEGORY_BINDING)

		proxyDefault = "org.appcelerator.kroll.annotations.Kroll.DEFAULT"
		platforms = [self.data.PLATFORM_ANDROID]
		allowModuleTopLevelMethods = ["decodeURIComponent", "encodeURIComponent"]

		for binding in self.androidBindings:
			for proxyClass in binding["proxies"].keys():
				proxy = binding["proxies"][proxyClass]
				isModule = proxy['isModule']
				proxyFullAPI = proxy["proxyAttrs"]["fullAPIName"]

				allBlacklist = loadBlacklist(proxyFullAPI, "all")
				androidBlacklist = loadBlacklist(proxyFullAPI, self.data.PLATFORM_ANDROID)
				blacklistFns = [fn for fn in chain(allBlacklist["functions"], androidBlacklist["functions"])]
				blacklistProps = [p for p in chain(allBlacklist["properties"], androidBlacklist["properties"])]

				if "creatableInModule" in proxy["proxyAttrs"]:
					moduleClass = proxy["proxyAttrs"]["creatableInModule"]
					if moduleClass != proxyDefault:
						moduleAPI = self.findAndroidBinding(moduleClass)["proxyAttrs"]["fullAPIName"]
						self.data.addCreateFunction(moduleAPI, proxy["proxyAttrs"]["name"], platforms)
					elif not isModule:
						# Proxies w/o "creatableInModule" need a namespace fix
						module = self.findAndroidModuleForPackage(proxy["packageName"])
						if module != None:
							proxyFullAPI = module["proxyAttrs"]["fullAPIName"] + "." + proxyFullAPI
				if "propertyAccessors" in proxy["proxyAttrs"]:
					for accessor in proxy["proxyAttrs"]["propertyAccessors"]:
						self.data.addProperty(accessor, proxyFullAPI, platforms, isModule=isModule, getter=True, setter=True)
				if "methods" in proxy:
					for method in proxy["methods"].keys():
						methodName = proxy["methods"][method]["apiName"]
						topLevel = False
						if "topLevelMethods" in proxy and method in proxy["topLevelMethods"]:
							for topLevelName in proxy["topLevelMethods"][method]:
								parent = self.data.TOP_LEVEL
								if "." in topLevelName:
									parts = topLevelName.split(".")
									parent = ".".join(parts[0:-1])
									name = parts[-1]
								else:
									name = topLevelName
							topLevel = True
							if name not in blacklistFns:
								self.data.addFunction(name, parent, platforms, isTopLevel=True)
						if not topLevel or methodName in allowModuleTopLevelMethods:
							# For the sake of coverage, we only add a top level method once
							# even though technically it may be bound in two places
							if methodName not in blacklistFns:
								self.data.addFunction(methodName, proxyFullAPI, platforms, isModule=isModule)
				if "properties" in proxy:
					for prop in proxy["properties"].keys():
						property = proxy["properties"][prop]["name"]
						# ignore getter/setter here for now
						#getter = proxy["properties"][prop]["get"]
						#setter = proxy["properties"][prop]["set"]
						if property not in blacklistProps:
							self.data.addProperty(property, proxyFullAPI, platforms, isModule=isModule)
				if "dynamicProperties" in proxy:
					for dynProp in proxy["dynamicProperties"].keys():
						property = proxy["dynamicProperties"][dynProp]["name"]
						getter = proxy["dynamicProperties"][dynProp]["get"]
						setter = proxy["dynamicProperties"][dynProp]["set"]
						if property not in blacklistProps:
							self.data.addProperty(property, proxyFullAPI, platforms, isModule=isModule, getter=getter, setter=setter)
				if "dynamicApis" in proxy:
					if "properties" in proxy["dynamicApis"]:
						for property in proxy["dynamicApis"]["properties"]:
							self.data.addProperty(property, proxyFullAPI, platforms, isModule=isModule)
					if "methods" in proxy["dynamicApis"]:
						for method in proxy["dynamicApis"]["methods"]:
							self.data.addFunction(method, proxyFullAPI, platforms, isModule=isModule)
				if "constants" in proxy:
					for constant in proxy["constants"].keys():
						self.data.addProperty(constant, proxyFullAPI, platforms, isModule=isModule)

	def genIOSBindingData(self):
		iosSubmodules = ['iOS', 'iPhone', 'iPad', 'Socket', 'Properties']
		iosInternals = ['Proxy', 'Module', 'Animation', 'Toolbar', 
			'Window', 'View', 'File', 'Stream', 'DataStream',
			'Rect', 'TextWidget']

		log.info("Generating coverage for iOS...")
		platforms = [self.data.PLATFORM_IOS]
		for binding in self.iosBindings:
			for iosClass in binding.keys():
				superclass = binding[iosClass]["super"] #TODO: load superclass props, etc.
				isModule = (superclass == "TiModule")

				# Easy detection for API space for modules
				if isModule:
					match = re.search('^(.*)Module$', iosClass)
					if match: # better match
						moduleName = match.group(1)
						if moduleName == "TopTi":
							fullAPI = "Titanium"
						else:
							fullAPI = "Titanium." + match.group(1)
				else:
					# Trim Ti(.*)Proxy if necessary
					actualClass = iosClass
					if iosClass == "TiUIiOS3DMatrix":
						actualClass = "TiUIiOS3DMatrixProxy"
					match = re.search('^Ti(.*?)(Proxy)?$', iosClass)
					canCreate = False
					if match:
						relevant = match.group(1)
						if match.group(2) == 'Proxy':
							canCreate = True
						# These are the modules with names which don't 
						match = re.search('^((?:API)|(?:UI)|(?:XML))(.*)', relevant)
						if match:
							moduleName = match.group(1)
							proxyName = match.group(2)
						else:
							split = re.split('([A-Z])', relevant, maxsplit=2)
							if len(split) > 4:
								moduleName = split[1] + split[2]
								proxyName = split[3] + split[4]
							else:
								moduleName = None
								proxyName = relevant

						# 1. Are we a submodule?
						if proxyName in iosSubmodules:
							isModule = True
						else:
							# 2. Are we located in a submodule namespace?
							for submodule in iosSubmodules:
								pos = proxyName.find(submodule)
								if pos != -1:
									subproxy = proxyName[pos+len(submodule):]
									if canCreate:
										self.data.addFunction("create%s" % subproxy, 
											"Titanium.%s.%s" % (moduleName, submodule),
											platforms, isModule=True)
										# Short circuit later canCreate check
										canCreate = False
									proxyName = "%s.%s" % (submodule, subproxy)
									break

						# Skip internal classes
						if proxyName in iosInternals and moduleName is None:
							log.warn("Class %s is internal to iOS, pruning" % iosClass)
							continue

						if moduleName is None:
							fullAPI = "Titanium.%s" % proxyName
						else:
							if canCreate:
								self.data.addFunction("create%s" % proxyName,
													  "Titanium.%s" % moduleName,
													  platforms,
													  isModule=True)
							fullAPI = "Titanium.%s.%s" % (moduleName, proxyName)
							
				blacklist = loadBlacklist(fullAPI, self.data.PLATFORM_IOS)

				for method in binding[iosClass]["methods"]:
					if not method in blacklist["functions"]:
						self.data.addFunction(method, fullAPI, platforms, isModule=isModule)

				for property in binding[iosClass]["properties"]:
					if property in blacklist["properties"]:
						continue
						
					# If we have an all-uppercase name, consider it a constant -
					# by naming convention
					if property.isupper():
						self.data.addProperty(property, fullAPI, platforms, 
							isModule=isModule)
					else:
						# NOTE: We ignore 'getter' because iOS autogenerates
						# getX() functions for every property x, meaning
						# this screws with our coverage
						propInfo = binding[iosClass]["properties"][property]
						self.data.addProperty(property, fullAPI, platforms, 
							isModule=isModule, getter=True, setter=propInfo["set"])

	def proxyHasAPI(self, proxy, api):
		# try to find an API point in the component itself first
		if "propertyAccessors" in proxy["proxyAttrs"]:
			for accessor in proxy["proxyAttrs"]["propertyAccessors"]:
				if accessor == api:
					return True
				if ("get" + upperFirst(accessor)) == api:
					return True
				if  ("set" + upperFirst(accessor)) == api:
					return True
		if "methods" in proxy:
			for method in proxy["methods"].keys():
				methodName = proxy["methods"][method]["apiName"]
				if methodName == api:
					return True
		if "dynamicProperties" in proxy:
			for dynProp in proxy["dynamicProperties"].keys():
				property = proxy["dynamicProperties"][dynProp]["name"]
				getter = proxy["dynamicProperties"][dynProp]["get"]
				setter = proxy["dynamicProperties"][dynProp]["set"]
				if property == api:
					return True
				if getter and ("get" + upperFirst(property)) == api:
					return True
				if setter and ("set" + upperFirst(property)) == api:
					return True
		if "constants" in proxy:
			for constant in proxy["constants"].keys():
				if constant == api:
					return True
		return False

	def findSuperProxyBinding(self, proxy):
		className = proxy["superProxyBindingClassName"]
		className = className.replace("BindingGen", "")

		for binding in self.androidBindings:
			if className in binding["proxies"]:
				return binding["proxies"][className]
		return None

	def getProxyAPIName(self, proxy):
		apiName = proxy["proxyAttrs"]["fullAPIName"]
		if not apiName.startswith("Titanium"):
			apiName = "Titanium." + apiName
		return mappings.mapType(apiName)

	def getComponentNameForAPI(self, component, api):
		# Walk the android bindings (our best data set?) to see where an api is originally defined
		component = mappings.mapType(component)
		for binding in self.androidBindings:
			for proxyClass in binding["proxies"].keys():
				proxy = binding["proxies"][proxyClass]
				apiName = self.getProxyAPIName(proxy)

				if apiName == component:
					# try to find an API point in the component itself first
					if self.proxyHasAPI(proxy, api):
						return component
					elif "superProxyBindingClassName" in proxy:
						superProxy = self.findSuperProxyBinding(proxy)
						while superProxy != None:
							superAPIName = self.getProxyAPIName(superProxy)
							if self.proxyHasAPI(superProxy, api):
								return superAPIName
							if "superProxyBindingClassName" not in superProxy:
								return None
							superProxy = self.findSuperProxyBinding(superProxy)
		return None

	def countDrillbitCoverage(self, platform, apiType, component, api):
		platforms = [platform]
		apiCount = self.drillbitCoverage[platform][apiType][component][api]
		if component == "Titanium.Yahoo" and "propertySet" in apiCount:
			# prune when the Titanium.Yahoo APIs are set from the module JS
			del apiCount["propertySet"]

		if "propertyGet" in apiCount or "propertySet" in apiCount or "functionCall" in apiCount:
			isModule = apiType == "modules"
			isTopLevel = apiType == "other"
			componentName = self.getComponentNameForAPI(component, api) or component
			if componentName == "Titanium.Kroll":
				componentName = "Titanium.Proxy"
				isModule = False
			sourceName = component + "." + api
			if sourceName in self.drillbitCoverage[platform]["modules"]:
				log.warn("Skipping module as property accessor %s" % sourceName)
				return
			if apiCount["_type"] == "function":
				if isTopLevel:
					c = component
					if component == "TOP_LEVEL":
						c = self.data.TOP_LEVEL
					self.data.addFunction(api, c, platforms, isTopLevel=True)
				else:
					self.data.addFunction(api, componentName, platforms, isModule=isModule)
			else:
				self.data.addProperty(api, componentName, platforms, isModule=isModule)

	def genDrillbitCoverageData(self):
		self.data.setCategory(self.data.CATEGORY_DRILLBIT)

		for platform in self.drillbitCoverage.keys():
			log.info("Generating coverage for Drillbit / %s" % platform)
			for apiType in self.drillbitCoverage[platform].keys():
				for component in self.drillbitCoverage[platform][apiType].keys():
					for api in self.drillbitCoverage[platform][apiType][component].keys():
						self.countDrillbitCoverage(platform, apiType, component, api)

	def hasAnyPlatform(self, obj, platforms):
		if "platforms" in obj:
			for platform in platforms:
				if platform in obj["platforms"]: return True
			# platforms specified, but none from this list
			return False
		# No explict platforms -> all platforms
		return True

	def tdocPlatforms(self, tdocObj):
		if "platforms" not in tdocObj:
			return self.data.ALL_PLATFORMS
		platforms = []
		for platform in tdocObj["platforms"]:
			if platform in ["ios", "iphone", "ipad"]:
				platforms.append(self.data.PLATFORM_IOS)
			elif platform == "android":
				platforms.append(self.data.PLATFORM_ANDROID)
		return platforms

	def tdocTypeExtends(self, tdocType, superType):
		while tdocType != None:
			if "extends" in tdocType:
				if tdocType["extends"] == superType:
					return True
			else:
				return False

			tdocType = self.findTDocType(tdocType["extends"])

	def findTDocType(self, typeName):
		for tdocType in self.tdocTypes:
			if tdocType["name"] == typeName:
				return tdocType
		return None

	def genTDocData(self):
		self.data.setCategory(self.data.CATEGORY_TDOC)
		log.info("Generating coverage for TDoc")
		for tdocType in self.tdocTypes:
			component = tdocType["name"]
			typePlatforms = self.tdocPlatforms(tdocType)
			if "extends" not in tdocType and component != "Titanium.Proxy" and not component.startswith("Global"):
				log.warn("Skipping TDoc type %s (no 'extends')" % component)
				continue
			isModule = False
			isTopLevel = False
			if component == "Titanium.Module": isModule = True
			if component.startswith("Global"):
				isTopLevel = True
				component = re.sub(r"Global\.?", "", component)
				if component == "":
					component = self.data.TOP_LEVEL
			if "extends" in tdocType and tdocType["extends"] == "Titanium.Module": isModule = True
			if "methods" in tdocType:
				for method in tdocType["methods"]:
					methodPlatforms = self.tdocPlatforms(method)
					if methodPlatforms == self.data.ALL_PLATFORMS:
						methodPlatforms = typePlatforms
					self.data.addFunction(method["name"], component, methodPlatforms, isModule=isModule, isTopLevel=isTopLevel)
			if "properties" in tdocType:
				for property in tdocType["properties"]:
					propertyPlatforms = self.tdocPlatforms(property)
					if propertyPlatforms == self.data.ALL_PLATFORMS:
						propertyPlatforms = typePlatforms
					getter = True
					setter = True
					if "permission" in property:
						if property["permission"] == "read-only":
							setter = False
						elif property["permission"] == "write-only":
							getter = False
						# read-write is the default setting
					if property["name"].upper() == property["name"]:
						# All upper -- most likely a constant?
						getter = False
						setter = False

					if "accessors" in property and not property["accessors"]:
						# Explicitly requested no getter/setter method
						getter = False
						setter = False

					if "availability" in property and property["availability"] == "creation":
						getter = False
						setter = False

					self.data.addProperty(property["name"], component, propertyPlatforms, isModule=isModule, getter=getter, setter=setter)
			if not isModule and self.tdocTypeExtends(tdocType, "Titanium.Proxy"):
				createable = tdocType.get("createable", True)
				if createable:
					parts = tdocType["name"].split(".")
					moduleName = ".".join(parts[:-1])
					proxyName = parts[-1]
					self.data.addCreateFunction(moduleName, proxyName, typePlatforms)


	def genDelta(self, deltaSeedFile):
		otherData = open(deltaSeedFile, "r").read()
		other = CoverageMatrix(json.loads(otherData))
		other.genData()

		self.delta = {"apis": {}, "tests": {}, "added": {}, "removed": {}}
		for category in self.data.ALL_CATEGORIES:
			self.delta["apis"][category] = \
				self.data.apiCount[category][self.data.TOTAL_YES] - \
					other.data.apiCount[category][self.data.TOTAL_YES]

		self.delta["tests"][self.data.CATEGORY_DRILLBIT] = \
			self.drillbitTests[self.data.TOTAL] - other.drillbitTests[self.data.TOTAL]

		def deltaApiIsYes(componentType, componentName, apiType, api, category, platform):
			if componentType == self.data.modules: deltaComponentType = other.data.modules
			elif componentType == self.data.proxies: deltaComponentType = other.data.proxies
			else: deltaComponentType = other.data.topLevel

			if componentName not in deltaComponentType: return False
			if apiType not in deltaComponentType[componentName]: return False
			if api not in deltaComponentType[componentName][apiType]: return False
			if category not in deltaComponentType[componentName][apiType][api]: return False
			if platform not in deltaComponentType[componentName][apiType][api][category]: return False
			return deltaComponentType[componentName][apiType][api][category][platform] == other.data.STATUS_YES

		def logApiDelta(componentName, apiType, api, category, platform, added):
			deltaMap = self.delta["added"]
			apiName = "%s.%s" % (componentName, api)
			if not added:
				deltaMap = self.delta["removed"]

			apiTypeMap = lazyInitMap(deltaMap, category, apiType)
			if apiName not in apiTypeMap:
				apiTypeMap[apiName] = []
			apiTypeMap[apiName].append(platform)

		for componentType in (self.data.modules, self.data.proxies, self.data.topLevel):
			for componentName in componentType.keys():
				component = componentType[componentName]
				for apiType in component.keys():
					apiTypeMap = component[apiType]
					for api in apiTypeMap.keys():
						apiMap = apiTypeMap[api]
						for category in apiMap.keys():
							categoryMap = apiMap[category]
							for platform in categoryMap.keys():
								status = categoryMap[platform]
								if status == self.data.STATUS_YES:
									if not deltaApiIsYes(componentType, componentName, apiType, api, category, platform):
										logApiDelta(componentName, apiType, api, category, platform, True)
								else:
									if deltaApiIsYes(componentType, componentName, apiType, api, category, platform):
										logApiDelta(componentName, apiType, api, category, platform, False)

	def genData(self):
		# Order is important here
		self.genTDocData()
		self.genAndroidBindingData()
		self.genIOSBindingData()
		self.genDrillbitCoverageData()
		# TODO self.genDrillbitCoverageData("iphone")
		self.data.countAPIs()

	def genMatrix(self, options):
		outDir = options.outDir

		self.genJSON(outDir)
		self.genHTML(outDir)
		if options.genWiki:
			self.genWiki(outDir)

		log.info("Coverage report generated")
		log.info("  HTML: %s" % os.path.join(outDir, "index.html"))
		if options.genWiki:
			log.info("  Wiki: %s" % os.path.join(outDir, "summary.wiki"))
		log.info("  JSON: %s" % os.path.join(outDir, "matrixData.json"))
		log.info("  Seed JSON: %s" % os.path.join(outDir, "seed.json"))


	def countCoverage(self, components, name, category, platform=None):
		class count: pass
		count.yes = 0
		count.no = 0
		count.na = 0
		def countStatus(status):
			if status == self.data.STATUS_YES:
				count.yes += 1
			elif status == self.data.STATUS_NO:
				count.no += 1
			else:
				count.na += 1

		for type in components[name].keys():
			typeMap = components[name][type]
			for typeName in typeMap.keys():
				categoryMap = typeMap[typeName][category]
				if platform == None:
					for p in self.data.ALL_PLATFORMS:
						countStatus(categoryMap[p])
				else:
					countStatus(categoryMap[platform])

		return count.yes, count.no, count.na

	def genJSON(self, outDir):
		mdFile = open(os.path.join(outDir, "matrixData.json"), "w")
		mdFile.write(self.data.toJSON())
		mdFile.close()

		seedFile = open(os.path.join(outDir, "seed.json"), "w")
		data = {
			"androidBindings": self.androidBindings,
			"iosBindings": self.iosBindings,
			"drillbitCoverage": self.drillbitCoverage,
			"drillbitTests": self.drillbitTests,
			"tdocTypes": self.tdocTypes
		}

		if self.delta != None:
			data["delta"] = self.delta

		seedFile.write(json.dumps(data))
		seedFile.close()

	def renderTemplate(self, tmpl, outPath, **kwargs):
		try:
			content = tmpl.render(**kwargs)
			open(outPath, "w").write(content)
		except:
			print exceptions.text_error_template().render()
			sys.exit(1)

	def genHTML(self, outDir):
		indexTemplate = Template(filename=os.path.join(coverageDir, "index.html"),
			output_encoding="utf-8", encoding_errors="replace")
		componentTemplate = Template(filename=os.path.join(coverageDir, "component.html"),
			output_encoding="utf-8", encoding_errors="replace")
		deltaTemplate = Template(filename=os.path.join(coverageDir, "delta.html"),
			output_encoding="utf-8", encoding_errors="replace")

		self.renderTemplate(indexTemplate,
			os.path.join(outDir, "index.html"),
			data = self.data,
			drillbitTests = self.drillbitTests,
			delta = self.delta,
			countCoverage = self.countCoverage,
			upperFirst = upperFirst)

		if self.delta != None:
			self.renderTemplate(deltaTemplate,
				os.path.join(outDir, "delta.html"),
				data = self.data,
				delta = self.delta)

		def toComponentHTML(components, prefix):
			for component in components:
				self.renderTemplate(componentTemplate,
					os.path.join(outDir, "%s-%s.html" % (prefix, component)),
					data = self.data,
					components = components,
					component = component,
					label = upperFirst(prefix),
					countCoverage = self.countCoverage,
					upperFirst = upperFirst)

		toComponentHTML(self.data.modules, "module")
		toComponentHTML(self.data.proxies, "proxy")
		toComponentHTML(self.data.topLevel, "topLevel")

		copyFiles = ["coverage.css"]
		for copyFile in copyFiles:
			path = os.path.join(coverageDir, copyFile)
			shutil.copy(path, outDir)

	def genWiki(self, outDir):
		summaryTemplate = Template(filename=os.path.join(coverageDir, "summary.wiki"),
			output_encoding="utf-8", encoding_errors="replace")

		self.renderTemplate(summaryTemplate,
			os.path.join(outDir, "summary.wiki"),
			data = self.data,
			drillbitTests = self.drillbitTests,
			delta = self.delta,
			countCoverage = self.countCoverage,
			upperFirst = upperFirst)

def main():
	parser = optparse.OptionParser()
	parser.add_option("-s", "--seed", dest="seedFile",
		default=None, help="Seed the matrix with pre-initialized JSON data")
	parser.add_option("--delta-seed", dest="deltaSeedFile",
		default=None, help="Generate delta information from a previous coverage report with a path to the report's seed.json")
	parser.add_option("-o", "--output", dest="outDir",
		default=None, help="The output directory that the coverage report is generated to")
	parser.add_option("-a", "--dist-android-dir", dest="distAndroidDir",
		default=None, help="The directory that contains all of the built Android module and runtime JARs (default: dist/android)")
	parser.add_option("-i", "--dist-ios-dir", dest="distIOSDir",
		default=None, help="The directory that contains the iOS binding JSON (default: dist/ios)")
	parser.add_option("-d", "--drillbit-results-dir", dest="drillbitResultsDir",
		default=None, help="The directory that contains Drillbit's test results JSON (default: build/drillbit/Drillbit.app/Contents/Resources/test_results")
	parser.add_option("-t", "--tdoc-dir", dest="tdocDir",
		default=None, help="The directory that contains TDoc2 YML files (default: apidoc)")
	parser.add_option("-w", "--gen-wiki", dest="genWiki", action="store_true",
		default=False, help="Generate wiki data (requires a delta seed, default: no)")
	(options, args) = parser.parse_args()

	seedData = None
	if options.seedFile != None:
		seedData = json.loads(open(options.seedFile, "r").read())

	outDir = options.outDir
	if options.outDir == None:
		options.outDir = os.path.join(mobileDir, "dist", "coverage")

	if not os.path.exists(options.outDir):
		os.makedirs(options.outDir)

	matrix = CoverageMatrix(seedData)
	if seedData == None:
		matrix.initSources(options)

	matrix.genData()

	if options.deltaSeedFile != None:
		matrix.genDelta(options.deltaSeedFile)

	if options.genWiki:
		if options.deltaSeedFile == None:
			log.error("Wiki generation requires a delta seed file be supplied with --delta-seed")
			sys.exit(1)
	
	matrix.genMatrix(options)

if __name__ == "__main__":
	main()

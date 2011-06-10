#!/usr/bin/env python
# Generates a Coverage Matrix given the following inputs:
# - Drillbit Test Coverage (Android, iOS)
# - Existing API points (Android, iOS)
# - TDoc2

import os, sys
import platform
import optparse
import logging
import codecs
import zipfile
import shutil
import yaml

try:
	import json
except ImportError, e:
	import simplejson as json

coverageDir = os.path.dirname(sys._getframe(0).f_code.co_filename)
drillbitDir = os.path.dirname(coverageDir)
mobileDir = os.path.dirname(drillbitDir)
supportAndroidDir = os.path.join(mobileDir, "support", "android") 
sys.path.append(supportAndroidDir)

import bindings

logging.basicConfig(
	format = '[%(asctime)s] [%(levelname)s] %(message)s',
	level = logging.INFO)
log = logging.getLogger("coverage")

def upperFirst(str):
	return str[0:1].upper() + str[1:]

def lowerFirst(str):
	return str[0:1].lower() + str[1:]

mapTypes = {
	"Titanium.Activity": "Titanium.Android.Activity",
	"Titanium.Intent": "Titanium.Android.Intent",
	"Titanium.Service": "Titanium.Android.Service",
	"Titanium.Menu": "Titanium.Android.Menu",
	"Titanium.MenuItem": "Titanium.Android.MenuItem",
	"Android.Notification": "Titanium.Android.Notification",
	"Analytics": "Titanium.Analytics",
	"Titanium.Database.TiDatabase": "Titanium.Database.DB",
	"Titanium.TiDatabase": "Titanium.Database.DB",
	"Titanium.Database.TiResultSet": "Titanium.Database.ResultSet",
	"Titanium.TiResultSet": "Titanium.Database.ResultSet",
	"Titanium.File": "Titanium.Filesystem.File",
	"Titanium.FileStream": "Titanium.Filesystem.FileStream",
	"Titanium.Socket.TCP": "Titanium.Network.Socket.TCP",
	"Titanium.TiBlob": "Titanium.Blob",
	"Titanium.BlobStream": "Titanium.Stream.BlobStream",
	"Titanium.BufferStream": "Titanium.Stream.BufferStream",
	"Titanium.TiView": "Titanium.UI.View",
	"Titanium.TiWindow": "Titanium.UI.Window",
	"Titanium.Ti2DMatrix": "Titanium.UI.2DMatrix",
	"Titanium.Attr": "Titanium.XML.Attr",
	"Titanium.CDATASection": "Titanium.XML.CDATASection",
	"Titanium.Document": "Titanium.XML.Document",
	"Titanium.Element": "Titanium.XML.Element",
	"Titanium.NamedNodeMap": "Titanium.XML.NamedNodeMap",
	"Titanium.NodeList": "Titanium.XML.NodeList",
	"Titanium.String": "String",
	"Titanium.Text": "Titanium.XML.Text",
	"Titanium.XPathNodeList": "Titanium.XML.XPathNodeList"
}
def mapType(type):
	"""Normalizes types that are slightly
	different between the different sources"""
	if type in mapTypes: return mapTypes[type]
	return type

class CoverageData(object):
	ANDROID_TDOC = "androidTDoc"
	IOS_TDOC = "iosTDoc"
	ANDROID_BINDING = "androidBinding"
	IOS_BINDING = "iosBinding"
	ANDROID_DRILLBIT = "androidDrillbit"
	IOS_DRILLBIT = "iosDrillbit"
	TOP_LEVEL = "[Top Level]"

	categories = [ANDROID_TDOC, ANDROID_BINDING, ANDROID_DRILLBIT]
	categoryDesc = {
		ANDROID_TDOC: "Android TDoc",
		IOS_TDOC: "iOS TDoc",
		ANDROID_BINDING: "Android Bindings",
		IOS_BINDING: "iOS Bindings",
		ANDROID_DRILLBIT: "Android Drillbit",
		IOS_DRILLBIT: "iOS Drillbit"
	}

	def __init__(self):
		self.modules = {}
		self.proxies = {}
		self.topLevel = {}
		self.category = None

	def getCategoryDesc(self, category):
		return self.categoryDesc[category]

	def setCategory(self, category):
		self.category = category

	def lazyGet(self, map, key):
		if not key.startswith("Titanium") and map != self.topLevel:
			key = "Titanium.%s" % key
		key = mapType(key)
		if key not in map:
			map[key] = {
				"properties": {}, "functions": {}
			}
		return map[key]

	def lazyGetFunctions(self, map, key):
		return self.lazyGet(map, key)["functions"]

	def lazyGetProperties(self, map, key):
		return self.lazyGet(map, key)["properties"]

	def addCreateFunction(self, module, proxy):
		self.addFunction("create" + proxy, module, True)

	def addFunction(self, fn, component, isModule=False, isTopLevel=False):
		if isModule:
			fns = self.lazyGetFunctions(self.modules, component)
		elif isTopLevel:
			fns = self.lazyGetFunctions(self.topLevel, component)
		else:
			fns = self.lazyGetFunctions(self.proxies, component)
		if not fn in fns:
			fns[fn] = set()
		fns[fn].add(self.category)

	def addProperty(self, property, component, isModule=False, getter=False, setter=False):
		if isModule:
			properties = self.lazyGetProperties(self.modules, component)
		else:
			properties = self.lazyGetProperties(self.proxies, component)
		if not property in properties:
			properties[property] = set()
		properties[property].add(self.category)
		upper = upperFirst(property)
		if getter:
			self.addFunction("get" + upper, component, isModule)
		if setter:
			self.addFunction("set" + upper, component, isModule)

	def toJSON(self):
		return CoverageEncoder().encode({
			"modules": self.modules,
			"proxies": self.proxies
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
	def __init__(self):
		self.data = CoverageData()
		# TODO Add iOS binding metadata
		self.initAndroidBindings()
		self.initDrillbitCoverage()
		self.initTDocData()
		self.genData()

	def initAndroidBindings(self):
		log.info("Initializing Android bindings")
		self.androidBindings = []
		distAndroidDir = os.path.join(mobileDir, "dist", "android")
		for jar in os.listdir(distAndroidDir):
			if not jar.endswith('.jar'): continue
			jarPath = os.path.join(distAndroidDir, jar)
			moduleBindings = bindings.get_module_bindings(zipfile.ZipFile(jarPath))
			if moduleBindings != None:
				self.androidBindings.append(moduleBindings)

	def initDrillbitCoverage(self):
		log.info("Initializing Drillbit coverage")
		drillbitBuildDir = os.path.join(mobileDir, "build", "drillbit")
		if platform.system() == "Darwin":
			drillbitContentsDir = os.path.join(drillbitBuildDir, "Drillbit.app", "Contents")
		else:
			drillbitContentDir = os.path.join(drillbitBuildDir, "Drillbit")
		drillbitResultsDir = os.path.join(drillbitContentsDir, "Resources", "test_results")
		self.drillbitCoverage = {}
		for f in os.listdir(drillbitResultsDir):
			if f.endswith("Coverage.json"):
				data = json.loads(open(os.path.join(drillbitResultsDir, f), "r").read())
				self.mergeDrillbitCoverage(data)

		self.pruneDrillbitCoverage()

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
		remove = {
			"modules": {
				"Titanium": ["a", "x", "testFunction", "dumpCoverage"],
				"Titanium.Android.OptionMenu": ["__noSuchMethod__"],
				"Titanium.Database": ["__noSuchMethod__"],
				"Titanium.UI": ["addView", "removeView"],
				"Titanium.UI.Android": ["OptionMenu"]
			}
		}
		for platform in self.drillbitCoverage.keys():
			platformMap = self.drillbitCoverage[platform]
			for apiType in remove.keys():
				for componentName in remove[apiType].keys():
					if apiType in platformMap and componentName in platformMap[apiType]:
						component = platformMap[apiType][componentName]
						for api in remove[apiType][componentName]:
							if api in component:
								del component[api]

	def initTDocData(self):
		log.info("Initializing TDoc data")
		self.tdocTypes = []
		apiDocDir = os.path.join(mobileDir, "apidoc")
		for root, dirs, files in os.walk(apiDocDir):
			for file in files:
				if file.endswith(".yml"):
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
		self.data.setCategory(self.data.ANDROID_BINDING)
		proxyDefault = "org.appcelerator.kroll.annotations.Kroll.proxy.DEFAULT"
		for binding in self.androidBindings:
			for proxyClass in binding["proxies"].keys():
				proxy = binding["proxies"][proxyClass]
				isModule = proxy['isModule']
				proxyFullAPI = proxy["proxyAttrs"]["fullAPIName"]
				if "creatableInModule" in proxy["proxyAttrs"]:
					moduleClass = proxy["proxyAttrs"]["creatableInModule"]
					if moduleClass != proxyDefault:
						moduleAPI = self.findAndroidBinding(moduleClass)["proxyAttrs"]["fullAPIName"]
						self.data.addCreateFunction(moduleAPI, proxy["proxyAttrs"]["name"])
					elif not isModule:
						# Proxies w/o "creatableInModule" need a namespace fix
						module = self.findAndroidModuleForPackage(proxy["packageName"])
						if module != None:
							proxyFullAPI = module["proxyAttrs"]["fullAPIName"] + "." + proxyFullAPI
				if "propertyAccessors" in proxy["proxyAttrs"]:
					for accessor in proxy["proxyAttrs"]["propertyAccessors"]:
						self.data.addProperty(accessor, proxyFullAPI, isModule, getter=True, setter=True)
				if "methods" in proxy:
					for method in proxy["methods"].keys():
						methodName = proxy["methods"][method]["apiName"]
						if "topLevelMethods" in proxy and method in proxy["topLevelMethods"]:
							for topLevelName in proxy["topLevelMethods"][method]:
								parent = self.data.TOP_LEVEL
								if "." in topLevelName:
									parts = topLevelName.split(".")
									parent = ".".join(parts[0:-1])
									name = parts[-1]
								else:
									name = topLevelName
							self.data.addFunction(name, parent, isTopLevel=True)
						else:
							# For the sake of coverage, we only add a top level method once
							# even though technically it may be bound in two places
							self.data.addFunction(methodName, proxyFullAPI, isModule)
				if "dynamicProperties" in proxy:
					for dynProp in proxy["dynamicProperties"].keys():
						property = proxy["dynamicProperties"][dynProp]["name"]
						getter = proxy["dynamicProperties"][dynProp]["get"]
						setter = proxy["dynamicProperties"][dynProp]["set"]
						self.data.addProperty(property, proxyFullAPI, isModule, getter=getter, setter=setter)
				if "constants" in proxy:
					for constant in proxy["constants"].keys():
						self.data.addProperty(constant, proxyFullAPI, isModule)

	def genDrillbitCoverageData(self, platform):
		if platform == "android": self.data.setCategory(self.data.ANDROID_DRILLBIT)
		elif platform == "iphone": self.data.setCategory(self.data.IOS_DRILLBIT)

		log.info("Generating coverage for Drillbit / %s" % platform)
		for apiType in self.drillbitCoverage[platform].keys():
			isModule = apiType == "modules"
			isTopLevel = apiType == "other"
			for component in self.drillbitCoverage[platform][apiType].keys():
				for api in self.drillbitCoverage[platform][apiType][component].keys():
					apiCount = self.drillbitCoverage[platform][apiType][component][api]
					if "propertyGet" in apiCount or "propertySet" in apiCount or "functionCall" in apiCount:
						fullName = component + "." + api
						if fullName in self.drillbitCoverage[platform]["modules"]:
							log.warn("Skipping module as property accessor %s" % fullName)
							continue
						if apiCount["_type"] == "function":
							if isTopLevel:
								c = component
								if component == "TOP_LEVEL":
									c = self.data.TOP_LEVEL
								self.data.addFunction(api, c, isTopLevel=True)
							else:
								self.data.addFunction(api, component, isModule)
						else:
							self.data.addProperty(api, component, isModule)

	def hasAnyPlatform(self, obj, platforms):
		if "platforms" in obj:
			for platform in platforms:
				if platform in obj["platforms"]: return True
			# platforms specified, but none from this list
			return False
		# No explict platforms -> all platforms
		return True

	def genTDocData(self, platforms, category):
		log.info("Generating coverage for TDoc / %s" % platforms)
		self.data.setCategory(category)
		for tdocType in self.tdocTypes:
			component = tdocType["name"]
			if not self.hasAnyPlatform(tdocType, platforms):
				log.warn("Skipping TDoc type %s for platforms %s" % (component, platforms))
				continue
			if "extends" not in tdocType and component != "Titanium.Proxy":
				log.warn("Skipping TDoc type %s (no 'extends')" % component)
				continue
			isModule = False
			if component == "Titanium.Module": isModule = True
			if "extends" in tdocType and tdocType["extends"] == "Titanium.Module": isModule = True
			if "methods" in tdocType:
				for method in tdocType["methods"]:
					if not self.hasAnyPlatform(method, platforms):
						log.warn("Skipping TDoc method %s.%s for platforms %s" % (component, method["name"], platforms))
						continue
					self.data.addFunction(method["name"], component, isModule)
			if "properties" in tdocType:
				for property in tdocType["properties"]:
					if not self.hasAnyPlatform(property, platforms):
						log.warn("Skipping TDoc property %s.%s for platforms %s" % (component, property["name"], platforms))
						continue
					self.data.addProperty(property["name"], component, isModule)

	def genData(self):
		self.genAndroidBindingData()
		#self.genIOSBindingData()
		self.genDrillbitCoverageData("android")
		#self.genDrillbitCoverageData("iphone")
		self.genTDocData(["android"], self.data.ANDROID_TDOC)
		#self.genTDocData(["iphone"], self.data.IOS_TDOC)

	def countCoverage(self, components, name, category):
		countYes = 0
		countNo = 0
		for type in components[name].keys():
			typeMap = components[name][type]
			for typeName in typeMap.keys():
				categorySet = typeMap[typeName]
				if category in categorySet:
					countYes += 1
				else:
					countNo += 1
		return countYes, countNo

	def toJSON(self):
		return self.data.toJSON()

	def toHTML(self, outDir):
		from mako.template import Template
		from mako import exceptions
		indexTemplate = Template(filename=os.path.join(coverageDir, "index.html"),
			output_encoding='utf-8', encoding_errors='replace')
		componentTemplate = Template(filename=os.path.join(coverageDir, "component.html"),
			output_encoding='utf-8', encoding_errors='replace')

		try:
			indexPage = indexTemplate.render(
				categories = self.data.categories,
				categoryDesc = self.data.categoryDesc,
				modules = self.data.modules,
				proxies = self.data.proxies,
				topLevel = self.data.topLevel,
				countCoverage = self.countCoverage,
				upperFirst = upperFirst)
			indexPath = os.path.join(outDir, "index.html")
			open(indexPath, "w").write(indexPage)
		except:
			print exceptions.text_error_template().render()

		def toComponentHTML(components, prefix):
			for component in components:
				try:
					componentPage = componentTemplate.render(
						categories = self.data.categories,
						categoryDesc = self.data.categoryDesc,
						components = components,
						component = component,
						label = upperFirst(prefix),
						countCoverage = self.countCoverage,
						upperFirst = upperFirst)
					componentPath = os.path.join(outDir, "%s-%s.html" % (prefix, component))
					open(componentPath, "w").write(componentPage)
				except:
					print exceptions.text_error_template().render()


		toComponentHTML(self.data.modules, "module")
		toComponentHTML(self.data.proxies, "proxy")
		toComponentHTML(self.data.topLevel, "topLevel")

		stylesheet = os.path.join(coverageDir, "coverage.css")
		shutil.copy(stylesheet, outDir)

def main():
	matrix = CoverageMatrix()
	matrix.toHTML(sys.argv[1])
	#print matrix.genMatrixJSON()
	#print matrix.toHTML()

if __name__ == "__main__":
	main()
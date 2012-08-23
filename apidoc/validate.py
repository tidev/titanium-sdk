#!/usr/bin/env python
#
# A simple command line validator for TDoc2 YAML/Markdown based documentation
#

import os, sys, re
apiDocDir = os.path.abspath(os.path.dirname(__file__))

# We package markdown in support/common.
commonSupportDir = os.path.abspath(os.path.join(apiDocDir, '..', 'support', 'common'))
if os.path.exists(commonSupportDir):
	sys.path.append(commonSupportDir)

import codecs, optparse, platform
import markdown

try:
	import yaml
except:
	print >> sys.stderr, "You don't have pyyaml!\n"
	print >> sys.stderr, "You can install it with:\n"
	print >> sys.stderr, ">  sudo easy_install pyyaml\n"
	print >> sys.stderr, ""
	sys.exit(1)


VALID_PLATFORMS = ["android", "iphone", "ipad", "mobileweb"]
VALID_KEYS = {
		"type": ["name", "summary", "description", "createable", "platforms", "extends",
			"excludes", "since", "deprecated", "osver", "examples", "methods", "properties",
			"events"],
		"method": ["name", "summary", "description", "returns", "platforms", "since",
			"deprecated", "osver", "examples", "parameters"],
		"parameter": ["name", "summary", "type", "optional", "default", "repeatable"],
		"property": ["name", "summary", "description", "type", "platforms", "since",
			"deprecated", "osver", "examples", "permission", "availability", "accessors",
			"optional", "value", "default"],
		"event": ["name", "summary", "description", "extends", "platforms", "since",
			"deprecated", "osver", "properties"],
		"eventprop": ["name", "summary", "type", "platforms", "deprecated"]
		}

types = {}
typesFromDocgen = None
errorTrackers = {}
options = None


def stringFrom(error):
	if isinstance(error, basestring):
		return error
	elif isinstance(error, dict):
		return "returns - " + str(error)
	else:
		return error.name
		
class Printer:
	def __init__(self):
		self.error_count = 0;
		
	def errorCount(self):
		return self.error_count;
	
class PrettyPrinter(Printer):
	
	def printCheck(self, error, indent=1):
		if not options.errorsOnly:
			print u'%s\u2713 \033[92m%s\033[0m' % ('\t' * indent, stringFrom(error))

	def printError(self, error, indent=1):
		print >>sys.stderr, u'%s\u0078 \033[91m%s\033[0m' % ('\t' * indent, stringFrom(error))
		
	def printStatus(self, path, error):
		if not options.errorsOnly or error.hasErrors():
			print '%s:' % path		
		self.printTrackerStatus(error)
		
	def printTrackerStatus(self, error, indent=1):
		if error.hasErrors():
			self.printError(error, indent)
		elif options.verbose or indent == 1:
			self.printCheck(error, indent)

		for msg in error.errors:
			self.printError(msg, indent + 1)
			self.error_count += 1
		for child in error.children:
			self.printTrackerStatus(child, indent + 1)
		
class SimplePrinter(Printer):
	
	def printStatus(self, path, error):
		self.printTrackerStatus(error, path)

	def addField(self, line, field):
		if len(line) > 0:
			line += " : "
		line += stringFrom(field)
		return line
		
	def printTrackerStatus(self, error, line = ""):
		line = self.addField(line, error.name)

		for msg in error.errors:
			self.printError(self.addField(line, msg))
		if len(error.children) > 0:
			for child in error.children:
				self.printTrackerStatus(child, line)
		else:
			self.printCheck(line)

	def printCheck(self, msg):
		if not options.errorsOnly:
			print "PASS: " + msg
			
	def printError(self, msg):
		print "FAIL: " + msg
		self.error_count += 1
	
class ErrorTracker(object):
	TRACKER_FOR_TYPE = 0
	TRACKER_FOR_METHOD = 1
	TRACKER_FOR_PROPERTY = 2
	TRACKER_FOR_EVENT = 3
	TRACKER_FOR_METHOD_PARAMETER = 4
	TRACKER_FOR_EVENT_PROPERTY = 5
	TRACKER_FOR_REF = 5

	def __init__(self, name, trackerFor, parent=None):
		self.name = name
		self.trackerFor = trackerFor
		self.errors = []
		self.children = []
		self.parent = parent
		if self.parent != None:
			self.parent.children.append(self)

	def trackError(self, description):
		self.errors.append(description)

	def getTracker(self, childName):
		for child in self.children:
			if child.name == childName:
				return child
		return None

	def hasErrors(self):
		if len(self.errors) > 0:
			return True
		for child in self.children:
			if child.hasErrors():
				return True
		return False

def validateKeys(tracker, obj, objType):
	validKeys = VALID_KEYS[objType]
	if not isinstance(obj, dict):
		return
	if "name" in obj:
		objName = obj["name"]
	else:
		objName = "object"
	invalid = [k for k in obj.keys() if k not in validKeys]
	if invalid:
		tracker.trackError("Invalid key(s) in %s: %s" % (objName, invalid))

# A missing piece of documentation could be inherited, since we
# support that as-of TIMOB-7419. This checks to see if its there
# after all inherited documentation has been resolved.
def propertyIsGenerated(tracker, propertyName):
	parent = tracker.parent
	if not parent:
		return False

	while parent.parent:
		parent = parent.parent

	if parent.trackerFor != ErrorTracker.TRACKER_FOR_TYPE:
		return False

	typeName = parent.name

	if typeName not in typesFromDocgen:
		return False

	generatedType = typesFromDocgen[typeName]

	memberToCheck = None
	listType = None

	if tracker.trackerFor == ErrorTracker.TRACKER_FOR_METHOD:
		listType = "methods"
	elif tracker.trackerFor == ErrorTracker.TRACKER_FOR_PROPERTY:
		listType = "properties"
	elif tracker.trackerFor == ErrorTracker.TRACKER_FOR_EVENT:
		listType = "events"

	if not memberToCheck and listType:
		the_list = generatedType[listType]
		matching_members = [m for m in the_list if m["name"] == tracker.name]
		if matching_members:
			memberToCheck = matching_members[0]

	if not memberToCheck:
		return False
	else:
		return propertyName in memberToCheck

def validateRequired(tracker, map, required):
	for r in required:
		if r not in map and not propertyIsGenerated(tracker, r):
			tracker.trackError('Required property "%s" not found' % r)

def validatePlatforms(tracker, platforms):
	if type(platforms) != list:
		tracker.trackError('"platforms" specified, but isn\'t a list: %s' % platforms)
	for p in platforms:
		if p not in VALID_PLATFORMS:
			tracker.trackError('platform specifier "%s" is not valid. Valid platforms are: %s.' % (p, VALID_PLATFORMS))

def validateSince(tracker, since):
	if type(since) not in [str, dict]:
		tracker.trackError('"since" should either be a version inside a string, or a dictionary of platform to version: %s, %s' % (since, type(since)))

def validateDeprecated(tracker, deprecated):
	if type(deprecated) != dict or 'since' not in deprecated:
			tracker.trackError('"deprecated" should be a dictionary with "since" and optional "removed" versions: %s' % deprecated)

def validateOsVer(tracker, osver):
	if type(osver) != dict:
		tracker.trackError('"osver" should be a dictionary of platforms to version dictionaries') 
	for key, value in osver.iteritems():
		if type(value) != dict:
			tracker.trackError('"osver" for platform "%s" should be a dictionary with platforms mapping to dictionaries of "mix" (String), "max" (String), and/or "versions" (List)' % (key, value))

def validateIsBool(tracker, name, value):
	if not isinstance(value, bool):
		tracker.trackError('"%s" should either be true or false: %s, %s' % (name, value, type(value)))

def validateIsOneOf(tracker, name, value, validValues):
	if value not in validValues:
		tracker.trackError('"%s" should be one of %s, but was %s' % (name, ", ".join(validValues), value))

def validateMarkdown(tracker, mdData, name):
	try:
		html = markdown.markdown(mdData)
	except Exception, e:
		tracker.trackError('Error parsing markdown block "%s": %s' % (name, e))

def findType(tracker, typeName, name):
	base_types = ('void', 'Dictionary', 'Boolean', 'Number', 'String', 'Date', 'Object', 'Callback')

	if typeName in base_types:
		return

	containerRegex = r'(Dictionary|Callback|Array)\<([^\>]+)\>'
	match = re.match(containerRegex, typeName)
	if match:
		if not typeName.endswith('>>'):
			elementType = match.group(2)
			findType(tracker, elementType, name)
			return
		else:
			# We've got something like Array<Dictionary<Titanium.Map.Annotation>>
			pos = typeName.index('<')
			findType(tracker, typeName[pos+1:-1], name)
			return

	found = False
	for tdocPath, tdocTypes in types.iteritems():
		for t in tdocTypes:
			if 'name' in t and t['name'] == typeName:
				found = True
				break

	if not found:
		properCase = "%s%s" % (typeName[0].upper(), typeName[1:])
		if properCase in base_types:
			tracker.trackError('"%s" type "%s" could not be found, perhaps "%s" was meant' % (name, typeName, properCase))
		elif typeName.lower() == 'void':
			# "void" is an exception to the proper casing
			tracker.trackError('"%s" type "%s" could not be found, perhaps "void" was meant' % (name, typeName))

		else:
			tracker.trackError('"%s" type "%s" could not be found' % (name, typeName))


def validateCommon(tracker, map):
	if 'platforms' in map:
		validatePlatforms(tracker, map['platforms'])

	if 'since' in map:
		validateSince(tracker, map['since'])

	if 'deprecated' in map:
		validateDeprecated(tracker, map['deprecated'])

	if 'osver' in map:
		validateOsVer(tracker, map['osver'])

	if 'createable' in map:
		validateIsBool(tracker, 'createable', map['createable'])

	if 'permission' in map:
		validateIsOneOf(tracker, 'permission', map['permission'],
			('read-only', 'write-only', 'read-write'))

	if 'availability' in map:
		validateIsOneOf(tracker, 'availability', map['availability'],
			('always', 'creation', 'not-creation'))

	if 'accessors' in map:
		validateIsBool(tracker, 'accessors', map['accessors'])

	if 'optional' in map:
		validateIsBool(tracker, 'optional', map['optional'])

	if 'repeatable' in map:
		validateIsBool(tracker, 'repeatable', map['repeatable'])

	if 'notes' in map:
		tracker.trackError('"notes" field is no longer valid')
		
	if options.validateSummary:
		if 'summary' in map:
			summary = map['summary']
			if not summary is None and not len(summary.strip()) == 0:
				summary = summary.strip()
				if not summary[0].isupper or summary[-1] != ".":
					tracker.trackError('summary fields should start with a capital letter and end with a period. summary: %s' % summary)
			else:
				tracker.trackError('summary missing required text.')
		

def validateMethod(typeTracker, method):
	tracker = ErrorTracker(method['name'], ErrorTracker.TRACKER_FOR_METHOD, typeTracker)
	validateKeys(tracker, method, "method")
	validateRequired(tracker, method, ['name', 'summary'])
	validateCommon(tracker, method)

	if 'returns' in method:
		returns = method['returns']
		if type(returns) != dict and type(returns) != list:
			tracker.trackError('"returns" must be an Object or list of Objects: %s' % returns)
			return
		if type(returns) != list:
			returns = [returns]
		for oneReturn in returns:
			if type(oneReturn) != dict:
				tracker.trackError('"returns" must be an Object or list of Objects: %s' % returns)
				return
			if 'type' not in oneReturn:
				tracker.trackError('Required property "type" missing in "returns": %s' % returns)
			if not isinstance(oneReturn["type"], basestring):
				tracker.trackError('"type" value of returns element must be a string.' % oneReturn["type"])


	if 'parameters' in method:
		if type(method['parameters']) != list:
			tracker.trackError('"parameters" must be a list')
		for param in method['parameters']:
			pTracker = ErrorTracker(param['name'], ErrorTracker.TRACKER_FOR_METHOD_PARAMETER, tracker)
			validateKeys(pTracker, param, "parameter")
			validateRequired(pTracker, param, ['name', 'summary', 'type'])
			validateCommon(pTracker, param)

	if 'examples' in method:
		validateExamples(tracker, method['examples'])

def validateProperty(typeTracker, property):
	tracker = ErrorTracker(property['name'], ErrorTracker.TRACKER_FOR_PROPERTY, typeTracker)
	validateKeys(tracker, property, "property")

	validateRequired(tracker, property, ['name', 'summary', 'type'])
	validateCommon(tracker, property)

	if 'examples' in property:
		validateExamples(tracker, property['examples'])
	
	constantRegex = r'[A-Z]+[A-Z_]*'
	match = re.match(constantRegex, property['name'])
	if match:
		if not 'permission' in property:
			tracker.trackError('Required property for constant "permission" not found')
		else:
			if not property['permission'] == 'read-only':
				tracker.trackError("Constant should have 'read-only' permission.")

def validateEvent(typeTracker, event):
	tracker = ErrorTracker(event['name'], ErrorTracker.TRACKER_FOR_EVENT, typeTracker)
	validateKeys(tracker, event, "event")
	validateRequired(tracker, event, ['name', 'summary'])
	validateCommon(tracker, event)
	if 'properties' in event:
		if type(event['properties']) != list:
			tracker.trackError('"properties" specified, but isn\'t a list')
			return
		for p in event['properties']:
			pTracker = ErrorTracker(p['name'], ErrorTracker.TRACKER_FOR_EVENT_PROPERTY, tracker)
			validateKeys(pTracker, p, "eventprop")
			validateRequired(pTracker, p, ['name', 'summary'])
			validateCommon(pTracker, p)

def validateExamples(tracker, examples):
	if not isinstance(examples, list):
		tracker.trackError('"examples" must be a list: %s' % examples)
		return
	for example in examples:
		if not isinstance(example, dict) or 'title' not in example or 'example' not in example:
			tracker.trackError('each example must be a dict with "title" and "example" members: %s' % example)
			continue
		validateMarkdown(tracker, example['example'], 'example')
		
def validateExcludes(tracker, excludes):
	if not isinstance(excludes, dict):
		tracker.trackError('"excludes" must be a dict and cannot be empty')
		return
	for category in excludes:
		if category not in ['events','properties','methods']:
			tracker.trackError('only "events","properties", and "methods" are allowed in "excludes": %s' % category)
			continue
		if not isinstance(excludes[category], list):
			tracker.trackError('"%s" must be a list' % category)
			continue

def validateType(typeDoc):
	typeName = typeDoc['name']
	errorTrackers[typeName] = ErrorTracker(typeName, ErrorTracker.TRACKER_FOR_TYPE)
	tracker = errorTrackers[typeName]

	validateRequired(tracker, typeDoc, ['name', 'summary'])
	validateCommon(tracker, typeDoc)
	if 'excludes' in typeDoc:
		validateExcludes(tracker, typeDoc['excludes'])

	if 'description' in typeDoc:
		validateMarkdown(tracker, typeDoc['description'], 'description')

	if 'examples' in typeDoc:
		validateExamples(tracker, typeDoc['examples'])

	if 'methods' in typeDoc:
		if type(typeDoc['methods']) != list:
			tracker.trackError('"methods" specified, but isn\'t a list')
		else:
			for method in typeDoc['methods']:
				validateMethod(tracker, method)

	if 'properties' in typeDoc:
		if type(typeDoc['properties']) != list:
			tracker.trackError('"properties" specified, but isn\'t a list')
		else:
			for property in typeDoc['properties']:
				validateProperty(tracker, property)

	if 'events' in typeDoc:
		if type(typeDoc['events']) != list:
			tracker.trackError('"events" specified, but isn\'t a list')
		else:
			for event in typeDoc['events']:
				validateEvent(tracker, event)


def loadTypesFromDocgen():
	global typesFromDocgen
	import docgen
	docgen.log.level = 2 # INFO
	docgen.process_yaml()
	docgen.finish_partial_overrides()
	typesFromDocgen = docgen.apis

def validateTDoc(tdocPath):
	global typesFromDocgen

	tdocTypes = [type for type in yaml.load_all(codecs.open(tdocPath, 'r', 'utf8').read())]

	if options.parseOnly:
		return

	if not typesFromDocgen:
		try:
			loadTypesFromDocgen()
		except Exception, e:
			# This should be fatal
			print >> sys.stderr, e
			sys.exit(1)

	for type in tdocTypes:
		validateType(type)

	global types
	types[tdocPath] = tdocTypes

def validateRef(tracker, ref, name):
	if type(ref) not in [str, list]:
		tracker.trackError('"%s" reference "%s" must be either a String or List' % (name, ref))

	if type(ref) is str:
		findType(tracker, ref, name)
	elif type(ref) is list:
		for t in ref:
			findType(tracker, t, name)

def validateMethodRefs(typeTracker, method):
	tracker = typeTracker.getTracker(method['name'])
	if 'returns' in method:
		if type(method['returns']) == str:
			validateRef(tracker, method['returns'], 'returns')
		elif type(method['returns']) == dict:
			returnObj = method['returns']
			rTracker = ErrorTracker(returnObj, ErrorTracker.TRACKER_FOR_REF, tracker)
			if 'type' in returnObj:
				validateRef(rTracker, returnObj['type'], 'type')
	if 'parameters' in method:
		for param in method['parameters']:
			pTracker = tracker.getTracker(param['name'])
			if 'type' in param:
				validateRef(pTracker, param['type'], 'type')

def validateRefs():
	for tdocPath, tdocTypes in types.iteritems():
		for typeDoc in tdocTypes:
			tracker = errorTrackers[typeDoc['name']]
			if 'extends' in typeDoc:
				validateRef(tracker, typeDoc['extends'], 'extends')
			if 'methods' in typeDoc:
				for method in typeDoc['methods']:
					validateMethodRefs(tracker, method)
			if 'properties' in typeDoc:
				for property in typeDoc['properties']:
					pTracker = tracker.getTracker(property['name'])
					if 'type' in property:
						validateRef(pTracker, property['type'], 'type')


def validateDir(dir):
	for root, dirs, files in os.walk(dir):
		for file in files:
			if file.endswith(".yml") and file != "template.yml":
				absolutePath = os.path.join(root, file)
				try:
					validateTDoc(absolutePath)
				except Exception, e:
					print >> sys.stderr, ("Error parsing %s: %s:" % (os.path.join(root,file), str(e)))
	validateRefs()

def printStatus(dir=None):
	if options.format == 'pretty':
		printer = PrettyPrinter()
	elif options.format == 'simple':
		printer = SimplePrinter()
	else:
		print >> sys.stderr, "Invalid output style: %s. Use 'pretty' or 'simple'" % options.format
		sys.exit(1)
		
	keys = types.keys()
	keys.sort()
	for key in keys:
		tdocPath = key
		tdocTypes = types[key]
		if dir: tdocPath = tdocPath[len(dir)+1:]
		for type in tdocTypes:
			printer.printStatus(tdocPath, errorTrackers[type["name"]])
			
	print "Errors encountered: %s" % printer.errorCount()

def main(args):
	parser = optparse.OptionParser()
	parser.add_option('-v', '--verbose', dest='verbose',
		action='store_true', default=False, help='enable verbose validation output')
	parser.add_option('-d', '--dir', dest='dir',
		default=None, help='directory to recursively validate *.yml TDoc2 files')
	parser.add_option('-f', '--file', dest='file',
		default=None, help='specific TDoc2 file to validate (overrides -d/--dir)')
	parser.add_option('-p', '--parse-only', dest='parseOnly',
		action='store_true', default=False, help='only check yaml parse-ability')
	format_default = "pretty"
	if "windows" in platform.system().lower() or "cygwin" in platform.system().lower():
		format_default = "simple"
	parser.add_option('-s', '--style', dest='format',
		default=format_default, help='output style: pretty (default) or simple.')
	parser.add_option('-e', '--errors-only', dest='errorsOnly',
		action='store_true', default=False, help='only emit failed validations')
	parser.add_option('--warn-summary', dest='validateSummary',
		action='store_true', default=False, help='validate summary field')
	global options
	(options, args) = parser.parse_args(args)

	dir=None
	if options.file is not None:
		# NOTE: because of the introduction of inherited documentation
		# fields via TIMOB-7419, using the -f option is not really that
		# fast anymore because even if we're just validating one file we need
		# to parse all of them in order to see the "final" set of documentation
		# for a type.
		print "Validating %s:" % options.file
		validateTDoc(options.file)
	else:
		dir = options.dir or apiDocDir
		validateDir(dir)
	printStatus(dir)

if __name__ == "__main__":
	main(sys.argv)

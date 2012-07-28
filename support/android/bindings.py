# Functions for reading the generated binding JSON data
import os, sys
import zipfile

android_dir = os.path.dirname(sys._getframe(0).f_code.co_filename)
common_dir = os.path.abspath(os.path.join(android_dir, "..", "common"))
sys.path.append(common_dir)

try:
	import simplejson as json
except ImportError, e:
	import json

android_modules_dir = os.path.abspath(os.path.join(android_dir, 'modules'))
modules_json = os.path.join(android_dir, 'modules.json')
module_jars = None
if os.path.exists(modules_json):
	module_jars = json.loads(open(modules_json, 'r').read())

def get_module_bindings(jar):
	bindings_path = None
	for name in jar.namelist():
		if name.endswith('.json') and name.startswith('org/appcelerator/titanium/bindings/'):
			bindings_path = name
			break
	
	if bindings_path is None: return None
	
	return json.loads(jar.read(bindings_path))

def get_all_module_names():
	module_names = []
	for module_jar in module_jars.keys():
		for module_name in module_jars[module_jar]:
			module_names.append(module_name)
	return module_names

def find_module_jar(module):
	for module_jar in module_jars.keys():
		for module_name in module_jars[module_jar]:
			if module_name.lower() == module:
				if module_jar == "titanium.jar": return os.path.join(android_dir, module_jar)
				else: return os.path.join(android_modules_dir, module_jar)
	return None

def get_all_module_bindings(dir=None):
	if dir == None:
		dir = android_modules_dir

	modules = {}
	external_child_modules = {}
	for jar in os.listdir(android_modules_dir):
		if not jar.endswith('.jar'): continue
		
		module_path = os.path.join(android_modules_dir, jar)
		module_jar = zipfile.ZipFile(module_path)
		module_bindings = get_module_bindings(module_jar)
		module_jar.close()
		if module_bindings is None: continue
		
		for module_class in module_bindings['modules'].keys():
			if module_class not in module_bindings['proxies']:
				# parent module is external, so the reference needs to be injected at boot time
				if module_class not in external_child_modules:
					external_child_modules[module_class] = []
				external_child_modules[module_class].extend(module_bindings['modules'][module_class]['childModules'])
				continue
			full_api_name = module_bindings['proxies'][module_class]['proxyAttrs']['fullAPIName']
			modules[module_class] = module_bindings['modules'][module_class]
			modules[module_class]['fullAPIName'] = full_api_name
	
	return (modules, external_child_modules)

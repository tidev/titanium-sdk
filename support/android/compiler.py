#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Appcelerator Titanium Mobile
#
# Resource to Android Page Compiler
# Handles JS, CSS and HTML files only
#
import os, sys, re, shutil, tempfile, run, codecs, traceback, types
import jspacker
from xml.sax.saxutils import escape
from sgmllib import SGMLParser
from csspacker import CSSPacker
from deltafy import Deltafy
import bindings

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store']
ignoreDirs = ['.git','.svn','_svn', 'CVS']
ignoreSymbols = ['version','userAgent','name','_JSON','include','fireEvent','addEventListener','removeEventListener','buildhash','builddate']
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.abspath(os.path.join(template_dir, "..", "common")))

import simplejson

# class for extracting javascripts
class ScriptProcessor(SGMLParser):
	def __init__(self):
		SGMLParser.__init__(self)
		self.scripts = []
	
	def unknown_starttag(self, tag, attrs):
		if tag == 'script':
			for attr in attrs:
				if attr[0]=='src':
					self.scripts.append(attr[1])

class Compiler(object):
	def __init__(self, tiapp, project_dir, java, classes_dir, gen_dir, root_dir,
			include_all_modules=False):
		self.tiapp = tiapp
		self.java = java
		self.classes_dir = classes_dir
		self.gen_dir = gen_dir
		self.template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.root_dir = root_dir
		self.use_bytecode = False
		if project_dir:
			self.project_dir = os.path.abspath(os.path.expanduser(project_dir))
		self.modules = set()
		self.jar_libraries = set()
		
		json_contents = open(os.path.join(self.template_dir,'dependency.json')).read()
		self.depends_map = simplejson.loads(json_contents)

		runtime = self.depends_map["runtimes"]["defaultRuntime"]
		if self.tiapp:
			self.appid = self.tiapp.properties['id']
			self.appname = self.tiapp.properties['name']
			runtime = self.tiapp.app_properties.get('ti.android.runtime',
					runtime)

		for runtime_jar in self.depends_map['runtimes'][runtime]:
			self.jar_libraries.add(os.path.join(template_dir, runtime_jar))

		# go ahead and slurp in any required modules
		for required in self.depends_map['required']:
			self.add_required_module(required)

		if self.tiapp and self.tiapp.has_app_property('ti.android.include_all_modules'):
			if self.tiapp.to_bool(self.tiapp.get_app_property('ti.android.include_all_modules')):
				include_all_modules = True

		if include_all_modules:
			print '[INFO] Force including all modules...'
			sys.stdout.flush()
			for module in bindings.get_all_module_names():
				self.add_required_module(module)

		self.module_methods = set()
		self.js_files = {}
		self.html_scripts = []
		self.compiled_files = []

	def add_required_module(self, name):
		name = name.lower()
		if name in ('buildhash','builddate'): return # ignore these
		if not name in self.modules:
			self.modules.add(name)
			module_jar = bindings.find_module_jar(name)
			if module_jar != None and os.path.exists(module_jar):
				print "[DEBUG] detected module %s, path = %s" % (name, module_jar)
				self.jar_libraries.add(module_jar)
			else:
				print "[DEBUG] unknown module = %s" % name
				
			if self.depends_map['libraries'].has_key(name):
				for lib in self.depends_map['libraries'][name]:
					lf = os.path.join(self.template_dir,lib)
					if os.path.exists(lf):
						if not lf in self.jar_libraries:
							print "[DEBUG] adding required library: %s" % lib
							self.jar_libraries.add(lf) 

			if self.depends_map['dependencies'].has_key(name):
				for depend in self.depends_map['dependencies'][name]:
					self.add_required_module(depend)

	def is_module(self, name):
		ucase_module_names = ("XML", "API", "JSON", "UI")
		if name.isupper() and name not in ucase_module_names: return False # completely upper case signifies a constant
		if not name[0].isupper() and name != "iPhone": return False
		if 'iPhone.' in name: return False
		
		return True

	def extract_from_namespace(self, name, line):
		modules = set()
		methods = set()
		symbols = sorted(set(re.findall(r'%s\.(\w+)' % name, line)))
		if len(symbols) == 0:
			return modules, methods

		for sym in symbols:
			sub_symbols = self.extract_from_namespace("%s.%s" % (name, sym), line)
			for module in sub_symbols[0]:
				modules.add("%s.%s" % (sym, module))
			for method_name in sub_symbols[1]:
				method_name = "%s.%s" % (sym, method_name)
				methods.add(method_name)

			if sym in ignoreSymbols:
				continue

			if self.is_module(sym):
				modules.add(sym)
			else:
				methods.add(sym)
		return modules, methods

	def extract_and_combine_modules(self, name, line):
		modules, methods = self.extract_from_namespace(name, line)
		for module in modules:
			self.add_required_module(module)
		for method in methods:
			self.module_methods.add(method)
	
	def extract_modules(self,out):
		for line in out.split(';'):
			self.extract_and_combine_modules('Titanium',line)
			self.extract_and_combine_modules('Ti',line)

	def compile_javascript(self, fullpath):
		js_jar = os.path.join(self.template_dir, 'js.jar')
		# poor man's os.path.relpath (we don't have python 2.6 in windows)
		resource_relative_path = fullpath[len(self.project_dir)+1:].replace("\\", "/")

		# chop off '.js'
		js_class_name = resource_relative_path[:-3]
		escape_chars = ['\\', '/', ' ', '.','-']
		for escape_char in escape_chars:
			js_class_name = js_class_name.replace(escape_char, '_')
		
		if self.use_bytecode:
			jsc_args = [self.java, '-classpath', js_jar, 'org.mozilla.javascript.tools.jsc.Main',
				'-main-method-class', 'org.appcelerator.titanium.TiScriptRunner',
				'-nosource', '-package', self.appid + '.js', '-encoding', 'utf8',
				'-o', js_class_name, '-d', self.classes_dir, fullpath]
		else:
			jsc_args = [
				self.java,
				'-jar',
				os.path.join(self.template_dir, 'lib/closure-compiler.jar'),
				'--js',
				fullpath,
				'--js_output_file',
				fullpath + '-compiled',
				'--jscomp_off=internetExplorerChecks',
				'--accept_const_keyword'
				]

		print "[INFO] Compiling javascript: %s" % resource_relative_path
		sys.stdout.flush()
		so, se = run.run(jsc_args, ignore_error=True, return_error=True)
		if not se is None and len(se):
			regex_result = re.search("(\d+) error\(s\), (\d+) warning\(s\)", se, flags=re.MULTILINE)
			if not regex_result is None:
				errors_count = int(regex_result.group(1))

				if errors_count > 0:
					sys.stderr.write("[ERROR] %s\n" % se)

				else:
					sys.stderr.write("[WARN] %s\n" % se)

				sys.stderr.flush()

				if errors_count > 0:
					sys.exit(1)

			else:
				sys.stderr.write("[ERROR] unrecognized error encountered: " % se)
				sys.exit(1)

		os.unlink(fullpath)
		os.rename(fullpath+'-compiled',fullpath)

	def compile_into_bytecode(self, paths):
		for fullpath in paths:
			# skip any JS found inside HTML <script>
			if fullpath in self.html_scripts: continue
			self.compile_javascript(fullpath)
			self.compiled_files.append(fullpath)

		# Pack JavaScript sources into an asset crypt.
		jspacker.pack(self.project_dir, self.compiled_files, self.appid, self.gen_dir)
		
	def get_ext(self, path):
		fp = os.path.splitext(path)
		return fp[1][1:]

	def make_function_from_file(self, path):
		ext = self.get_ext(path)
		path = os.path.expanduser(path)
		file_contents = codecs.open(path,'r',encoding='utf-8').read()
			
		if ext == 'js':
			# determine which modules this file is using
			self.extract_modules(file_contents)
			
		return file_contents
		
	def extra_source_inclusions(self,path):
		content = codecs.open(path,'r',encoding='utf-8').read()
		p = ScriptProcessor()
		p.feed(content)
		p.close()
		for script in p.scripts:
			# ignore remote scripts
			if script.startswith('http://') or script.startswith('https://'): continue
			# resolve to a full path
			p = os.path.abspath(os.path.join(os.path.join(path,'..'),script))
			self.html_scripts.append(p)
			
	# For any external modules found by builder.py: if the external module
	# has a metadata.json file (which CommonJS external modules will)
	# then any Titanium module names in the "exports" key in the metadata
	# refer to Titanium modules referred to in the CommonJS source. We need
	# be sure to include those modules in an application build.
	def merge_external_module_dependencies(self, external_modules):
		if not external_modules:
			return
		for mod in external_modules:
			metadata_file = os.path.join(mod.path, "metadata.json")
			if os.path.exists(metadata_file):
				f = open(metadata_file, "r")
				metadata = simplejson.load(f)
				f.close()
				if not isinstance(metadata, dict):
					continue
				if metadata.has_key("exports"):
					dependencies = metadata["exports"]
					if dependencies:
						for d in dependencies:
							self.add_required_module(d)

	def compile(self, compile_bytecode=True, info_message="Compiling Javascript Resources ...",
			external_modules=None):
		if info_message:
			print "[INFO] %s" % info_message
		sys.stdout.flush()
		for root, dirs, files in os.walk(self.project_dir, True, None, True):
			for dir in dirs:
				if dir in ignoreDirs:
					dirs.remove(dir)
			if len(files) > 0:
				prefix = root[len(self.project_dir):]
				for f in files:
					fp = os.path.splitext(f)
					if len(fp)!=2: continue
					if fp[1] == '.jss': continue
					if not fp[1] in ['.html','.js','.css']: continue
					if f in ignoreFiles: continue
					fullpath = os.path.join(root,f)
					if fp[1] == '.html':
						self.extra_source_inclusions(fullpath)
					if fp[1] == '.js':
						relative = prefix[1:]
						js_contents = self.make_function_from_file(fullpath)
						if relative!='':
							key = "%s_%s" % (relative,f)
						else:
							key = f
						key = key.replace('.js','').replace('\\','_').replace('/','_').replace(' ','_').replace('.','_')
						self.js_files[fullpath] = (key, js_contents)
		if compile_bytecode:
			self.compile_into_bytecode(self.js_files)

		# Add dependencies from packaged external CommonJS modules, if any.
		if external_modules:
			self.merge_external_module_dependencies(external_modules)

if __name__ == "__main__":
	if len(sys.argv) != 2:
		print "Usage: %s <projectdir>" % sys.argv[0]
		sys.exit(1)

	project_dir = os.path.expanduser(sys.argv[1])
	resources_dir = os.path.join(project_dir, 'Resources')
	root_dir = os.path.join(project_dir, 'build', 'android')
	destdir = os.path.join(root_dir, 'bin', 'classes')
	sys.path.append("..")
	from tiapp import TiAppXML
	tiapp = TiAppXML(os.path.join(project_dir, 'tiapp.xml'))

	c = Compiler(tiapp, resources_dir, 'java', destdir, root_dir)
	project_deltafy = Deltafy(resources_dir)
	project_deltas = project_deltafy.scan()
	c.compile()

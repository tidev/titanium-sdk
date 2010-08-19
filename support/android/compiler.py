#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Appcelerator Titanium Mobile
#
# Resource to Android Page Compiler
# Handles JS, CSS and HTML files only
#
import os, sys, re, shutil, tempfile, run
import jspacker 
from sgmllib import SGMLParser
from csspacker import CSSPacker
from deltafy import Deltafy

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn', 'CVS'];

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
	
	def __init__(self,appid,project_dir,java,classes_dir):
		self.java = java
		self.classes_dir = classes_dir
		self.template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.appid = appid
		self.project_dir = os.path.abspath(os.path.expanduser(project_dir))
		# these modules are always required 
		# TODO: review these
		self.modules = ['App','API','Platform','Analytics','Network']
		self.module_methods = []
		self.js_files = {}
		self.html_scripts = []
		self.compiled_files = []

	def extract_from_namespace(self,name,line):
		modules = [] 
		methods = []
		f = re.findall(r'%s\.(\w+)' % name,line)
		if len(f) > 0:
			for sym in f:
				mm = self.extract_from_namespace("%s.%s" % (name,sym), line)
				for m in mm[0]:
					method_name = "%s.%s" %(sym,m)
					try:
						methods.index(method_name)
					except:
						methods.append(method_name)
				# skip Titanium.version, Titanium.userAgent and Titanium.name since these
				# properties are not modules
				if sym == 'version' or sym == 'userAgent' or sym == 'name' or sym == '_JSON':
					continue
				try:
					modules.index(sym)
				except:	
					modules.append(sym)
		return modules,methods
					
	def extract_and_combine_modules(self,name,line):
		modules,methods = self.extract_from_namespace(name,line)
		if len(modules) > 0:
			for m in modules:
				try:
					self.modules.index(m)
				except:
					self.modules.append(m)
			for m in methods:
				try:
					self.module_methods.index(m)
				except:
					self.module_methods.append(m)
			
	def extract_modules(self,out):
		for line in out.split(';'):
			self.extract_and_combine_modules('Titanium',line)
			self.extract_and_combine_modules('Ti',line)
	
	def compile_into_bytecode(self,paths):
		jar_path = os.path.join(self.template_dir,"js.jar")
		for package in paths:
			args = [self.java,"-cp",jar_path,"org.mozilla.javascript.tools.jsc.Main","-opt","9","-nosource","-package",package,"-d",self.classes_dir]
			count = 0
			for path in paths[package]:
				# skip any JS found inside HTML <script>
				if path in self.html_scripts: continue
				args.append(path)
				count+=1
				self.compiled_files.append(path)
			if count > 0: run.run(args)
		
	def get_ext(self, path):
		fp = os.path.splitext(path)
		return fp[1][1:]
		
	def make_function_from_file(self, path, pack=True):
		ext = self.get_ext(path)
		path = os.path.expanduser(path)
		file_contents = open(path).read()
			
		if pack: self.pack(path, ext, file_contents)
		if ext == 'js':
			# determine which modules this file is using
			self.extract_modules(file_contents)
		
	def pack(self, path, ext, file_contents):
		def jspack(c): return jspacker.jsmin(c)
		def csspack(c): return CSSPacker(c).pack()
		
		packers = {'js': jspack, 'css': csspack }
		if ext in packers:
			file_contents = packers[ext](file_contents)
			of = open(path,'w')
			of.write(file_contents)
			of.close()
			print "[DEBUG] packed: %s" % path
	
	def extra_source_inclusions(self,path):
		content = open(path).read()
		p = ScriptProcessor()
		p.feed(content)
		p.close()
		for script in p.scripts:
			# ignore remote scripts
			if script.startswith('http://') or script.startswith('https://'): continue
			# resolve to a full path
			p = os.path.abspath(os.path.join(os.path.join(path,'..'),script))
			self.html_scripts.append(p)
			
	def compile(self):
		for root, dirs, files in os.walk(self.project_dir):
			for dir in dirs:
				if dir in ignoreDirs:
					dirs.remove(dir)
			if len(files) > 0:
				prefix = root[len(self.project_dir):]
				for f in files:
					fp = os.path.splitext(f)
					if len(fp)!=2: continue
					if not fp[1] in ['.html','.js','.css']: continue
					if f in ignoreFiles: continue
					fullpath = os.path.join(root,f)
					#pack = deltas.has_path(fullpath)
					pack = False # ?
					if fp[1] == '.html':
						self.extra_source_inclusions(fullpath)
					if fp[1] == '.js':
						relative = prefix[1:]
						package = "org.appcelerator.generated"
						if len(relative)>0:
							relative = relative.replace('/','.').replace('\\','.')
							package += ".%s" % relative
						if self.js_files.has_key(package):
							self.js_files[package].append(fullpath)
						else:
							self.js_files[package] = [fullpath]
					self.make_function_from_file(fullpath, pack=pack)
#		self.compile_into_bytecode(self.js_files)
					
					
if __name__ == "__main__":
	project_dir = os.path.expanduser("~/work/titanium_mobile/demos/KitchenSink")
	resources_dir = os.path.join(project_dir,"Resources")
	c = Compiler("com.appcelerator.kitchensink",resources_dir,"java","/Users/jhaynie/Documents/workspace/RhinoFun/generated")
	project_deltafy = Deltafy(resources_dir)
	project_deltas = project_deltafy.scan()
	c.compile(project_deltas)
	print c.html_scripts

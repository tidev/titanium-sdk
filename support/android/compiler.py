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
	
	def __init__(self,name,appid,project_dir,java,classes_dir,root_dir):
		self.java = java
		self.appname = name
		self.classes_dir = classes_dir
		self.template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.appid = appid
		self.root_dir = root_dir
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
		res_dir = os.path.join(self.root_dir,'res','values')
		if not os.path.exists(res_dir):
			os.makedirs(res_dir)

		f = os.path.join(res_dir,"app.xml")
		ff = codecs.open( f, "w", encoding="utf-8" )
		ff.write(u'<?xml version="1.0" encoding="utf-8"?>\n')
		ff.write(u'<resources>\n')
		
		for fullpath in paths:
			# skip any JS found inside HTML <script>
			if fullpath in self.html_scripts: continue
			
			path, contents = paths[fullpath]
			contents = contents.replace('Titanium.','Ti.')
			contents = contents.replace("\"","\\\"")
			contents = contents.replace("'","\\'")
			contents = escape(contents)

			ff.write(u'<string name="a$%s">' % path)
			ff.write(contents)
			ff.write(u'</string>\n')
			
			self.compiled_files.append(fullpath)
			
		ff.write(u'</resources>\n')
		ff.close()
		
	def get_ext(self, path):
		fp = os.path.splitext(path)
		return fp[1][1:]
		
	def make_function_from_file(self, path, pack=True):
		ext = self.get_ext(path)
		path = os.path.expanduser(path)
		file_contents = codecs.open(path,'r',encoding='utf-8').read()
			
		if pack: 
			file_contents = self.pack(path, ext, file_contents)
			
		if ext == 'js':
			# determine which modules this file is using
			self.extract_modules(file_contents)
			
		return file_contents
		
	def pack(self, path, ext, file_contents):
		def jspack(c): return jspacker.jsmin(c)
		def csspack(c): return CSSPacker(c).pack()
		
		packers = {'js': jspack, 'css': csspack }
		if ext in packers:
			file_contents = packers[ext](file_contents)
			of = codecs.open(path,'w',encoding='utf-8')
			of.write(file_contents)
			of.close()
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
			
	def compile(self):
		print "[INFO] Compiling Javascript resources ..."
		sys.stdout.flush()
		for root, dirs, files in os.walk(self.project_dir):
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
						js_contents = self.make_function_from_file(fullpath, pack=False)
						if relative!='':
							key = "%s_%s" % (relative,f)
						else:
							key = f
						key = key.replace('.js','').replace('/','_').replace(' ','_').replace('.','_')
						self.js_files[fullpath] = (key, js_contents)
		self.compile_into_bytecode(self.js_files)
					
					
if __name__ == "__main__":
	project_dir = os.path.expanduser("~/work/titanium_mobile/demos/KitchenSink")
	resources_dir = os.path.join(project_dir,"Resources")
	c = Compiler("com.appcelerator.kitchensink",resources_dir,"java","/Users/jhaynie/Documents/workspace/RhinoFun/generated")
	project_deltafy = Deltafy(resources_dir)
	project_deltas = project_deltafy.scan()
	c.compile(project_deltas)
	print c.html_scripts

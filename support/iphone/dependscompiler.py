#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# This script will resolve application level dependencies and 
# then build an appropriate library that only includes the symbols
# found in the application. This will produce the smallest possible
# application possible in terms of size, increase startup load time,
# and reduce memory.
#
import os, sys, uuid, subprocess, shutil, signal, time, re, glob, codecs, json, run, tempfile
from os.path import join, splitext, split, exists
from shutil import copyfile
import jspacker
import hashlib

ignoreFiles = ['.gitignore', '.cvsignore','.DS_Store'];
ignoreDirs = ['.git','.svn', 'CVS'];

import_depends = []
imports_map = {}

class Module(object):
	def __init__(self,name):
		self.name = name
		self.props = {}
		self.parent = None
		self.path = self.name
		self.level = 0
		self.package = self.name

	def add(self,key):
		m = Module(key)
		m.parent = self
		m.path = "%s.%s" % (self.path,key)
		m.level = self.level + 1
		m.package = "%s%s" % (self.package,key)
		factory_name = None
		if len(key)>6 and key[0:6]=='create':
			factory_name = key[6:]
			m.package = "Ti%s%s" %(self.package.replace('Module',''),factory_name)

		if m.level == 1:
			m.package = '%sModule' % key
			
		import_found = False
			
		if imports_map.has_key(m.package):
			import_found = True
		elif factory_name!=None:
			m.package = "Ti%s%s" % (self.name,factory_name)
			import_found = imports_map.has_key(m.package)

		if import_found:
			import_depends.append(m.package)
		if factory_name!=None: 
			import_depends.append("%s"%m.package)
			import_depends.append("%sProxy"%m.package)

		self.props[key]=m
		return m
	
	def get(self,key):
		return self.props[key]
	
	def has_key(self,key):
		return self.props.has_key(key)
		
	def __repr__(self):
		return "Module<%s>" % self.name
	
Titanium = Module('Titanium')
Titanium.package = 'Ti'

class DependencyCompiler(object):
	def __init__(self):
		pass
		self.modules = []
		self.required_modules = []
		
	def compile(self,iphone_dir,app_dir,thirdparty_modules):
		
		start_time = time.time()
		import_depends.append('TitaniumModule')
		import_depends.append('AnalyticsModule')
		# these are needed for app routing and aren't imported in code
		import_depends.append('Base64Transcoder') 
		import_depends.append('NSData+Additions')
		
		resources_dir = os.path.join(app_dir,'Resources')
		iphone_build_dir = os.path.join(app_dir,'build','iphone')
		build_dir = os.path.join(iphone_build_dir,'Resources')
		build_tmp_dir = os.path.join(iphone_build_dir,'tmp')
		finallibfile = os.path.join(build_dir,'libTitanium.a')
		
		# read in the imports map
		import_path = os.path.join(iphone_dir,'imports.json')
		import_json = open(import_path).read();
		imports_map = json.read(import_json)


		def extract_api_path(line):
			parts = line.split('.')
			module = Titanium
			c = 0
			while c < len(parts):
				key = parts[c]
				if module.has_key(key):
					module = module.get(key)
				else:
					module = module.add(key)
				c+=1

		terminal_symbols = ['(','}','=',',']

		def extract_module_with_token(token,line):
			f = re.findall(r'%s\.(\w+)'%token,line)
			if len(f) > 0:
				for sym in f:
					# skip top level properties that aren't modules
					if sym in ['version','userAgent','name','include']:
						continue
					try:
						self.modules.index(sym)
					except:	
						self.modules.append(sym)
						self.required_modules.append(sym)

		def extract_api_line(line):
			for sym in terminal_symbols:
				index = line.find(sym)
				if index != -1:
					return extract_api_line(line[0:index])
			return line		

		def extract_modules(out,symbol):
			for line in out.split(';'):
				extract_module_with_token('Titanium',line)
				extract_module_with_token('Ti',line)
				f = re.findall(r'%s\.(.*)'%symbol,line)
				if len(f) > 0:
					for sym in f:
						api = extract_api_line(sym)
						extract_api_path(api)

		def dump_module(module,indent,level):
			if (level>0):import_depends.append(module.package)
			#print "%s%s  => %s [%d] %s" % (indent,module.name,module.path,module.level,module.package)
			for key in module.props.keys():
				dump_module(module.get(key),indent+'   ',level+1)
		
		def extract_file_details(f):
			#print "Processing... %s" % f
			file_contents = open(f).read()
			file_contents = jspacker.jsmin(file_contents)
			extract_modules(file_contents,'Titanium')
			extract_modules(file_contents,'Ti')

		def find_all_resources(the_dir):
			resources = []
			for root, dirs, files in os.walk(the_dir):
				for name in ignoreDirs:
					if name in dirs:
						dirs.remove(name)	
				for file in files:
					if file in ignoreFiles:
						continue
					full_path = join(root, file)			  
					relative_path = full_path.replace(the_dir+'/','')
					if splitext(file)[-1] == '.js':
						extract_file_details(full_path)

		find_all_resources(resources_dir)
		dump_module(Titanium,'',0)
		depend_files = []
		
		for depend in import_depends:
			found = False
			for key in imports_map:
				proxy = "%sProxy.m" % depend
				impl = "%s.m" % depend
				impl2 = "%s.mm" % depend
				if key.startswith(proxy) or key == impl or key == impl2:
					depend_files.append(key)
					found = True
					break

		compile_files = []
		processed_files = {}

		def add_depends(file):
			if processed_files.has_key(file): 
				return
			if not imports_map.has_key(file):
				return
			try:
				compile_files.index(file)
			except:
				compile_files.append(file)
			processed_files[file]=True
			depends = imports_map[file]
			for depend in depends:
				#if depend[0]=='<': continue
				try:
					compile_files.index(depend)
				except:
					compile_files.append(depend)
				add_depends(depend)
				add_depends(depend.replace('.h','.m'))
				add_depends(depend.replace('.h','.mm'))

		for file in depend_files:
			add_depends(file)
	
		dependencies = []
		always_include = ['SBJSON','Kroll']
	
		for compile in compile_files:
			fn = "%s.o" % splitext(compile)[0]
			try:
				dependencies.index(fn)
			except:
				dependencies.append(fn)

		compilezone = os.path.join(iphone_dir,'compilezone')
		
		skip = False
		if not os.path.exists(build_tmp_dir):
			os.makedirs(build_tmp_dir)
			
		de = json.encode(dependencies) + json.encode(thirdparty_modules)
		
		# as an optimization, we look to see if our dependencies 
		# between compiles are the same - if so, they should have
		# generated the same static library. in this case, we can
		# skip re-generating it again and instead just use the existing lib
		# a simple hash of the JSON of the depedency map should suffice 
		# in determining this...
		depends_file = os.path.join(build_tmp_dir,'dependencies.map')
		if os.path.exists(depends_file):
			current_depends = open(depends_file).read()
			m1 = hashlib.md5()
			m2 = hashlib.md5()
			m1.update(current_depends)
			m2.update(de)
			skip = m2.hexdigest()==m1.hexdigest()
		
		if skip:
			print "[DEBUG] skipping dependency compile, dependencies are the same"
		else:
			
			# write out our depedency map
			df = open(depends_file,'w+')
			df.write(de)
			df.close()

			symbols = []
			
			i386_dir = os.path.join(compilezone,'i386')
			arm_dir = os.path.join(compilezone,'arm')
		
			if not os.path.exists(compilezone):
				os.makedirs(compilezone)
			
			toplibfile = os.path.join(iphone_dir,'libTitanium.a')
			i386libfile = os.path.join(i386_dir,'libTitanium.a')
			armlibfile = os.path.join(arm_dir,'libTitanium.a')
			curdir = os.path.abspath(os.curdir)
						
			if not os.path.exists(i386_dir):
				os.makedirs(i386_dir)
				os.system("\"/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo\" \"%s\" -thin i386 -output \"%s\"" % (toplibfile,i386libfile))
				os.chdir(i386_dir)
				os.system("/usr/bin/ar x \"%s\"" % i386libfile)
			
			if not os.path.exists(arm_dir):
				os.makedirs(arm_dir)
				os.system("\"/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo\" \"%s\" -thin armv6 -output \"%s\"" % (toplibfile,armlibfile))
				os.chdir(arm_dir)
				os.system("/usr/bin/ar x \"%s\"" % armlibfile)
			
			for tp_module in thirdparty_modules:
				name = os.path.basename(tp_module).replace('.a','').replace('lib','')
				tpi386file = os.path.join(i386_dir,name+'.a')
				tparmfile = os.path.join(arm_dir,name+'.a')
				os.system("\"/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo\" \"%s\" -thin i386 -output \"%s\"" % (tp_module,tpi386file))
				os.system("\"/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo\" \"%s\" -thin armv6 -output \"%s\"" % (tp_module,tparmfile))
				os.chdir(i386_dir)
				os.system("/usr/bin/ar x \"%s\"" % tpi386file)
				os.chdir(arm_dir)
				os.system("/usr/bin/ar x \"%s\"" % tparmfile)
				output = run.run(['ar','t',tpi386file])
				for line in output.split("\n"):
					if line.find('.o')==-1: continue
					symbols.append(line)

			os.chdir(curdir)
		
			symbol_path = i386_dir  # for resolving, we can just use one of the two
			
			for depend in dependencies:
				symbol_file = os.path.join(symbol_path,depend)
				if os.path.exists(symbol_file):
					sym = os.path.basename(symbol_file)
					symbols.append(sym)
					print "[DEBUG] found symbol: %s" % sym
				else:
					pass
					#print "[TRACE] couldn't find %s" % depend
		
			for include in always_include:				
				for f in glob.glob(symbol_path+'/%s*'%include):
					sym = os.path.basename(f)
					try:
						symbols.index(sym)
					except:
						symbols.append(sym)
						print "[DEBUG] found symbol: %s" % sym
		
			sys.stdout.flush()
		
			tmpdir = tempfile.gettempdir()
		
			i386libfile = None
			armlibfile = None
			dirs_to_delete = []
		
			# create a new archive just using the symbols that have been detected
			# for each platform
			for libdir in [i386_dir,arm_dir]:
				libfiles = ""
				for sym in symbols:
					libfiles+="\"%s\" " % os.path.join(libdir,sym)
				thedir = os.path.join(tmpdir,os.path.basename(libdir))
				if not os.path.exists(thedir): os.makedirs(thedir)
				libfile = os.path.join(thedir,'libTitanium.a')
				if i386libfile==None: 
					i386libfile = libfile 
				else:
					armlibfile = libfile
				dirs_to_delete.append(thedir)
				cmd = "ar -cr \"%s\" %s" % (libfile,libfiles)
				os.system(cmd)
		
			# create a combined lipo of both architectures
			os.system("\"/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo\" \"%s\" \"%s\" -create -output \"%s\"" % (i386libfile,armlibfile,finallibfile))
		
			# cleanup our temp directories
			for adir in dirs_to_delete:	
				shutil.rmtree(adir)
			
		end_time = time.time()
		
		print "[DEBUG] depedency compiler took: %.2f seconds" % (end_time-start_time)

if __name__ == '__main__':
	compiler = DependencyCompiler()
	iphone_dir = '/Library/Application Support/Titanium/mobilesdk/osx/0.9.0/iphone'
	#app_dir = '/Users/jhaynie/tmp/blahblah/foobar'
	app_dir = '/Users/jhaynie/work/titanium_mobile/demos/KitchenSink'
	compiler.compile(iphone_dir,app_dir)
	
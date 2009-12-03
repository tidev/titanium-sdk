#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Appcelerator Titanium Mobile
#
# Resource to Android Page Compiler
# Handles JS, CSS and HTML files only
#
import os, sys, re, shutil, tempfile
import jspacker 
from csspacker import CSSPacker

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn', 'CVS'];

class Compiler(object):
	
	def __init__(self,appid,project_dir,debug):
		self.debug = debug
		self.template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.appid = appid
		self.project_dir = os.path.abspath(os.path.expanduser(project_dir))
		# these modules are always required 
		self.modules = ['App','API','Platform','Analytics','Network']
		self.module_methods = []

	def extract_from_namespace(self,name,line):
		modules = [] 
		methods = []
		f = re.findall(r'%s\.(\w+)' % name,line)
		if len(f) > 0:
			for sym in f:
				mm = self.extract_from_namespace("Titanium.%s" % sym, line)
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
		
	def make_function_from_file(self,file):
	
		fp = os.path.splitext(file)
		ext = fp[1][1:]

		thefile = os.path.expanduser(file)
		file_contents = open(thefile).read()
		save_off = False
		parse_modules = True

		# minimize javascript, css files
		if ext == 'js':
			file_contents = jspacker.jsmin(file_contents)
			save_off = True
		elif ext == 'css':
			packer = CSSPacker(file_contents)
			file_contents = packer.pack()
			save_off = True
			parse_modules = False

		if save_off:
				of = open(thefile,'w')
				of.write(file_contents)
				of.close()
				print "[DEBUG] compressing: %s" % thefile
		
		if parse_modules:
			# determine which modules this file is using
			self.extract_modules(file_contents)
		

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
					metadata = self.make_function_from_file(fullpath)
					

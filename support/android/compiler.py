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

class Compiler(object):
	
	def __init__(self,appid,project_dir,debug):
		self.debug = debug
		self.template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.appid = appid
		self.project_dir = os.path.abspath(os.path.expanduser(project_dir))
		self.temp_build_dir = os.path.join(tempfile.gettempdir(),appid)
		# these modules are always required 
		self.modules = ['App','API','Platform','Analytics']
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
		
	def make_function_from_file(self,path,file):
	
		fp = os.path.splitext(path)
		basename = fp[0].replace(' ','_').replace('/','_').replace('-','_').replace('.','_').replace('+','_')
		ext = fp[1][1:]

		url = 'app://%s/%s' % (self.appid,path)

		filetype = ''
		contents = ''
	
		if ext=='html':
			filetype = 'page'
		elif ext=='css':
			filetype = 'style'
		elif ext=='js':
			filetype = 'script'	
	
		file_contents = open(os.path.expanduser(file)).read()
		_file_contents = file_contents

		# minimize javascript, css files
		if ext == 'js':
			file_contents = jspacker.jsmin(file_contents)
		elif ext == 'css':
			# packer = CSSPacker(file_contents)
			# file_contents = packer.pack()
			# FIXME: we need to compress these
			return {}
		
		# determine which modules this file is using
		self.extract_modules(file_contents)
		
		# TODO: for now we're just returning empty for android
		return {}

	def compile(self):
		
		c = 0
		
		# transform resources
		def strip_slash(s):
			if s[0:1]=='/': return s[1:]
			return s
		def recursive_cp(dir,dest):
			for root, dirs, files in os.walk(dir):
				relative = strip_slash(root.replace(dir,''))
				relative_dest = os.path.join(dest,relative)
				if not os.path.exists(relative_dest):
					os.makedirs(relative_dest)
				for f in files:
					fullpath = os.path.join(root,f)
					relativedest = os.path.join(dest,relative,f)
					shutil.copy(fullpath,relativedest)
				
		if os.path.exists(self.temp_build_dir):
			shutil.rmtree(self.temp_build_dir)
		os.makedirs(self.temp_build_dir)
		recursive_cp(self.project_dir,self.temp_build_dir)
		
		if os.path.exists(os.path.join(self.temp_build_dir,'iphone')):
			shutil.rmtree(os.path.join(self.temp_build_dir,'iphone'))
		if os.path.exists(os.path.join(self.temp_build_dir,'android')):
			recursive_cp(os.path.join(self.resources_dir,'android'),self.temp_build_dir)		
			shutil.rmtree(os.path.join(self.temp_build_dir,'iphone'))

		for root, dirs, files in os.walk(self.temp_build_dir):
			if len(files) > 0:
				prefix = root[len(self.temp_build_dir):]
				for f in files:
					fp = os.path.splitext(f)
					if len(fp)!=2: continue
					if not fp[1] in ['.html','.js','.css']: continue
					path = prefix + os.sep + f
					path = path[1:]
					fullpath = os.path.join(self.temp_build_dir,path)
					metadata = self.make_function_from_file(path,fullpath)
					c = c+1
					
		# cleanup			
		shutil.rmtree(self.temp_build_dir)			

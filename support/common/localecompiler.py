#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Localization Compiler
#

import os, sys, codecs, shutil
from xml.dom.minidom import parse

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))

from tiapp import *

ignoreFiles = ['.gitignore', '.cvsignore']
ignoreDirs = ['.git','.svn', 'CVS']

class LocaleCompiler(object):
	def __init__(self,name,dir,platform,mode='simulator',outdir=None):
		self.dir = os.path.join(dir,'i18n')
		self.platform = platform
		self.name = name
		self.mode = mode
		self.outdir = outdir
		self.iphone_dir = os.path.join(dir,'build','iphone','build')
		self.android_dir = os.path.join(dir,'build','android','res')
		if self.outdir!=None:
			self.android_dir = self.outdir

	def get_locale(self,file):
		return os.path.basename(os.path.dirname(file))
		
	def get_ios_dir(self):
		if self.outdir!=None: return self.outdir
		if self.mode == 'simulator':
			return os.path.join(self.iphone_dir,'Debug-iphonesimulator','%s.app' % self.name)
		elif self.mode == 'install':
			return os.path.join(self.iphone_dir,'Debug-iphoneos','%s.app' % self.name)
		else:
			return os.path.join(self.iphone_dir,'Release-iphoneos','%s.app' % self.name)

	def getText(self,nodelist):
		rc = u""
		for node in nodelist:
			if node.nodeType == node.TEXT_NODE:
				rc = rc + node.data
		return rc

	def compile_for_ios(self,file):
		locale = self.get_locale(file)
		build_dir = self.get_ios_dir()
		lproj_dir = os.path.join(build_dir,'%s.lproj' % locale)
		if not os.path.exists(lproj_dir): os.makedirs(lproj_dir)
		locale_file = os.path.join(lproj_dir,'Localizable.strings')
		f = codecs.open(locale_file,'w','utf-16')
		f.write(u'/**\n * Appcelerator Titanium\n * this is a generated file - DO NOT EDIT\n */\n\n')
		dom = parse(file)
		for node in dom.documentElement.childNodes:
			if node.nodeType != 1: continue
			name = node.attributes['name'].nodeValue
			value = self.getText(node.childNodes)
			# TODO: translate any more symbols?
			value = value.replace("%s",'%@')
			f.write(u'"%s" = "%s";\n' % (name,value))
		f.close()
		if self.mode!='simulator': #only compile if not simulator
			os.system("/usr/bin/plutil -convert binary1 \"%s\"" % locale_file)
		print "[DEBUG] compiled ios file: %s" % locale_file
		
	def compile_for_android(self,file):
		locale = self.get_locale(file)
		# for andoird, we can simply copy into the right directory
		if locale == 'en' or locale.lower() == 'en-us':
			dir = os.path.join(self.android_dir,'values')
		else:
			dir = os.path.join(self.android_dir,'values-%s' % locale)
		if not os.path.exists(dir): os.makedirs(dir)
		shutil.copy(file,os.path.join(dir,'strings.xml'))
		print "[DEBUG] compiled android file: %s" % file
		
	def compile(self):
		if not os.path.exists(self.dir): return
		print "[INFO] Compiling localization files"
		sys.stdout.flush()
		for dirname,dirs,files in os.walk(self.dir):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)	# don't visit ignored directories			  
			for f in files:
				if f in ignoreFiles: continue
				if not f.endswith('.xml'): continue
				file = os.path.join(dirname,f)
				if self.platform == 'ios' or self.platform == 'iphone' or self.platform == 'ipad':
					self.compile_for_ios(file)
				elif self.platform == 'android':
					self.compile_for_android(file)
				elif self.platform == 'blackberry':
					# TODO
					pass
			
		
		
if __name__ == "__main__":
	if len(sys.argv)==1 or len(sys.argv) < 3:
		print "Appcelerator Locale Compiler"
		print "Usage: %s <project_dir> <platform> [mode] [outdir]" % os.path.basename(sys.argv[0])
		sys.exit(1)

	path = os.path.expanduser(sys.argv[1])
	if not os.path.exists(path):
		print "Project directory not found: %s" % path
		sys.exit(1)

	tiapp_xml_path = os.path.join(path,'tiapp.xml')
	if not os.path.exists(tiapp_xml_path):
		print "Project directory doesn't look like a valid Titanium project: %s" % path
		sys.exit(1)	

	resources_dir = os.path.join(path,'Resources')

	if not os.path.exists(resources_dir):
		print "Project directory doesn't look like a valid Titanium project: %s" % path
		sys.exit(1)	

	platform = sys.argv[2]
	tiapp = TiAppXML(tiapp_xml_path)
	app_name = tiapp.properties['name']
	mode = 'simulator'
	outdir = None
	
	if len(sys.argv) > 3:
		mode = sys.argv[3]
		if len(sys.argv) > 4:
			outdir = os.path.expanduser(sys.argv[4])
	
	c = LocaleCompiler(app_name,path,platform,mode,outdir)
	c.compile()
	

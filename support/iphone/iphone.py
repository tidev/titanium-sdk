#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# iPhone Application Script
#

import os,sys,shutil
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))
from tiapp import *

class IPhone(object):
	
	def __init__(self,name,id):
		self.name = name
		self.id = id
		
	def create(self,dir,release=False):
		
		project_dir = os.path.join(dir,self.name)

		if not os.path.exists(project_dir):
			os.makedirs(project_dir)
			
		iphone_dir = os.path.join(project_dir,'build','iphone')	

		if not os.path.exists(iphone_dir):
			os.makedirs(iphone_dir)
		
		iphone_project_resources = os.path.join(project_dir,'Resources','iphone')
		if os.path.exists(iphone_project_resources):
			shutil.rmtree(iphone_project_resources)
		shutil.copytree(os.path.join(template_dir,'resources'),iphone_project_resources)
		
		plist = open(os.path.join(template_dir,'Info.plist'),'r').read()
		plist = plist.replace('__PROJECT_NAME__',self.name)
		plist = plist.replace('__PROJECT_ID__',self.id)

		out_plist = open(os.path.join(iphone_dir,'Info.plist'),'w')
		out_plist.write(plist)
		out_plist.close()

		out_plist = open(os.path.join(iphone_dir,'Info.plist.template'),'w')
		out_plist.write(plist)
		out_plist.close()
		
		# create the xcode project
		xcode_dir = os.path.join(iphone_dir,self.name+'.xcodeproj')
		if not os.path.exists(xcode_dir):
			os.makedirs(xcode_dir)

		xcodeproj = open(os.path.join(template_dir,'project.pbxproj'),'r').read()
		xcodeproj = xcodeproj.replace('__PROJECT_NAME__',self.name)
		xcodeproj = xcodeproj.replace('__PROJECT_ID__',self.id)

		xcode_pbx = open(os.path.join(xcode_dir,'project.pbxproj'),'w')
		xcode_pbx.write(xcodeproj)
		xcode_pbx.close()

		# create the build directory
		build_dir = os.path.join(project_dir,'build','iphone','generated')
		if not os.path.exists(build_dir):
			os.makedirs(build_dir)
		
		# create the iphone resources	
		iphone_resources_dir = os.path.join(iphone_dir,'Resources')
		if not os.path.exists(iphone_resources_dir):
			os.makedirs(iphone_resources_dir)

		for lib in ['MainWindow_iphone.xib','MainWindow_ipad.xib']:
			shutil.copy(os.path.join(template_dir,lib),os.path.join(iphone_resources_dir,lib))

		# NOTE, by default we just copy in iphone 3.0 since thats what
		# the default project is setup for b
		shutil.copy(os.path.join(template_dir,'libTitanium.a'),os.path.join(iphone_resources_dir,'libTitanium.a'))
			
		# copy project.pch to iphone directory		
		shutil.copy(os.path.join(template_dir,'project.pch'),os.path.join(iphone_dir,self.name+'_Prefix.pch'))

		# copy main.m to iphone directory		
		main_template = open(os.path.join(template_dir,'main.m'),'r').read()

		main_dest = open(os.path.join(iphone_dir,'main.m'),'w')
		main_dest.write(main_template)
		main_dest.close()

		# copy over the entitlements for distribution
		shutil.copy(os.path.join(template_dir,'Entitlements.plist'),iphone_resources_dir)
					
		# copy README to iphone directory		
		shutil.copy(os.path.join(template_dir,'README'),os.path.join(iphone_dir,'README'))
		
		# create generic objective-c Classes directory
		classes_dir = os.path.join(iphone_dir,'Classes')
		if not os.path.exists(classes_dir):
			os.makedirs(classes_dir)
			
		# copy in our application routing logic
		for file in ['ApplicationRouting.h','ApplicationRouting.m']:
			shutil.copy(os.path.join(template_dir,file),os.path.join(classes_dir,file))


if __name__ == '__main__':
	# this is for testing only for the time being
	if len(sys.argv) != 4 or sys.argv[1]=='--help':
		print "Usage: %s <name> <id> <directory>" % os.path.basename(sys.argv[0])
		sys.exit(1)

		
	iphone = IPhone(sys.argv[1],sys.argv[2])
	iphone.create(sys.argv[3])
	
		

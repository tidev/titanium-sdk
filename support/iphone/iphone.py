#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# iPhone Application Script
#

import os,sys,shutil
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))
from tiapp import *
from projector import *

class IPhone(object):
	
	def __init__(self,name,appid):
		self.name = name
		self.id = appid
		
	def create(self,dir,release=False):
		
		project_dir = os.path.join(dir,self.name)

		if not os.path.exists(project_dir):
			os.makedirs(project_dir)
			
		iphone_dir = os.path.join(project_dir,'build','iphone')	

		if not os.path.exists(iphone_dir):
			os.makedirs(iphone_dir)
		
		version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))
		project = Projector(self.name,version,template_dir,project_dir,self.id)
		project.create(template_dir,iphone_dir)	
		
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
		
		# create the iphone resources	
		iphone_resources_dir = os.path.join(iphone_dir,'Resources')
		if not os.path.exists(iphone_resources_dir):
			os.makedirs(iphone_resources_dir)

		# copy main.m to iphone directory		
		main_template = open(os.path.join(template_dir,'main.m'),'r').read()
		
		# write .gitignore
		gitignore = open(os.path.join(iphone_dir,'.gitignore'),'w')
		# exclude generated files
		gitignore.write("Classes\n")
		gitignore.write("tmp\n")
		gitignore.write("build\n")
		gitignore.write("headers\n")
		gitignore.write("lib\n")
#		gitignore.write("MainWindow.xib\n")
		gitignore.close()

		gitignore = open(os.path.join(iphone_dir,'%s.xcodeproj'%self.name,'.gitignore'),'w')
		# exclude generated files
		gitignore.write("*.pbxuser\n")
		gitignore.write("*.pbxproj\n")
		gitignore.write("*.perspectivev3\n")
		gitignore.close()

		gitignore = open(os.path.join(iphone_dir,'Resources','.gitignore'),'w')
		# exclude generated files
		gitignore.write(".simulator\n")
		gitignore.write("libTiCore.a\n")
		gitignore.write("libTitanium.a\n")
		gitignore.close()

		gitignore = open(os.path.join(iphone_dir,'lib','.gitignore'),'w')
		# exclude lib since it's dynamic
		gitignore.write("libTiCore.a\n")
		gitignore.close()

		main_dest = open(os.path.join(iphone_dir,'main.m'),'w')
		main_dest.write(main_template)
		main_dest.close()

		# copy over the entitlements for distribution
		shutil.copy(os.path.join(template_dir,'Entitlements.plist'),iphone_resources_dir)
					
		# copy README to iphone directory		
		shutil.copy(os.path.join(template_dir,'README'),os.path.join(iphone_dir,'README'))

		for xib in ['ipad','iphone']:
			# copy README to iphone directory
			name = 'MainWindow_%s' % xib		
			shutil.copy(os.path.join(template_dir,'Resources',name),iphone_resources_dir)

		# symlink 
		libticore = os.path.join(template_dir,'libTiCore.a')
		cwd = os.getcwd()
		os.chdir(os.path.join(iphone_dir,'lib'))
		os.symlink(libticore,"libTiCore.a")
		os.chdir(cwd)


if __name__ == '__main__':
	# this is for testing only for the time being
	if len(sys.argv) != 4 or sys.argv[1]=='--help':
		print "Usage: %s <name> <id> <directory>" % os.path.basename(sys.argv[0])
		sys.exit(1)

		
	iphone = IPhone(sys.argv[1],sys.argv[2])
	iphone.create(sys.argv[3])
	
		

#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# Mobile Web Application Script
#

import os,sys,shutil

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))

class MobileWeb(object):
	
	def __init__(self,name,appid):
		self.name = name
		self.id = appid
		
	def create(self,dir,release=False):
		
		if release:
			project_dir = dir
			mobileweb_dir = dir
		else:
			project_dir = os.path.join(dir,self.name)
			mobileweb_dir = os.path.join(project_dir,'build','mobileweb')	

		if not os.path.exists(project_dir):
			os.makedirs(project_dir)
			
		if not os.path.exists(mobileweb_dir):
			os.makedirs(mobileweb_dir)
		
		version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))
		
		mobileweb_project_resources = os.path.join(project_dir,'Resources','mobileweb')
		if os.path.exists(mobileweb_project_resources):
			shutil.rmtree(mobileweb_project_resources)
		shutil.copytree(os.path.join(template_dir,'resources'),mobileweb_project_resources)
		
		# create the mobileweb resources	
		mobileweb_resources_dir = os.path.join(mobileweb_dir,'Resources')
		if not os.path.exists(mobileweb_resources_dir):
			os.makedirs(mobileweb_resources_dir)

if __name__ == '__main__':
	# this is for testing only for the time being
	if len(sys.argv) != 4 or sys.argv[1]=='--help':
		print "Usage: %s <name> <id> <directory>" % os.path.basename(sys.argv[0])
		sys.exit(1)
		
	mw = MobileWeb(sys.argv[1],sys.argv[2])
	mw.create(sys.argv[3])

#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# iPhone Module Project Create Script
#
import os,sys,shutil

#
# this class is created after all template files (if any) in
# this directory are copied to allow the project creation 
# script to complete the install
# 
class iphone(object):
	def __init__(self,project_dir,config,module):
		
		git = os.path.join(project_dir,'Classes','.gitignore')
		git_file = open(git,'w')
		git_file.write("%s.h\n" % module.module_name)
		git_file.write("%s.m\n" % module.module_name)
		git_file.close()
		
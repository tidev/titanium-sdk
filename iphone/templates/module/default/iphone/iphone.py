#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# iPhone Module Project Create Script
#
import os,sys,shutil
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
module_dir = os.path.dirname(template_dir)
sys.path.append(module_dir)

import module

#
# this class is created after all template files (if any) in
# this directory are copied to allow the project creation 
# script to complete the install
# 
class iphone(module.ModulePlatform):
	def finished(self):
		git = os.path.join(self.project_dir,'Classes','.gitignore')
		git_file = open(git,'w')
		git_file.write("%s.h\n" % self.module.module_name)
		git_file.write("%s.m\n" % self.module.module_name)
		git_file.close()
		
		# make sure we have our Xcode templates installed
		install_script = os.path.join(template_dir,'xcode','install.py')
		if os.path.exists(install_script):
			cmd = "\"%s\"" % install_script
			os.system(cmd)
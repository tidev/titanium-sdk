#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Builder for Mobile Web app
# 

import os, sys
import compiler
# the template_dir is the path where this file lives on disk
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
def main(args):
	if len(args) < 3:
		print "[ERROR] Usage: %s <project_dir> <deploytype>" % os.path.basename(args[0])
		sys.exit(1)
		
	project_dir = os.path.expanduser(args[1])
	deploytype = args[2]
	compiler.Compiler(project_dir,deploytype)
	
if __name__ == "__main__":
	main(sys.argv)
	sys.exit(0)

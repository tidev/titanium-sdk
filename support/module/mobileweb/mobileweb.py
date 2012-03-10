#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# Mobile Web Module Project Create Script
#
import os,sys,shutil
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
module_dir = os.path.dirname(template_dir)
sys.path.append(module_dir)
import module

class mobileweb(module.ModulePlatform): pass

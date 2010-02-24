#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Simple script that installs the Titanium class templates to the default platform location
#
import os, sys, shutil

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
xcodedir = os.path.join("/Developer","Platforms","iPhoneOS.platform","Developer","Library","Xcode")

file_dir = os.path.join(xcodedir,"File Templates","Appcelerator")
project_dir = os.path.join(xcodedir,"Project Templates","Appcelerator")

if not os.path.exists(file_dir):
	os.makedirs(file_dir)

if not os.path.exists(project_dir):
	os.makedirs(project_dir)

shutil.copytree(os.path.join(template_dir,'Titanium class'), os.path.join(file_dir,'Titanium class'))
shutil.copytree(os.path.join(template_dir,'Titanium Mobile Module'), os.path.join(project_dir,'Titanium Mobile Module'))


sys.exit(0)

#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Simple script that installs the Titanium class templates to the default platform location
#
import os, sys, shutil

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

#TODO: need to run xcode-select to get the true path to xcode

xcodedir = os.path.join("/Developer","Platforms","iPhoneOS.platform","Developer","Library","Xcode")
file_dir = os.path.join(xcodedir,"File Templates")

if os.path.exists(file_dir):
	shutil.rmtree(file_dir)

if not os.path.exists(file_dir):
	os.makedirs(file_dir)

shutil.copytree(os.path.join(template_dir,'Titanium'), os.path.join(file_dir,'Appcelerator'))

print "Appcelerator Titanium XCode templates installed"

sys.exit(0)

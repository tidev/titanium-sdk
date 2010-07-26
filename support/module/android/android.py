#!/usr/bin/env python 
# -*- coding: utf-8 -*-
#
# Android Module Project Create Script
#
import os,sys,shutil
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
reference_jars = ['titanium.jar', 'js.jar']
create_folders = ['lib']

isDebug=False
#
# this class is created after all template files (if any) in
# this directory are copied to allow the project creation 
# script to complete the install
# 
class android(object):
	def __init__(self,project_dir,config,module):
		# copy over the needed jars
		if isDebug:
			print "Template DIR: %s " % template_dir
		
		jar_locations = os.path.abspath(os.path.join(template_dir,'..','..','android'))
		
		if isDebug:
			print "Jar Locations %s" % jar_locations

		# Create any needed folders
		for this_folder in create_folders:
			os.mkdir(os.path.join(project_dir,this_folder))
		
		# rename the project file
		os.rename(os.path.join(project_dir,'.project_template'), os.path.join(project_dir,'.project'))		

		# Classpath processing for the project
		# Construct the name,  rename the old .classpath		
		class_path_file = os.path.join(project_dir,'.classpath')
		old_classpath_file = os.path.join(project_dir,'.classpath.old')
		os.rename(class_path_file, old_classpath_file)
		
		# Build up the replacement string
		classpath_refs = "";
		for jar in reference_jars:
			classpath_refs += '<classpathentry kind="lib" path="%s/%s"/>\n' % (jar_locations, jar)		
		
		# Processing contents of classpath 
		contents = open(old_classpath_file).read()
		tof = open(class_path_file,'w')
		contents = contents.replace('<!--__INCLUDE_JARS__-->',classpath_refs )
		tof.write(contents)
		tof.close()
		
		# Create the build.properties file 
		# titanium.platform = /home/dasher/.titanium/mobilesdk/linux/1.3.3/android
		# android.platform = /usr/local/android-sdk-linux/platforms/android-1.6
		# google.apis aren't supported currently
		build_properties = os.path.join(project_dir,"build.properties")
		tof = open(build_properties,'w')
		tof.write("titanium.platform = %s\n" % jar_locations)
		tof.write("android.platform = %s\n" % module.sdk)
		tof.close()
		# Cleanup 
		os.remove(old_classpath_file)
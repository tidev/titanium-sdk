#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# General builder script for staging, packaging, deploying,
# and debugging Titanium Mobile applications on Android
#
import os, sys, subprocess, shutil, time, signal, string, platform, re, glob, hashlib, imp, inspect
import run, avd, prereq, zipfile, tempfile, fnmatch, codecs, traceback
from os.path import splitext
from compiler import Compiler
from os.path import join, splitext, split, exists
from shutil import copyfile
from xml.dom.minidom import parseString
from tilogger import *
from datetime import datetime, timedelta

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
top_support_dir = os.path.dirname(template_dir) 
sys.path.append(top_support_dir)
sys.path.append(os.path.join(top_support_dir, 'common'))
sys.path.append(os.path.join(top_support_dir, 'module'))

import simplejson
from mako.template import Template
from tiapp import *
from android import Android
from androidsdk import AndroidSDK
from deltafy import Deltafy, Delta
from css import csscompiler
from module import ModuleDetector
import localecompiler
import fastdev
import requireIndex

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn', 'CVS'];
android_avd_hw = {'hw.camera': 'yes', 'hw.gps':'yes'}
res_skips = ['style']
log = None

# Copied from frameworks/base/tools/aapt/Package.cpp
uncompressed_types = [
	".jpg", ".jpeg", ".png", ".gif",
	".wav", ".mp2", ".mp3", ".ogg", ".aac",
	".mpg", ".mpeg", ".mid", ".midi", ".smf", ".jet",
	".rtttl", ".imy", ".xmf", ".mp4", ".m4a",
	".m4v", ".3gp", ".3gpp", ".3g2", ".3gpp2",
	".amr", ".awb", ".wma", ".wmv"
]

# Java keywords to reference in case app id contains java keyword
java_keywords = [
	"abstract",	"continue",	"for", "new", "switch",
	"assert", "default", "goto", "package", "synchronized",
	"boolean", "do", "if", "private", "this",
	"break", "double", "implements", "protected", "throw",
	"byte", "else", "import", "public", "throws",
	"case", "enum", "instanceof", "return", "transient",
	"catch", "extends", "int", "short", "try",
	"char", "final", "interface", "static", "void",
	"class", "finally", "long",	"strictfp", "volatile",
	"const", "float", "native",	"super", "while",
	"true", "false", "null"
]


MIN_API_LEVEL = 8

def render_template_with_tiapp(template_text, tiapp_obj):
	t = Template(template_text)
	return t.render(tiapp=tiapp_obj)

def remove_ignored_dirs(dirs):
	for d in dirs:
		if d in ignoreDirs:
			dirs.remove(d)

# ZipFile.extractall introduced in Python 2.6, so this is workaround for earlier
# versions
def zip_extractall(zfile, target_dir):
	file_infos = zfile.infolist()
	for info in file_infos:
		if info.file_size > 0:
			file_path = os.path.join(target_dir, os.path.normpath(info.filename))
			parent_path = os.path.dirname(file_path)
			if not os.path.exists(parent_path):
				os.makedirs(parent_path)
			out_file = open(file_path, "wb")
			out_file.write(zfile.read(info.filename))
			out_file.close()

def dequote(s):
	if s[0:1] == '"':
		return s[1:-1]
	return s

def pipe(args1,args2):
	p1 = subprocess.Popen(args1, stdout=subprocess.PIPE)
	p2 = subprocess.Popen(args2, stdin=p1.stdout, stdout=subprocess.PIPE)
	return p2.communicate()[0]

def read_properties(propFile, separator=":= "):
	propDict = dict()
	for propLine in propFile:
		propDef = propLine.strip()
		if len(propDef) == 0:
			continue
		if propDef[0] in ( '!', '#' ):
			continue
		punctuation= [ propDef.find(c) for c in separator ] + [ len(propDef) ]
		found= min( [ pos for pos in punctuation if pos != -1 ] )
		name= propDef[:found].rstrip()
		value= propDef[found:].lstrip(separator).rstrip()
		propDict[name]= value
	propFile.close()
	return propDict

def info(msg):
	log.info(msg)

def debug(msg):
	log.debug(msg)

def warn(msg):
	log.warn(msg)

def trace(msg):
	log.trace(msg)
	
def error(msg):
	log.error(msg)

def copy_all(source_folder, dest_folder, ignore_dirs=[], ignore_files=[], ignore_exts=[], one_time_msg=""):
	msg_shown = False
	for root, dirs, files in os.walk(source_folder):
		for d in dirs:
			if d in ignore_dirs:
				dirs.remove(d)
		for f in files:
			if f in ignore_files:
				continue
			ext = os.path.splitext(f)[1]
			if ext in ignore_exts:
				continue
			if one_time_msg and not msg_shown:
				info(one_time_msg)
				msg_shown = True
			from_ = os.path.join(root, f)
			to_ = from_.replace(source_folder, dest_folder, 1)
			to_directory = os.path.split(to_)[0]
			if not os.path.exists(to_directory):
				os.makedirs(to_directory)
			shutil.copyfile(from_, to_)

def remove_orphaned_files(source_folder, target_folder, ignore=[]):
	is_res = source_folder.endswith('Resources') or source_folder.endswith('Resources' + os.sep)
	for root, dirs, files in os.walk(target_folder):
		for f in files:
			if f in ignore:
				continue
			full = os.path.join(root, f)
			rel = full.replace(target_folder, '')
			if rel[0] == os.sep:
				rel = rel[1:]
			is_orphan = False
			if not os.path.exists(os.path.join(source_folder, rel)):
				is_orphan = True
			# But it could be under android/... too (platform-specific)
			if is_orphan and is_res:
				if os.path.exists(os.path.join(source_folder, 'android', rel)):
					is_orphan = False

			if is_orphan:
				os.remove(full)

def is_resource_drawable(path):
	if re.search("android/images/(high|medium|low|res-[^/]+)/", path.replace(os.sep, "/")):
		return True
	else:
		return False

def resource_drawable_folder(path):
	if not is_resource_drawable(path):
		return None
	else:
		pattern = r'/android/images/(high|medium|low|res-[^/]+)/'
		match = re.search(pattern, path.replace(os.sep, "/"))
		if not match.groups():
			return None
		folder = match.groups()[0]
		if re.match('high|medium|low', folder):
			return 'drawable-%sdpi' % folder[0]
		else:
			return 'drawable-%s' % folder.replace('res-', '')

class Builder(object):

	def __init__(self, name, sdk, project_dir, support_dir, app_id):
		self.top_dir = project_dir
		self.project_tiappxml = os.path.join(self.top_dir,'tiapp.xml')
		self.project_dir = os.path.join(project_dir,'build','android')
		self.res_dir = os.path.join(self.project_dir,'res')
		self.platform_dir = os.path.join(project_dir, 'platform', 'android')
		self.project_src_dir = os.path.join(self.project_dir, 'src')
		self.project_gen_dir = os.path.join(self.project_dir, 'gen')
		self.name = name
		self.app_id = app_id
		self.support_dir = support_dir
		self.compiled_files = []
		self.force_rebuild = False
		self.debugger_host = None
		self.debugger_port = -1
		self.fastdev_port = -1
		self.fastdev = False
		self.compile_js = False
		
		# don't build if a java keyword in the app id would cause the build to fail
		tok = self.app_id.split('.')
		for token in tok:
			if token in java_keywords:
				error("Do not use java keywords for project app id, such as " + token)
				sys.exit(1)

		temp_tiapp = TiAppXML(self.project_tiappxml)
		if temp_tiapp and temp_tiapp.android and 'tool-api-level' in temp_tiapp.android:
			self.tool_api_level = int(temp_tiapp.android['tool-api-level'])
		else:
			self.tool_api_level = MIN_API_LEVEL
		self.sdk = AndroidSDK(sdk, self.tool_api_level)
		self.tiappxml = temp_tiapp

		json_contents = open(os.path.join(template_dir,'dependency.json')).read()
		self.depends_map = simplejson.loads(json_contents)
		self.runtime = self.tiappxml.app_properties.get('ti.android.runtime', self.depends_map['runtimes']['defaultRuntime'])

		self.set_java_commands()
		# start in 1.4, you no longer need the build/android directory
		# if missing, we'll create it on the fly
		if not os.path.exists(self.project_dir) or not os.path.exists(os.path.join(self.project_dir,'AndroidManifest.xml')):
			android_creator = Android(name, app_id, self.sdk, None, self.java)
			parent_dir = os.path.dirname(self.top_dir)
			if os.path.exists(self.top_dir):
				android_creator.create(parent_dir, project_dir=self.top_dir, build_time=True)
			else:
				android_creator.create(parent_dir)
			
			self.force_rebuild = True
			sys.stdout.flush()
		
		# favor the ANDROID_SDK_HOME environment variable if used
		if os.environ.has_key('ANDROID_SDK_HOME') and os.path.exists(os.environ['ANDROID_SDK_HOME']):
			self.home_dir = os.path.join(os.environ['ANDROID_SDK_HOME'], '.titanium')
			self.android_home_dir = os.path.join(os.environ['ANDROID_SDK_HOME'], '.android')
		# we place some files in the users home
		elif platform.system() == "Windows":
			self.home_dir = os.path.join(os.environ['USERPROFILE'], '.titanium')
			self.android_home_dir = os.path.join(os.environ['USERPROFILE'], '.android')
		else:
			self.home_dir = os.path.join(os.path.expanduser('~'), '.titanium')
			self.android_home_dir = os.path.join(os.path.expanduser('~'), '.android')
		
		if not os.path.exists(self.home_dir):
			os.makedirs(self.home_dir)
		self.sdcard = os.path.join(self.home_dir,'android2.sdcard')
		self.classname = Android.strip_classname(self.name)
		
	def set_java_commands(self):
		self.jarsigner = "jarsigner"
		self.keytool = "keytool"
		self.javac = "javac"
		self.java = "java"
		java_home = None

		if os.environ.has_key("JAVA_HOME") and os.path.exists(os.environ["JAVA_HOME"]):
			java_home = os.environ["JAVA_HOME"]

		if platform.system() == "Windows":
			if java_home:
				home_jarsigner = os.path.join(java_home, "bin", "jarsigner.exe")
				home_keytool = os.path.join(java_home, "bin", "keytool.exe")
				home_javac = os.path.join(java_home, "bin", "javac.exe")
				home_java = os.path.join(java_home, "bin", "java.exe")
				found = True
				# TODO Document this path and test properly under windows
				if os.path.exists(home_jarsigner):
					self.jarsigner = home_jarsigner
				else:
					# Expected but not found
					found = False
					error("Required jarsigner not found")
				
				if os.path.exists(home_keytool):
					self.keytool = home_keytool
				else:
					error("Required keytool not found")
					found = False

				if os.path.exists(home_javac):
					self.javac = home_javac
				else:
					error("Required javac not found")
					found = False
					
				if os.path.exists(home_java):
					self.java = home_java
				else:
					error("Required java not found")
					found = False
					
				if found == False:
					error("One or more required files not found - please check your JAVA_HOME environment variable")
					sys.exit(1)
			else:
				found = False
				for path in os.environ['PATH'].split(os.pathsep):
					if os.path.exists(os.path.join(path, 'jarsigner.exe')) and os.path.exists(os.path.join(path, 'javac.exe')):
						self.jarsigner = os.path.join(path, 'jarsigner.exe')
						self.keytool = os.path.join(path, 'keytool.exe')
						self.javac = os.path.join(path, 'javac.exe')
						self.java = os.path.join(path, 'java.exe')
						java_home = os.path.dirname(os.path.dirname(self.javac))
						found = True
						break
				if not found:
					error("Error locating JDK: set $JAVA_HOME or put javac and jarsigner on your $PATH")
					sys.exit(1)

		if not os.environ.has_key("JAVA_HOME") and java_home:
			os.environ["JAVA_HOME"] = java_home

	def wait_for_home(self, type):
		max_wait = 20
		attempts = 0
		while True:
			processes = self.sdk.list_processes(['-%s' % type])
			found_home = False
			for process in processes:
				if process["name"] == "android.process.acore":
					found_home = True
					break
			if found_home:
				break
			attempts += 1
			if attempts == max_wait:
				error("Timed out waiting for android.process.acore")
				return False
			time.sleep(1)
		return True
	
	def wait_for_device(self, type):
		debug("Waiting for device to be ready ...")
		t = time.time()
		max_wait = 30
		max_zero = 6
		attempts = 0
		zero_attempts = 0
		timed_out = True
		no_devices = False
		
		while True:
			devices = self.sdk.list_devices()
			trace("adb devices returned %s devices/emulators" % len(devices))
			if len(devices) > 0:
				found = False
				for device in devices:
					if type == "e" and device.is_emulator() and not device.is_offline(): found = True
					elif type == "d" and device.is_device(): found = True
				if found:
					timed_out = False
					break
			else: zero_attempts += 1

			try: time.sleep(5) # for some reason KeyboardInterrupts get caught here from time to time
			except KeyboardInterrupt: pass
			attempts += 1
			if attempts == max_wait:
				break
			elif zero_attempts == max_zero:
				no_devices = True
				break
		
		if timed_out:
			if type == "e":
				device = "emulator"
				extra_message = "you may need to close the emulator and try again"
			else:
				device = "device"
				extra_message = "you may try reconnecting the USB cable"
			error("Timed out waiting for %s to be ready, %s" % (device, extra_message))
			if no_devices:
				sys.exit(1)
			return False

		debug("Device connected... (waited %d seconds)" % (attempts*5))
		duration = time.time() - t
		debug("waited %f seconds on emulator to get ready" % duration)
		if duration > 1.0:
			info("Waiting for the Android Emulator to become available")
			return self.wait_for_home(type)
			#time.sleep(20) # give it a little more time to get installed
		return True
	
	def create_avd(self, avd_id, avd_skin, avd_abi):
		# Sanity check the AVD to see if the ABI is available, or
		# necessary.
		
		available_avds = avd.get_avds(self.sdk)
		multiple_abis = False
		for device in available_avds:
			if device['id'] == avd_id:
				default_abi = device['abis'][0]
				multiple_abis = ( len(device['abis']) != 1 )
				if avd_abi is None:
					avd_abi = default_abi
				elif avd_abi not in device['abis']:
					warn("ABI %s not supported for AVD ID %s: Using default ABI %s" % (avd_abi, avd_id, default_abi))
					avd_abi = default_abi
				break
			
		if multiple_abis:
			name = "titanium_%s_%s_%s" % (avd_id, avd_skin, avd_abi)
		else:
			name = "titanium_%s_%s" % (avd_id, avd_skin)

		name = name.replace(' ', '_')
		if not os.path.exists(self.home_dir):
			os.makedirs(self.home_dir)
		avd_path = os.path.join(self.android_home_dir, 'avd')
		my_avd = os.path.join(avd_path,"%s.avd" % name)
		own_sdcard = os.path.join(self.home_dir, '%s.sdcard' % name)
		if not os.path.exists(my_avd) or os.path.exists(own_sdcard):
			# starting with 1.7.2, when we create a new avd, give it its own
			# SDCard as well.
			self.sdcard = own_sdcard
		if not os.path.exists(self.sdcard):
			info("Creating 64M SD card for use in Android emulator")
			run.run([self.sdk.get_mksdcard(), '64M', self.sdcard])
		if not os.path.exists(my_avd):
			info("Creating new Android Virtual Device (%s %s)" % (avd_id,avd_skin))
			inputgen = os.path.join(template_dir,'input.py')
			abi_args = []
			if multiple_abis:
				abi_args = ['-b', avd_abi]
			pipe([sys.executable, inputgen], [self.sdk.get_android(), '--verbose', 'create', 'avd', '--name', name, '--target', avd_id, '-s', avd_skin, '--force', '--sdcard', self.sdcard] + abi_args)
			inifile = os.path.join(my_avd,'config.ini')
			inifilec = open(inifile,'r').read()
			inifiledata = open(inifile,'w')
			inifiledata.write(inifilec)
			# TODO - Document options
			for hw_option in android_avd_hw.keys():
				inifiledata.write("%s=%s\n" % (hw_option, android_avd_hw[hw_option]))
			inifiledata.close()
			
		return name
	
	def run_emulator(self, avd_id, avd_skin, avd_name, avd_abi, add_args):
		info("Launching Android emulator...one moment")
		debug("From: " + self.sdk.get_emulator())
		debug("SDCard: " + self.sdcard)
		if avd_name is None:
			debug("AVD ID: " + avd_id)
			debug("AVD Skin: " + avd_skin)
		else:
			debug("AVD Name: " + avd_name)
			
		if avd_abi is not None:
			debug("AVD ABI: " + avd_abi)

		debug("SDK: " + sdk_dir)
		
		# make sure adb is running on windows, else XP can lockup the python
		# process when adb runs first time
		if platform.system() == "Windows":
			run.run([self.sdk.get_adb(), "start-server"], True, ignore_output=True)

		devices = self.sdk.list_devices()
		for device in devices:
			if device.is_emulator() and device.get_port() == 5560:
				info("Emulator is running.")
				sys.exit()
		
		# this will create an AVD on demand or re-use existing one if already created
		if avd_name == None:
			avd_name = self.create_avd(avd_id, avd_skin, avd_abi)

		# start the emulator
		emulator_cmd = [
			self.sdk.get_emulator(),
			'-avd',
			avd_name,
			'-port',
			'5560',
			'-sdcard',
			self.get_sdcard_path(),
			'-logcat',
			'*:d,*,TiAPI:V',
			'-no-boot-anim',
			'-partition-size',
			'128' # in between nexusone and droid
		]
		emulator_cmd.extend([arg.strip() for arg in add_args if len(arg.strip()) > 0])
		debug(' '.join(emulator_cmd))
		
		p = subprocess.Popen(emulator_cmd)
		
		def handler(signum, frame):
			debug("signal caught: %d" % signum)
			if not p == None:
				debug("calling emulator kill on %d" % p.pid)
				if platform.system() == "Windows":
					os.system("taskkill /F /T /PID %i" % p.pid)
				else:
					os.kill(p.pid, signal.SIGTERM)

		if platform.system() != "Windows":
			signal.signal(signal.SIGHUP, handler)
			signal.signal(signal.SIGQUIT, handler)
		
		signal.signal(signal.SIGINT, handler)
		signal.signal(signal.SIGABRT, handler)
		signal.signal(signal.SIGTERM, handler)
		
		# give it some time to exit prematurely
		time.sleep(1)
		rc = p.poll()
		
		if rc != None:
			handler(3,None)
			sys.exit(rc)
		
		# wait for the emulator to finish
		try:
			rc = p.wait()
		except OSError:
			handler(3,None)

		info("Android Emulator has exited")
		sys.exit(rc)
	
	def check_file_exists(self, path):
		output = self.run_adb('shell', 'ls', path)
		if output != None:
			if output.find("No such file or directory") == -1 \
				and output.find("error: device offline") == -1:
				return True
		return False
		
	def is_app_installed(self):
		return self.check_file_exists('/data/app/%s*.apk' % self.app_id)
	
	def get_sdcard_path(self):
		# We need to surround the sd card path in quotes for windows to account for spaces in path
		if platform.system() == "Windows":
			return '"' + self.sdcard + '"'
		return self.sdcard

	def are_resources_installed(self):
		return self.check_file_exists(self.sdcard_resources+'/app.js')
	
	def include_path(self, path, isfile):
		if not isfile and os.path.basename(path) in ignoreDirs: return False
		elif isfile and os.path.basename(path) in ignoreFiles: return False
		return True

	def warn_dupe_drawable_folders(self):
		tocheck = ('high', 'medium', 'low')
		image_parent = os.path.join(self.top_dir, 'Resources', 'android', 'images')
		for check in tocheck:
			if os.path.exists(os.path.join(image_parent, check)) and os.path.exists(os.path.join(image_parent, 'res-%sdpi' % check[0])):
				warn('You have both an android/images/%s folder and an android/images/res-%sdpi folder. Files from both of these folders will end up in res/drawable-%sdpi.  If two files are named the same, there is no guarantee which one will be copied last and therefore be the one the application uses.  You should use just one of these folders to avoid conflicts.' % (check, check[0], check[0]))

	def copy_module_platform_folders(self):
		for module in self.modules:
			platform_folder = os.path.join(module.path, 'platform', 'android')
			if os.path.exists(platform_folder):
				copy_all(platform_folder, self.project_dir, one_time_msg="Copying platform-specific files for '%s' module" % module.manifest.name)

	def copy_commonjs_modules(self):
		info('Copying CommonJS modules...')
		for module in self.modules:
			if module.js is None:
				continue
			module_name = os.path.basename(module.js)
			self.non_orphans.append(module_name)
			shutil.copy(module.js, self.assets_resources_dir)

	def copy_project_platform_folder(self, ignore_dirs=[], ignore_files=[]):
		if not os.path.exists(self.platform_dir):
			return
		copy_all(self.platform_dir, self.project_dir, ignore_dirs, ignore_files, one_time_msg="Copying platform-specific files ...")

	def copy_resource_drawables(self):
		debug('Processing Android resource drawables')

		def make_resource_drawable_filename(orig):
			normalized = orig.replace(os.sep, "/")
			matches = re.search("/android/images/(high|medium|low|res-[^/]+)/(?P<chopped>.*$)", normalized)
			if matches and matches.groupdict() and 'chopped' in matches.groupdict():
				chopped = matches.groupdict()['chopped'].lower()
				for_hash = chopped
				if for_hash.endswith('.9.png'):
					for_hash = for_hash[:-6] + '.png'
				extension = ""
				without_extension = chopped
				if re.search("\\..*$", chopped):
					if chopped.endswith('.9.png'):
						extension = '9.png'
						without_extension = chopped[:-6]
					else:
						extension = chopped.split(".")[-1]
						without_extension = chopped[:-(len(extension)+1)]
				cleaned_without_extension = re.sub(r'[^a-z0-9_]', '_', without_extension)
				cleaned_extension = re.sub(r'[^a-z0-9\._]', '_', extension)
				result = cleaned_without_extension[:80] + "_" + hashlib.md5(for_hash).hexdigest()[:10]
				if extension:
					result += "." + extension
				return result
			else:
				trace("Regexp for resource drawable file %s failed" % orig)
				return None

		def delete_resource_drawable(orig):
			folder = resource_drawable_folder(orig)
			res_file = os.path.join(self.res_dir, folder, make_resource_drawable_filename(orig))
			if os.path.exists(res_file):
				try:
					trace("DELETING FILE: %s" % res_file)
					os.remove(res_file)
				except:
					warn('Unable to delete %s: %s. Execution will continue.' % (res_file, sys.exc_info()[0]))

		def copy_resource_drawable(orig):
			partial_folder = resource_drawable_folder(orig)
			if not partial_folder:
				trace("Could not copy %s; resource folder not determined" % orig)
				return
			dest_folder = os.path.join(self.res_dir, partial_folder)
			dest_filename = make_resource_drawable_filename(orig)
			if dest_filename is None:
				return
			dest = os.path.join(dest_folder, dest_filename)
			if not os.path.exists(dest_folder):
				os.makedirs(dest_folder)
			trace("COPYING FILE: %s => %s" % (orig, dest))
			shutil.copy(orig, dest)
		
		fileset = []
		if self.force_rebuild or self.deploy_type == 'production' or \
			(self.js_changed and not self.fastdev):
			for root, dirs, files in os.walk(os.path.join(self.top_dir, "Resources")):
				remove_ignored_dirs(dirs)
				for f in files:
					if f in ignoreFiles:
						continue
					path = os.path.join(root, f)
					if is_resource_drawable(path) and f != 'default.png':
						fileset.append(path)
		else:
			if self.project_deltas:
				for delta in self.project_deltas:
					path = delta.get_path()
					if is_resource_drawable(path):
						if delta.get_status() == Delta.DELETED:
							delete_resource_drawable(path)
						else:
							fileset.append(path)

		if len(fileset) == 0:
			return False

		for f in fileset:
			copy_resource_drawable(f)
		return True

	def copy_project_resources(self):
		info("Copying project resources..")

		def validate_filenames(topdir):
			for root, dirs, files in os.walk(topdir):
				remove_ignored_dirs(dirs)
				for d in dirs:
					if d == "iphone" or d == "mobileweb":
						dirs.remove(d)
				for filename in files:
					if filename.startswith("_"):
						error("%s is an invalid filename. Android will not package assets whose filenames start with underscores. Fix and rebuild." % os.path.join(root, filename))
						sys.exit(1)
		
		resources_dir = os.path.join(self.top_dir, 'Resources')
		validate_filenames(resources_dir)
		android_resources_dir = os.path.join(resources_dir, 'android')
		self.project_deltafy = Deltafy(resources_dir, include_callback=self.include_path)
		self.project_deltas = self.project_deltafy.scan()
		self.js_changed = False
		tiapp_delta = self.project_deltafy.scan_single_file(self.project_tiappxml)
		self.tiapp_changed = tiapp_delta is not None
		full_copy = not os.path.exists(self.assets_resources_dir)

		if self.tiapp_changed or self.force_rebuild or full_copy:
			info("Detected change in tiapp.xml, or assets deleted. Forcing full re-build...")
			# force a clean scan/copy when the tiapp.xml has changed
			self.project_deltafy.clear_state()
			self.project_deltas = self.project_deltafy.scan()
			# rescan tiapp.xml so it doesn't show up as created next time around 
			self.project_deltafy.scan_single_file(self.project_tiappxml)
			
		if self.tiapp_changed:
			for root, dirs, files in os.walk(self.project_gen_dir, topdown=False):
				for name in files:
					os.remove(os.path.join(root, name))
				for name in dirs:
					os.rmdir(os.path.join(root, name))
			
		def strip_slash(s):
			if s[0:1]=='/' or s[0:1]=='\\': return s[1:]
			return s
		
		def make_relative(path, relative_to, prefix=None):
			relative_path = strip_slash(path[len(relative_to):])
			if prefix is not None:
				return os.path.join(prefix, relative_path)
			return relative_path

		for delta in self.project_deltas:
			path = delta.get_path()
			if re.search("android/images/(high|medium|low|res-[^/]+)/", path.replace(os.sep, "/")):
				continue # density images are handled later

			if delta.get_status() == Delta.DELETED and path.startswith(android_resources_dir):
				shared_path = path.replace(android_resources_dir, resources_dir, 1)
				if os.path.exists(shared_path):
					dest = make_relative(shared_path, resources_dir, self.assets_resources_dir)
					trace("COPYING FILE: %s => %s (platform-specific file was removed)" % (shared_path, dest))
					shutil.copy(shared_path, dest)

			if delta.get_status() != Delta.DELETED:
				if path.startswith(android_resources_dir):
					dest = make_relative(path, android_resources_dir, self.assets_resources_dir)
				else:
					# don't copy it if there is an android-specific file
					if os.path.exists(path.replace(resources_dir, android_resources_dir, 1)):
						continue
					dest = make_relative(path, resources_dir, self.assets_resources_dir)
				if path.startswith(os.path.join(resources_dir, "iphone")) or path.startswith(os.path.join(resources_dir, "mobileweb")) or path.startswith(os.path.join(resources_dir, "blackberry")):
					continue
				parent = os.path.dirname(dest)
				if not os.path.exists(parent):
					os.makedirs(parent)
				trace("COPYING %s FILE: %s => %s" % (delta.get_status_str(), path, dest))
				shutil.copy(path, dest)
				if (path.startswith(resources_dir) or path.startswith(android_resources_dir)) and path.endswith(".js"):
					self.js_changed = True
				# copy to the sdcard in development mode
				if self.sdcard_copy and self.app_installed and (self.deploy_type == 'development' or self.deploy_type == 'test'):
					if path.startswith(android_resources_dir):
						relative_path = make_relative(delta.get_path(), android_resources_dir)
					else:
						relative_path = make_relative(delta.get_path(), resources_dir)
					relative_path = relative_path.replace("\\", "/")
					self.run_adb('push', delta.get_path(), "%s/%s" % (self.sdcard_resources, relative_path))

		index_json_path = os.path.join(self.assets_dir, "index.json")
		if len(self.project_deltas) > 0 or not os.path.exists(index_json_path):
			requireIndex.generateJSON(self.assets_dir, index_json_path)

	def check_permissions_mapping(self, key, permissions_mapping, permissions_list):
		try:
			perms = permissions_mapping[key]
			if perms:
				for perm in perms: 
					try:
						permissions_list.index(perm)

					except:
						permissions_list.append(perm)
		except:
			pass

	def generate_android_manifest(self,compiler):

		self.generate_localizations()
		
		# NOTE: these are built-in permissions we need -- we probably need to refine when these are needed too
		permissions_required = ['INTERNET','ACCESS_WIFI_STATE','ACCESS_NETWORK_STATE', 'WRITE_EXTERNAL_STORAGE']
		
		GEO_PERMISSION = [ 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION']
		CONTACTS_READ_PERMISSION = ['READ_CONTACTS']
		CONTACTS_PERMISSION = ['READ_CONTACTS', 'WRITE_CONTACTS']
		VIBRATE_PERMISSION = ['VIBRATE']
		CAMERA_PERMISSION = ['CAMERA']
		WALLPAPER_PERMISSION = ['SET_WALLPAPER']

		# Enable mock location if in development or test mode.
		if self.deploy_type == 'development' or self.deploy_type == 'test':
			GEO_PERMISSION.append('ACCESS_MOCK_LOCATION')

		# this is our module to permission(s) trigger - for each module on the left, require the permission(s) on the right
		permissions_module_mapping = {
			# GEO
			'geolocation' : GEO_PERMISSION
		}

		# this is our module method to permission(s) trigger - for each method on the left, require the permission(s) on the right
		permissions_method_mapping = {
			# MAP
			'Map.createView' : GEO_PERMISSION,
			# MEDIA
			'Media.vibrate' : VIBRATE_PERMISSION,
			'Media.showCamera' : CAMERA_PERMISSION,
			
			# CONTACTS
			'Contacts.createPerson' : CONTACTS_PERMISSION,
			'Contacts.removePerson' : CONTACTS_PERMISSION,
			'Contacts.getAllContacts' : CONTACTS_READ_PERMISSION,
			'Contacts.showContactPicker' : CONTACTS_READ_PERMISSION,
			'Contacts.showContacts' : CONTACTS_READ_PERMISSION,
			'Contacts.getPersonByID' : CONTACTS_READ_PERMISSION,
			'Contacts.getPeopleWithName' : CONTACTS_READ_PERMISSION,
			'Contacts.getAllPeople' : CONTACTS_READ_PERMISSION,
			'Contacts.getAllGroups' : CONTACTS_READ_PERMISSION,
			'Contacts.getGroupByID' : CONTACTS_READ_PERMISSION,

			# WALLPAPER
			'Media.Android.setSystemWallpaper' : WALLPAPER_PERMISSION,
		}
		
		VIDEO_ACTIVITY = """<activity
		android:name="ti.modules.titanium.media.TiVideoActivity"
		android:configChanges="keyboardHidden|orientation"
		android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
		android:launchMode="singleTask"
    	/>"""

		MAP_ACTIVITY = """<activity
    		android:name="ti.modules.titanium.map.TiMapActivity"
    		android:configChanges="keyboardHidden|orientation"
    		android:launchMode="singleTask"
    	/>
	<uses-library android:name="com.google.android.maps" />"""

		FACEBOOK_ACTIVITY = """<activity 
		android:name="ti.modules.titanium.facebook.FBActivity"
		android:theme="@android:style/Theme.Translucent.NoTitleBar"
    />"""

		CAMERA_ACTIVITY = """<activity 
		android:name="ti.modules.titanium.media.TiCameraActivity"
		android:configChanges="keyboardHidden|orientation"
		android:theme="@android:style/Theme.Translucent.NoTitleBar.Fullscreen"
    />"""
		
		activity_mapping = {
		
			# MEDIA
			'Media.createVideoPlayer' : VIDEO_ACTIVITY,
			'Media.showCamera' : CAMERA_ACTIVITY,
			
			# MAPS
			'Map.createView' : MAP_ACTIVITY,
	    	
			# FACEBOOK
			'Facebook.setup' : FACEBOOK_ACTIVITY,
			'Facebook.login' : FACEBOOK_ACTIVITY,
			'Facebook.createLoginButton' : FACEBOOK_ACTIVITY,
		}
		
		# this is a map of our APIs to ones that require Google APIs to be available on the device
		google_apis = {
			"Map.createView" : True
		}
		
		activities = []

		# figure out which permissions we need based on the used module
		for mod in compiler.modules:
			self.check_permissions_mapping(mod, permissions_module_mapping, permissions_required)

		# figure out which permissions we need based on the used module methods
		for mn in compiler.module_methods:
			self.check_permissions_mapping(mn, permissions_method_mapping, permissions_required)

			try:
				mappings = activity_mapping[mn]
				try:
					if google_apis[mn] and not self.google_apis_supported:
						warn("Google APIs detected but a device has been selected that doesn't support them. The API call to Titanium.%s will fail using '%s'" % (mn,my_avd['name']))
						continue
				except:
					pass
				try:
					activities.index(mappings)
				except:
					activities.append(mappings)
			except:
				pass

		# Javascript-based activities defined in tiapp.xml
		if self.tiapp and self.tiapp.android and 'activities' in self.tiapp.android:
			tiapp_activities = self.tiapp.android['activities']
			for key in tiapp_activities:
				activity = tiapp_activities[key]
				if not 'url' in activity:
					continue
				activity_name = self.app_id + '.' + activity['classname']
				activity_str = '<activity \n\t\t\tandroid:name="%s"' % activity_name
				for subkey in activity:
					if subkey not in ('nodes', 'name', 'url', 'options', 'classname', 'android:name'):
						activity_str += '\n\t\t\t%s="%s"' % (subkey, activity[subkey])

				if 'android:config' not in activity:
					activity_str += '\n\t\t\tandroid:configChanges="keyboardHidden|orientation"'
				if 'nodes' in activity:
					activity_str += '>'
					for node in activity['nodes']:
						activity_str += '\n\t\t\t\t' + node.toxml()
					activities.append(activity_str + '\n\t\t</activity>\n')
				else:
					activities.append(activity_str + '\n\t\t/>\n')

		activities = set(activities)

		services = []
		# Javascript-based services defined in tiapp.xml
		if self.tiapp and self.tiapp.android and 'services' in self.tiapp.android:
			tiapp_services = self.tiapp.android['services']
			for key in tiapp_services:
				service = tiapp_services[key]
				if not 'url' in service:
					continue
				service_name = self.app_id + '.' + service['classname']
				service_str = '<service \n\t\t\tandroid:name="%s"' % service_name
				for subkey in service:
					if subkey not in ('nodes', 'service_type', 'type', 'name', 'url', 'options', 'classname', 'android:name'):
						service_str += '\n\t\t\t%s="%s"' % (subkey, service[subkey])

				if 'nodes' in service:
					service_str += '>'
					for node in service['nodes']:
						service_str += '\n\t\t\t\t' + node.toxml()
					services.append(service_str + '\n\t\t</service>\n')
				else:
					services.append(service_str + '\n\t\t/>\n')


		self.use_maps = False
		self.res_changed = False
		icon_name = self.tiapp.properties['icon']
		icon_path = os.path.join(self.assets_resources_dir, icon_name)
		icon_ext = os.path.splitext(icon_path)[1]

		res_drawable_dest = os.path.join(self.project_dir, 'res', 'drawable')
		if not os.path.exists(res_drawable_dest):
			os.makedirs(res_drawable_dest)

		default_icon = os.path.join(self.support_resources_dir, 'default.png')
		dest_icon = os.path.join(res_drawable_dest, 'appicon%s' % icon_ext)
		if Deltafy.needs_update(icon_path, dest_icon):
			self.res_changed = True
			debug("copying app icon: %s" % icon_path)
			shutil.copy(icon_path, dest_icon)
		elif Deltafy.needs_update(default_icon, dest_icon):
			self.res_changed = True
			debug("copying default app icon")
			shutil.copy(default_icon, dest_icon)

		# make our Titanium theme for our icon
		res_values_dir = os.path.join(self.project_dir, 'res','values')
		if not os.path.exists(res_values_dir):
			os.makedirs(res_values_dir)
		theme_xml = os.path.join(res_values_dir,'theme.xml')
		if not os.path.exists(theme_xml):
			self.res_changed = True
			debug('generating theme.xml')
			theme_file = open(theme_xml, 'w')
			theme_flags = "Theme"
			# We need to treat the default values for fulscreen and
			# navbar-hidden the same as android.py does -- false for both.
			theme_fullscreen = False
			theme_navbarhidden = False
			if (self.tiapp.properties.get("fullscreen") == "true" or 
					self.tiapp.properties.get("statusbar-hidden") == "true"):
				theme_fullscreen = True
			elif self.tiapp.properties.get("navbar-hidden") == "true":
				theme_navbarhidden = True
			if theme_fullscreen:
				theme_flags += ".NoTitleBar.Fullscreen"
			elif theme_navbarhidden:
				theme_flags += ".NoTitleBar"
			# Wait, one exception.  If you want the notification area (very
			# top of screen) hidden, but want the title bar in the app,
			# there's no theme for that.  So we have to use the default theme (no flags)
			# and when the application code starts running, the adjustments are then made.
			# Only do this when the properties are explicitly set, so as to avoid changing
			# old default behavior.
			if theme_flags.endswith('.Fullscreen') and \
					self.tiapp.properties.get("navbar-hidden") == 'false' and \
					('fullscreen' in self.tiapp.explicit_properties or \
					'statusbar-hidden' in self.tiapp.explicit_properties) and \
					'navbar-hidden' in self.tiapp.explicit_properties:
				theme_flags = 'Theme'

			TITANIUM_THEME="""<?xml version="1.0" encoding="utf-8"?>
<resources>
<style name="Theme.Titanium" parent="android:%s">
    <item name="android:windowBackground">@drawable/background</item>
</style>
</resources>
""" % theme_flags
			theme_file.write(TITANIUM_THEME)
			theme_file.close()
		
		# create our background image which acts as splash screen during load	
		resources_dir = os.path.join(self.top_dir, 'Resources')
		android_images_dir = os.path.join(resources_dir, 'android', 'images')
		# look for density-specific default.png's first
		if os.path.exists(android_images_dir):
			pattern = r'/android/images/(high|medium|low|res-[^/]+)/default.png'
			for root, dirs, files in os.walk(android_images_dir):
				remove_ignored_dirs(dirs)
				for f in files:
					if f in ignoreFiles:
						continue
					path = os.path.join(root, f)
					if re.search(pattern, path.replace(os.sep, "/")):
						res_folder = resource_drawable_folder(path)
						debug('found %s splash screen at %s' % (res_folder, path))
						dest_path = os.path.join(self.res_dir, res_folder)
						dest_file = os.path.join(dest_path, 'background.png')
						if not os.path.exists(dest_path):
							os.makedirs(dest_path)
						if Deltafy.needs_update(path, dest_file):
							self.res_changed = True
							debug('copying %s splash screen to %s' % (path, dest_file))
							shutil.copy(path, dest_file)

		default_png = os.path.join(self.assets_resources_dir, 'default.png')
		support_default_png = os.path.join(self.support_resources_dir, 'default.png')
		background_png = os.path.join(self.project_dir, 'res','drawable','background.png')
		if os.path.exists(default_png) and Deltafy.needs_update(default_png, background_png):
			self.res_changed = True
			debug("found splash screen at %s" % os.path.abspath(default_png))
			shutil.copy(default_png, background_png)
		elif Deltafy.needs_update(support_default_png, background_png):
			self.res_changed = True
			debug("copying default splash screen")
			shutil.copy(support_default_png, background_png)
		

		android_manifest = os.path.join(self.project_dir, 'AndroidManifest.xml')
		android_manifest_to_read = android_manifest

		# NOTE: allow the user to use their own custom AndroidManifest if they put a file named
		# AndroidManifest.xml in platform/android, in which case all bets are off
		is_custom = False
		# Catch people who may have it in project root (un-released 1.4.x android_native_refactor branch users)
		if os.path.exists(os.path.join(self.top_dir, 'AndroidManifest.xml')):
			warn('AndroidManifest.xml file in the project root is ignored.  Move it to platform/android if you want it to be your custom manifest.')
		android_custom_manifest = os.path.join(self.project_dir, 'AndroidManifest.custom.xml')
		if not os.path.exists(android_custom_manifest):
			android_custom_manifest = os.path.join(self.platform_dir, 'AndroidManifest.xml')
		else:
			warn('Use of AndroidManifest.custom.xml is deprecated. Please put your custom manifest as "AndroidManifest.xml" in the "platform/android" directory if you do not need to compile for versions < 1.5')
		if os.path.exists(android_custom_manifest):
			android_manifest_to_read = android_custom_manifest
			is_custom = True
			info("Detected custom ApplicationManifest.xml -- no Titanium version migration supported")
		
		default_manifest_contents = self.android.render_android_manifest()
		custom_manifest_contents = None
		if is_custom:
			custom_manifest_contents = open(android_manifest_to_read,'r').read()

		manifest_xml = ''
		def get_manifest_xml(tiapp, template_obj=None):
			xml = ''
			if 'manifest' in tiapp.android_manifest:
				for manifest_el in tiapp.android_manifest['manifest']:
					# since we already track permissions in another way, go ahead and us e that
					if manifest_el.nodeName == 'uses-permission' and manifest_el.hasAttribute('android:name'):
						if manifest_el.getAttribute('android:name').split('.')[-1] not in permissions_required:
							perm_val = manifest_el.getAttribute('android:name')
							if template_obj is not None and "${" in perm_val:
								perm_val = render_template_with_tiapp(perm_val, template_obj)
							permissions_required.append(perm_val)
					elif manifest_el.nodeName not in ('supports-screens', 'uses-sdk'):
						this_xml = manifest_el.toprettyxml()
						if template_obj is not None and "${" in this_xml:
							this_xml = render_template_with_tiapp(this_xml, template_obj)
						xml += this_xml
			return xml
		
		application_xml = ''
		def get_application_xml(tiapp, template_obj=None):
			xml = ''
			if 'application' in tiapp.android_manifest:
				for app_el in tiapp.android_manifest['application']:
					this_xml = app_el.toxml()
					if template_obj is not None and "${" in this_xml:
						this_xml = render_template_with_tiapp(this_xml, template_obj)
					xml += this_xml
			return xml
		
		# add manifest / application entries from tiapp.xml
		manifest_xml += get_manifest_xml(self.tiapp)
		application_xml += get_application_xml(self.tiapp)
		
		# add manifest / application entries from modules
		for module in self.modules:
			if module.xml == None: continue
			manifest_xml += get_manifest_xml(module.xml, self.tiapp)
			application_xml += get_application_xml(module.xml, self.tiapp)

		# build the permissions XML based on the permissions detected
		permissions_required = set(permissions_required)
		permissions_required_xml = ""
		for p in permissions_required:
			if '.' not in p:
				permissions_required_xml+="<uses-permission android:name=\"android.permission.%s\"/>\n\t" % p
			else:
				permissions_required_xml+="<uses-permission android:name=\"%s\"/>\n\t" % p
		
		def fill_manifest(manifest_source):
			ti_activities = '<!-- TI_ACTIVITIES -->'
			ti_permissions = '<!-- TI_PERMISSIONS -->'
			ti_manifest = '<!-- TI_MANIFEST -->'
			ti_application = '<!-- TI_APPLICATION -->'
			ti_services = '<!-- TI_SERVICES -->'
			manifest_source = manifest_source.replace(ti_activities,"\n\n\t\t".join(activities))
			manifest_source = manifest_source.replace(ti_services,"\n\n\t\t".join(services))
			manifest_source = manifest_source.replace(ti_permissions,permissions_required_xml)
			if len(manifest_xml) > 0:
				manifest_source = manifest_source.replace(ti_manifest, manifest_xml)
			if len(application_xml) > 0:
				manifest_source = manifest_source.replace(ti_application, application_xml)

			return manifest_source

		default_manifest_contents = fill_manifest(default_manifest_contents)
		# if a custom uses-sdk or supports-screens has been specified via tiapp.xml
		# <android><manifest>..., we need to replace the ones in the generated
		# default manifest
		supports_screens_node = None
		uses_sdk_node = None
		if 'manifest' in self.tiapp.android_manifest:
			for node in self.tiapp.android_manifest['manifest']:
				if node.nodeName == 'uses-sdk':
					uses_sdk_node = node
				elif node.nodeName == 'supports-screens':
					supports_screens_node = node
		if supports_screens_node or uses_sdk_node or ('manifest-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['manifest-attributes'].length) or ('application-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['application-attributes'].length):
			dom = parseString(default_manifest_contents)
			def replace_node(olddom, newnode):
				nodes = olddom.getElementsByTagName(newnode.nodeName)
				retval = False
				if nodes:
					olddom.documentElement.replaceChild(newnode, nodes[0])
					retval = True
				return retval

			if supports_screens_node:
				if not replace_node(dom, supports_screens_node):
					dom.documentElement.insertBefore(supports_screens_node, dom.documentElement.firstChild.nextSibling)
			if uses_sdk_node:
				replace_node(dom, uses_sdk_node)

			def set_attrs(element, new_attr_set):
				for k in new_attr_set.keys():
					if element.hasAttribute(k):
						element.removeAttribute(k)
					element.setAttribute(k, new_attr_set.get(k).value)

			if 'manifest-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['manifest-attributes'].length:
				set_attrs(dom.documentElement, self.tiapp.android_manifest['manifest-attributes'])
			if 'application-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['application-attributes'].length:
				set_attrs(dom.getElementsByTagName('application')[0], self.tiapp.android_manifest['application-attributes'])

			default_manifest_contents = dom.toxml()

		if application_xml:
			# If the tiapp.xml <manifest><application> section was not empty, it could be
			# that user put in <activity> entries that duplicate our own,
			# such as if they want a custom theme on TiActivity.  So we should delete any dupes.
			dom = parseString(default_manifest_contents)
			package_name = dom.documentElement.getAttribute('package')
			manifest_activities = dom.getElementsByTagName('activity')
			activity_names = []
			nodes_to_delete = []
			for manifest_activity in manifest_activities:
				if manifest_activity.hasAttribute('android:name'):
					activity_name = manifest_activity.getAttribute('android:name')
					if activity_name.startswith('.'):
						activity_name = package_name + activity_name
					if activity_name in activity_names:
						nodes_to_delete.append(manifest_activity)
					else:
						activity_names.append(activity_name)
			if nodes_to_delete:
				for node_to_delete in nodes_to_delete:
					node_to_delete.parentNode.removeChild(node_to_delete)
				default_manifest_contents = dom.toxml()

		if custom_manifest_contents:
			custom_manifest_contents = fill_manifest(custom_manifest_contents)

		new_manifest_contents = None
		android_manifest_gen = android_manifest + '.gen'
		if custom_manifest_contents:
			new_manifest_contents = custom_manifest_contents
			# Write the would-be default as well so user can see
			# some of the auto-gen'd insides of it if they need/want.
			amf = open(android_manifest + '.gen', 'w')
			amf.write(default_manifest_contents)
			amf.close()
		else:
			new_manifest_contents = default_manifest_contents
			if os.path.exists(android_manifest_gen):
				os.remove(android_manifest_gen)

		manifest_changed = False
		old_contents = None
		if os.path.exists(android_manifest):
			old_contents = open(android_manifest, 'r').read()
		
		if new_manifest_contents != old_contents:
			trace("Writing out AndroidManifest.xml")
			amf = open(android_manifest,'w')
			amf.write(new_manifest_contents)
			amf.close()
			manifest_changed = True

		if self.res_changed or manifest_changed:
			res_dir = os.path.join(self.project_dir, 'res')
			output = run.run([self.aapt, 'package', '-m',
				'-J', self.project_gen_dir,
				'-M', android_manifest,
				'-S', res_dir,
				'-I', self.android_jar], warning_regex=r'skipping')

		r_file = os.path.join(self.project_gen_dir, self.app_id.replace('.', os.sep), 'R.java')
		if not os.path.exists(r_file) or (self.res_changed and output == None):
			error("Error generating R.java from manifest")
			sys.exit(1)

		return manifest_changed

	def generate_stylesheet(self):
		update_stylesheet = False
		resources_dir = os.path.join(self.top_dir, 'Resources')
		project_gen_pkg_dir = os.path.join(self.project_gen_dir, self.app_id.replace('.', os.sep))
		app_stylesheet = os.path.join(project_gen_pkg_dir, 'ApplicationStylesheet.java')
		if not os.path.exists(app_stylesheet):
			update_stylesheet = True
		else:
			for root, dirs, files in os.walk(resources_dir):
				remove_ignored_dirs(dirs)
				for f in files:
					if f in ignoreFiles:
						continue
					if f.endswith(".jss"):
						absolute_path = os.path.join(root, f)
						if Deltafy.needs_update(absolute_path, app_stylesheet):
							update_stylesheet = True
							break

		if not update_stylesheet:
			return

		cssc = csscompiler.CSSCompiler(resources_dir, 'android', self.app_id)
		if not os.path.exists(project_gen_pkg_dir):
			os.makedirs(project_gen_pkg_dir)
		debug("app stylesheet => %s" % app_stylesheet)
		
		asf = codecs.open(app_stylesheet, 'w', 'utf-8')
		asf.write(cssc.code)
		asf.close()

	def generate_localizations(self):
		# compile localization files
		localecompiler.LocaleCompiler(self.name,self.top_dir,'android',sys.argv[1]).compile()
		# fix un-escaped single-quotes and full-quotes
		offending_pattern = '[^\\\\][\'"]'
		for root, dirs, files in os.walk(self.res_dir):
			remove_ignored_dirs(dirs)
			for filename in files:
				if filename in ignoreFiles or not filename.endswith('.xml'):
					continue
				full_path = os.path.join(root, filename)
				f = codecs.open(full_path, 'r', 'utf-8')
				contents = f.read()
				f.close()
				if not re.search(r"<string ", contents):
					continue
				doc = parseString(contents.encode("utf-8"))
				string_nodes = doc.getElementsByTagName('string')
				if len(string_nodes) == 0:
					continue
				made_change = False
				for string_node in string_nodes:
					if not string_node.hasChildNodes():
						continue
					string_child = string_node.firstChild
					if string_child.nodeType == string_child.CDATA_SECTION_NODE or string_child.nodeType == string_child.TEXT_NODE:
						string_value = string_child.nodeValue
						if not re.search(offending_pattern, string_value):
							continue
						offenders = re.findall(offending_pattern, string_value)
						if offenders:
							for offender in offenders:
								string_value = string_value.replace(offender, offender[0] + "\\" + offender[-1:])
								made_change = True
						string_child.nodeValue = string_value
				if made_change:
					new_contents = doc.toxml()
					f = codecs.open(full_path, 'w', 'utf-8')
					f.write(new_contents)
					f.close()

	def recurse(self, paths, file_glob=None):
		if paths == None: yield None
		if not isinstance(paths, list): paths = [paths]
		
		for path in paths:
			for root, dirs, files in os.walk(path):
				remove_ignored_dirs(dirs)
				for filename in files:
					if filename in ignoreFiles:
						continue
					if file_glob != None:
						if not fnmatch.fnmatch(filename, file_glob): continue
					yield os.path.join(root, filename)

	def generate_aidl(self):
		# support for android remote interfaces in platform/android/src
		framework_aidl = self.sdk.platform_path('framework.aidl')
		aidl_args = [self.sdk.get_aidl(), '-p' + framework_aidl, '-I' + self.project_src_dir, '-o' + self.project_gen_dir]
		for aidl_file in self.recurse(self.project_src_dir, '*.aidl'):
			run.run(aidl_args + [aidl_file])

	def build_generated_classes(self):
		src_list = []
		self.module_jars = []

		class_delta = timedelta(seconds=1)
		for java_file in self.recurse([self.project_src_dir, self.project_gen_dir], '*.java'):
			if self.project_src_dir in java_file:
				relative_path = java_file[len(self.project_src_dir)+1:]
			else:
				relative_path = java_file[len(self.project_gen_dir)+1:]
			class_file = os.path.join(self.classes_dir, relative_path.replace('.java', '.class'))

			if Deltafy.needs_update(java_file, class_file) > 0:
				# the file list file still needs each file escaped apparently
				debug("adding %s to javac build list" % java_file)
				src_list.append('"%s"' % java_file.replace("\\", "\\\\"))

		if len(src_list) == 0:
			# No sources are older than their classfile counterparts, we can skip javac / dex
			return False

		classpath = os.pathsep.join([self.android_jar, os.pathsep.join(self.android_jars)])

		project_module_dir = os.path.join(self.top_dir,'modules','android')
		for module in self.modules:
			if module.jar == None: continue
			self.module_jars.append(module.jar)
			classpath = os.pathsep.join([classpath, module.jar])
			module_lib = module.get_resource('lib')
			for jar in glob.glob(os.path.join(module_lib, '*.jar')):
				self.module_jars.append(jar)
				classpath = os.pathsep.join([classpath, jar])

		if len(self.module_jars) > 0:
			# kroll-apt.jar is needed for modules
			classpath = os.pathsep.join([classpath, self.kroll_apt_jar])

		classpath = os.pathsep.join([classpath, os.path.join(self.support_dir, 'lib', 'titanium-verify.jar')])
		if self.deploy_type != 'production':
			classpath = os.pathsep.join([classpath, os.path.join(self.support_dir, 'lib', 'titanium-debug.jar')])

		debug("Building Java Sources: " + " ".join(src_list))
		javac_command = [self.javac, '-encoding', 'utf8',
			'-classpath', classpath, '-d', self.classes_dir, '-proc:none',
			'-sourcepath', self.project_src_dir,
			'-sourcepath', self.project_gen_dir, '-target', '1.6', '-source', '1.6']
		(src_list_osfile, src_list_filename) = tempfile.mkstemp()
		src_list_file = os.fdopen(src_list_osfile, 'w')
		src_list_file.write("\n".join(src_list))
		src_list_file.close()
		
		javac_command.append('@' + src_list_filename)
		(out, err, javac_process) = run.run(javac_command, ignore_error=True, return_error=True, return_process=True)
		os.remove(src_list_filename)
		if javac_process.returncode != 0:
			error("Error(s) compiling generated Java code")
			error(str(err))
			sys.exit(1)
		return True

	def create_unsigned_apk(self, resources_zip_file):
		unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')
		self.apk_updated = False

		apk_modified = None
		if os.path.exists(unsigned_apk):
			apk_modified = Deltafy.get_modified_datetime(unsigned_apk)

		debug("creating unsigned apk: " + unsigned_apk)
		# copy existing resources into the APK
		apk_zip = zipfile.ZipFile(unsigned_apk, 'w', zipfile.ZIP_DEFLATED)

		def skip_jar_path(path):
			ext = os.path.splitext(path)[1]
			if path.endswith('/'): return True
			if path.startswith('META-INF/'): return True
			if path.split('/')[-1].startswith('.'): return True
			if ext == '.class': return True
			if 'org/appcelerator/titanium/bindings' in path and ext == '.json': return True

		def skip_js_file(path):
			return self.compile_js is True and \
				os.path.splitext(path)[1] == '.js'

		def compression_type(path):
			ext = os.path.splitext(path)[1]
			if ext in uncompressed_types:
				return zipfile.ZIP_STORED
			return zipfile.ZIP_DEFLATED

		def zipinfo(path):
			info = zipfile.ZipInfo(path)
			info.compress_type = compression_type(path)
			return info

		def is_modified(path):
			return apk_modified is None or Deltafy.needs_update_timestamp(path, apk_modified)

		def zip_contains(zip, entry):
			try:
				zip.getinfo(entry)
			except:
				return False
			return True

		if is_modified(resources_zip_file):
			self.apk_updated = True
			resources_zip = zipfile.ZipFile(resources_zip_file)
			for path in resources_zip.namelist():
				if skip_jar_path(path) or skip_js_file(path): continue
				debug("from resource zip => " + path)
				apk_zip.writestr(zipinfo(path), resources_zip.read(path))
			resources_zip.close()
		
		# add classes.dex
		if is_modified(self.classes_dex) or not zip_contains(apk_zip, 'classes.dex'):
			apk_zip.write(self.classes_dex, 'classes.dex')
		
		# add all resource files from the project
		for root, dirs, files in os.walk(self.project_src_dir):
			remove_ignored_dirs(dirs)
			for f in files:
				if f in ignoreFiles:
					continue
				if os.path.splitext(f)[1] != '.java':
					absolute_path = os.path.join(root, f)
					relative_path = os.path.join(root[len(self.project_src_dir)+1:], f)
					if is_modified(absolute_path) or not zip_contains(apk_zip, relative_path):
						self.apk_updated = True
						debug("resource file => " + relative_path)
						apk_zip.write(os.path.join(root, f), relative_path, compression_type(f))
		
		def add_resource_jar(jar_file):
			jar = zipfile.ZipFile(jar_file)
			for path in jar.namelist():
				if skip_jar_path(path): continue
				debug("from JAR %s => %s" % (jar_file, path))
				apk_zip.writestr(zipinfo(path), jar.read(path))
			jar.close()
		
		for jar_file in self.module_jars:
			add_resource_jar(jar_file)
		for jar_file in self.android_jars:
			add_resource_jar(jar_file)

		def add_native_libs(libs_dir, exclude=[]):
			if os.path.exists(libs_dir):
				for abi_dir in os.listdir(libs_dir):
					libs_abi_dir = os.path.join(libs_dir, abi_dir)
					if not os.path.isdir(libs_abi_dir): continue
					for file in os.listdir(libs_abi_dir):
						if file.endswith('.so') and file not in exclude:
							native_lib = os.path.join(libs_abi_dir, file)
							path_in_zip = '/'.join(['lib', abi_dir, file])
							if is_modified(native_lib) or not zip_contains(apk_zip, path_in_zip):
								self.apk_updated = True
								debug("installing native lib: %s" % native_lib)
								apk_zip.write(native_lib, path_in_zip)

		# add module native libraries
		for module in self.modules:
			exclude_libs = []
			if self.runtime != 'v8':
				# Don't need the v8 version of the module itself.
				# (But of course we do want any other native libraries
				# that the module developer may have packaged.)
				exclude_libs.append('lib%s.so' % module.manifest.moduleid)
			add_native_libs(module.get_resource('libs'), exclude_libs)

		# add any native libraries : libs/**/*.so -> lib/**/*.so
		add_native_libs(os.path.join(self.project_dir, 'libs'))

		# add sdk runtime native libraries
		debug("installing native SDK libs")
		sdk_native_libs = os.path.join(template_dir, 'native', 'libs')
		apk_zip.write(os.path.join(sdk_native_libs, 'armeabi', 'libtiverify.so'), 'lib/armeabi/libtiverify.so')
		apk_zip.write(os.path.join(sdk_native_libs, 'armeabi-v7a', 'libtiverify.so'), 'lib/armeabi-v7a/libtiverify.so')
		# See below about x86 and production
		x86_dir = os.path.join(sdk_native_libs, 'x86')
		if self.deploy_type != 'production' and os.path.exists(x86_dir):
			apk_zip.write(os.path.join(x86_dir, 'libtiverify.so'), 'lib/x86/libtiverify.so')

		if self.runtime == 'v8':
			apk_zip.write(os.path.join(sdk_native_libs, 'armeabi', 'libkroll-v8.so'), 'lib/armeabi/libkroll-v8.so')
			apk_zip.write(os.path.join(sdk_native_libs, 'armeabi', 'libstlport_shared.so'), 'lib/armeabi/libstlport_shared.so')
			apk_zip.write(os.path.join(sdk_native_libs, 'armeabi-v7a', 'libkroll-v8.so'), 'lib/armeabi-v7a/libkroll-v8.so')
			apk_zip.write(os.path.join(sdk_native_libs, 'armeabi-v7a', 'libstlport_shared.so'), 'lib/armeabi-v7a/libstlport_shared.so')
			# Only include x86 in non-production builds for now, since there are
			# no x86 devices on the market
			if self.deploy_type != 'production' and os.path.exists(x86_dir):
				apk_zip.write(os.path.join(x86_dir, 'libkroll-v8.so'), 'lib/x86/libkroll-v8.so')
				apk_zip.write(os.path.join(x86_dir, 'libstlport_shared.so'), 'lib/x86/libstlport_shared.so')

				
		self.apk_updated = True

		apk_zip.close()
		return unsigned_apk

	def run_adb(self, *args):
		command = [self.sdk.get_adb()]
		command.extend(self.device_args)
		command.extend(args)
		return run.run(command)

	def get_sigalg(self):
		output = run.run([self.keytool,
			'-v', 
			'-list',
			'-keystore', self.keystore,
			'-storepass', self.keystore_pass,
			'-alias', self.keystore_alias
		])

		# If the keytool encounters an error, that means some of the provided
		# keychain info is invalid and we should bail anyway
		run.check_output_for_error(output, r'RuntimeException: (.*)', True)
		run.check_output_for_error(output, r'^keytool: (.*)', True)

		match = re.search(r'Signature algorithm name: (.*)', output)
		if match is not None:
			return match.group(1)

		# Return the default:
		return "MD5withRSA"

	def package_and_deploy(self):
		ap_ = os.path.join(self.project_dir, 'bin', 'app.ap_')

		# This is only to check if this has been overridden in production
		has_compile_js = self.tiappxml.has_app_property("ti.android.compilejs")
		compile_js = not has_compile_js or (has_compile_js and \
			self.tiappxml.to_bool(self.tiappxml.get_app_property('ti.android.compilejs')))

		pkg_assets_dir = self.assets_dir
		if self.deploy_type == "production" and compile_js:
			non_js_assets = os.path.join(self.project_dir, 'bin', 'non-js-assets')
			if not os.path.exists(non_js_assets):
				os.mkdir(non_js_assets)
			copy_all(self.assets_dir, non_js_assets, ignore_exts=['.js'])
			pkg_assets_dir = non_js_assets

		run.run([self.aapt, 'package', '-f', '-M', 'AndroidManifest.xml', '-A', pkg_assets_dir,
			'-S', 'res', '-I', self.android_jar, '-I', self.titanium_jar, '-F', ap_], warning_regex=r'skipping')

		unsigned_apk = self.create_unsigned_apk(ap_)

		if self.dist_dir:
			app_apk = os.path.join(self.dist_dir, self.name + '.apk')	
		else:
			app_apk = os.path.join(self.project_dir, 'bin', 'app.apk')	

		output = run.run([self.jarsigner,
			'-sigalg', self.get_sigalg(),
			'-digestalg', 'SHA1',
			'-storepass', self.keystore_pass,
			'-keystore', self.keystore,
			'-signedjar', app_apk,
			unsigned_apk,
			self.keystore_alias])
		run.check_output_for_error(output, r'RuntimeException: (.*)', True)
		run.check_output_for_error(output, r'^jarsigner: (.*)', True)

		# TODO Document Exit message
		#success = re.findall(r'RuntimeException: (.*)', output)
		#if len(success) > 0:
		#	error(success[0])
		#	sys.exit(1)
		
		# zipalign to align byte boundaries
		zipalign = self.sdk.get_zipalign()
		if os.path.exists(app_apk+'z'):
			os.remove(app_apk+'z')
		ALIGN_32_BIT = 4
		output = run.run([zipalign, '-v', str(ALIGN_32_BIT), app_apk, app_apk+'z'])
		# TODO - Document Exit message
		if output == None:
			error("System Error while compiling Android classes.dex")
			sys.exit(1)
		else:
			os.unlink(app_apk)
			os.rename(app_apk+'z',app_apk)

		if self.dist_dir:
			self.post_build()
			sys.exit()

		if self.build_only:
			return (False, False)

		out = self.run_adb('get-state')
		#out = subprocess.Popen([self.sdk.get_adb(), self.device_type_arg, 'get-state'], stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]
		out = str(out).strip()
		
		# try a few times as sometimes it fails waiting on boot
		attempts = 0
		launched = False
		launch_failed = False
		while attempts < 5:
			try:
				if self.install:
					self.wait_for_device('d')
					info("Installing application on device")
				else:
					self.wait_for_device('e')
					info("Installing application on emulator")

				output = self.run_adb('install', '-r', app_apk)
				#output = run.run(cmd)
				if output == None:
					launch_failed = True
				elif "Failure" in output:
					error("Failed installing %s: %s" % (self.app_id, output))
					launch_failed = True
				elif not self.install:
					launched = True
				break
			except Exception, e:
				error(e)
				time.sleep(3)
				attempts+=1
			
		return (launched, launch_failed)

	def run_app(self):
		info("Launching application ... %s" % self.name)
		output = self.run_adb('shell', 'am', 'start',
			'-a', 'android.intent.action.MAIN',
			'-c','android.intent.category.LAUNCHER',
			'-n', '%s/.%sActivity' % (self.app_id , self.classname))
		trace("Launch output: %s" % output)

	def wait_for_sdcard(self):
		info("Waiting for SDCard to become available..")
		waited = 0
		max_wait = 60
		while waited < max_wait:
			output = self.run_adb('shell', 'mount')
			if output != None:
				mount_points = output.splitlines()
				for mount_point in mount_points:
					tokens = mount_point.split()
					if len(tokens) < 2: continue
					mount_path = tokens[1]
					if mount_path in ['/sdcard', '/mnt/sdcard']:
						return True
			else:
				error("Error checking for SDCard using 'mount'")
				return False
			time.sleep(1)
			waited += 1

		error("Timed out waiting for SDCard to become available (%ds)" % max_wait)
		return False


	def push_deploy_json(self):
		deploy_data = {
			"debuggerEnabled": self.debugger_host != None,
			"debuggerPort": self.debugger_port,
			"fastdevPort": self.fastdev_port
		}
		deploy_json = os.path.join(self.project_dir, 'bin', 'deploy.json')
		open(deploy_json, 'w+').write(simplejson.dumps(deploy_data))
		sdcard_available = self.wait_for_sdcard()
		if sdcard_available:
			self.run_adb('shell', 'mkdir /sdcard/%s || echo' % self.app_id)
			self.run_adb('push', deploy_json, '/sdcard/%s/deploy.json' % self.app_id)
		os.unlink(deploy_json)

	def verify_fastdev(self):
		lock_file = os.path.join(self.top_dir, '.fastdev.lock')
		if not fastdev.is_running(self.top_dir):
			if os.path.exists(lock_file):
				os.unlink(lock_file)
			return False
		else:
			data = simplejson.loads(open(lock_file, 'r').read())
			self.fastdev_port = data["port"]
			return True

	def fastdev_kill_app(self):
		lock_file = os.path.join(self.top_dir, ".fastdev.lock")
		if os.path.exists(lock_file):
			class Options(object): pass
			options = Options()
			options.lock_file = lock_file

			try:
				return fastdev.kill_app(self.top_dir, options)
			except Exception, e:
				return False

	def merge_internal_module_resources(self):
		if not self.android_jars:
			return
		for jar in self.android_jars:
			if not os.path.exists(jar):
				continue
			res_zip = jar[:-4] + '.res.zip'
			if not os.path.exists(res_zip):
				continue
			res_zip_file = zipfile.ZipFile(res_zip, "r")
			try:
				zip_extractall(res_zip_file, self.project_dir)
			except:
				raise
			finally:
				res_zip_file.close()

	def build_and_run(self, install, avd_id, keystore=None, keystore_pass='tirocks', keystore_alias='tidev', dist_dir=None, build_only=False, device_args=None, debugger_host=None):
		deploy_type = 'development'
		self.build_only = build_only
		self.device_args = device_args
		self.postbuild_modules = []
		self.non_orphans = []
		if install:
			if self.device_args == None:
				self.device_args = ['-d']
			if keystore == None:
				deploy_type = 'test'
			else:
				deploy_type = 'production'
		if self.device_args == None:
			self.device_args = ['-e']

		self.deploy_type = deploy_type
		(java_failed, java_status) = prereq.check_java()
		if java_failed:
			error(java_status)
			sys.exit(1)

		# attempt to load any compiler plugins
		if len(self.tiappxml.properties['plugins']) > 0:
			titanium_dir = os.path.abspath(os.path.join(template_dir,'..','..','..','..'))
			local_compiler_dir = os.path.abspath(os.path.join(self.top_dir,'plugins'))
			tp_compiler_dir = os.path.abspath(os.path.join(titanium_dir,'plugins'))
			if not os.path.exists(tp_compiler_dir) and not os.path.exists(local_compiler_dir):
				error("Build Failed (Missing plugins directory)")
				sys.exit(1)
			compiler_config = {
				'platform':'android',
				'tiapp':self.tiappxml,
				'project_dir':self.top_dir,
				'titanium_dir':titanium_dir,
				'appid':self.app_id,
				'template_dir':template_dir,
				'project_name':self.name,
				'command':self.command,
				'build_dir':s.project_dir,
				'app_name':self.name,
				'android_builder':self,
				'deploy_type':deploy_type,
				'dist_dir':dist_dir,
				'logger':log
			}
			for plugin in self.tiappxml.properties['plugins']:
				local_plugin_file = os.path.join(local_compiler_dir,plugin['name'],'plugin.py')
				plugin_file = os.path.join(tp_compiler_dir,plugin['name'],plugin['version'],'plugin.py')
				info("plugin=%s" % plugin_file)
				if not os.path.exists(local_plugin_file) and not os.path.exists(plugin_file):
					error("Build Failed (Missing plugin for %s)" % plugin['name'])
					sys.exit(1)
				info("Detected compiler plugin: %s/%s" % (plugin['name'],plugin['version']))
				code_path = plugin_file
				if os.path.exists(local_plugin_file):	
					code_path = local_plugin_file
				compiler_config['plugin']=plugin
				fin = open(code_path, 'rb')
				m = hashlib.md5()
				m.update(open(code_path,'rb').read()) 
				code_hash = m.hexdigest()
				p = imp.load_source(code_hash, code_path, fin)
				module_functions = dict(inspect.getmembers(p, inspect.isfunction))
				if module_functions.has_key('postbuild'):
					debug("plugin contains a postbuild function. Will execute after project is built and packaged")
					self.postbuild_modules.append((plugin['name'], p))
				p.compile(compiler_config)
				fin.close()
			

		# in Windows, if the adb server isn't running, calling "adb devices"
		# will fork off a new adb server, and cause a lock-up when we 
		# try to pipe the process' stdout/stderr. the workaround is 
		# to simply call adb start-server here, and not care about
		# the return code / pipes. (this is harmless if adb is already running)
		# -- thanks to Bill Dawson for the workaround
		if platform.system() == "Windows" and not build_only:
			run.run([self.sdk.get_adb(), "start-server"], True, ignore_output=True)
		
		ti_version_file = os.path.join(self.support_dir, '..', 'version.txt')
		if os.path.exists(ti_version_file):
			ti_version_info = read_properties(open(ti_version_file, 'r'), '=')
			if not ti_version_info is None and 'version' in ti_version_info:
				ti_version_string = 'Titanium SDK version: %s' % ti_version_info['version']
				if 'timestamp' in ti_version_info or 'githash' in ti_version_info:
					ti_version_string += ' ('
					if 'timestamp' in ti_version_info:
						ti_version_string += '%s' % ti_version_info['timestamp']
					if 'githash' in ti_version_info:
						ti_version_string += ' %s' % ti_version_info['githash']
					ti_version_string += ')'

				info(ti_version_string)
		
		if not build_only:
			if deploy_type == 'development':
				self.wait_for_device('e')
			elif deploy_type == 'test':
				self.wait_for_device('d')

		self.install = install
		self.dist_dir = dist_dir
		self.aapt = self.sdk.get_aapt()
		self.android_jar = self.sdk.get_android_jar()
		self.titanium_jar = os.path.join(self.support_dir,'titanium.jar')
		self.kroll_apt_jar = os.path.join(self.support_dir, 'kroll-apt.jar')

		dx = self.sdk.get_dx()
		self.apkbuilder = self.sdk.get_apkbuilder()
		self.sdcard_resources = '/sdcard/Ti.debug/%s/Resources' % self.app_id
		
		self.resources_installed = False
		if deploy_type == "production":
			self.app_installed = False
		else:
			self.app_installed = not build_only and self.is_app_installed()
			debug("%s installed? %s" % (self.app_id, self.app_installed))

			#self.resources_installed = not build_only and self.are_resources_installed()
			#debug("%s resources installed? %s" % (self.app_id, self.resources_installed))
			
		if keystore == None:
			keystore = os.path.join(self.support_dir,'dev_keystore')
		
		self.keystore = keystore
		self.keystore_pass = keystore_pass
		self.keystore_alias = keystore_alias
		curdir = os.getcwd()
		self.support_resources_dir = os.path.join(self.support_dir, 'resources')
		
		try:
			os.chdir(self.project_dir)
			self.android = Android(self.name, self.app_id, self.sdk, deploy_type, self.java)

			if not os.path.exists('bin'):
				os.makedirs('bin')

			resources_dir = os.path.join(self.top_dir,'Resources')
			self.assets_dir = os.path.join(self.project_dir,'bin','assets')
			self.assets_resources_dir = os.path.join(self.assets_dir,'Resources')
			
			if not os.path.exists(self.assets_resources_dir):
				os.makedirs(self.assets_resources_dir)
			
			shutil.copy(self.project_tiappxml, self.assets_dir)
			finalxml = os.path.join(self.assets_dir,'tiapp.xml')
			self.tiapp = TiAppXML(finalxml)
			self.tiapp.setDeployType(deploy_type)
			self.sdcard_copy = False
			sdcard_property = "ti.android.loadfromsdcard"
			if self.tiapp.has_app_property(sdcard_property):
				self.sdcard_copy = self.tiapp.to_bool(self.tiapp.get_app_property(sdcard_property))

			fastdev_property = "ti.android.fastdev"
			fastdev_enabled = (self.deploy_type == 'development' and not self.build_only)
			if self.tiapp.has_app_property(fastdev_property):
				fastdev_enabled = self.tiapp.to_bool(self.tiapp.get_app_property(fastdev_property))

			if fastdev_enabled:
				if self.verify_fastdev():
					info("Fastdev server running, deploying in Fastdev mode")
					self.fastdev = True
				else:
					warn("Fastdev enabled, but server isn't running, deploying normally")

			self.classes_dir = os.path.join(self.project_dir, 'bin', 'classes')	
			if not os.path.exists(self.classes_dir):
				os.makedirs(self.classes_dir)

			if (not debugger_host is None) and len(debugger_host) > 0:
				hostport = debugger_host.split(":")
				self.debugger_host = hostport[0]
				self.debugger_port = int(hostport[1])
			debugger_enabled = self.debugger_host != None and len(self.debugger_host) > 0

			# Detect which modules are being used.
			# We need to know this info in a few places, so the info is saved
			# in self.missing_modules and self.modules
			detector = ModuleDetector(self.top_dir)
			self.missing_modules, self.modules = detector.find_app_modules(self.tiapp, 'android')

			self.copy_commonjs_modules()
			self.copy_project_resources()

			last_build_info = None
			built_all_modules = False
			build_info_path = os.path.join(self.project_dir, 'bin', 'build_info.json')
			if os.path.exists(build_info_path):
				last_build_info = simplejson.loads(open(build_info_path, 'r').read())
				built_all_modules = last_build_info["include_all_modules"]

			if self.tiapp.has_app_property("ti.android.compilejs"):
				if self.tiapp.to_bool(self.tiapp.get_app_property('ti.android.compilejs')):
					self.compile_js = True
			elif self.tiapp.has_app_property('ti.deploytype'):
				if self.tiapp.get_app_property('ti.deploytype') == 'production':
					self.compile_js = True

			include_all_ti_modules = self.fastdev 
			if (self.tiapp.has_app_property('ti.android.include_all_modules')):
				if self.tiapp.to_bool(self.tiapp.get_app_property('ti.android.include_all_modules')):
					include_all_ti_modules = True
			if self.tiapp_changed or (self.js_changed and not self.fastdev) or \
					self.force_rebuild or self.deploy_type == "production" or \
					(self.fastdev and not built_all_modules) or \
					(not self.fastdev and built_all_modules):
				self.android.config['compile_js'] = self.compile_js
				trace("Generating Java Classes")
				self.android.create(os.path.abspath(os.path.join(self.top_dir,'..')),
					True, project_dir = self.top_dir, include_all_ti_modules=include_all_ti_modules)
				open(build_info_path, 'w').write(simplejson.dumps({
					"include_all_modules": include_all_ti_modules
				}))
			else:
				info("Tiapp.xml unchanged, skipping class generation")

			# compile resources
			full_resource_dir = os.path.join(self.project_dir, self.assets_resources_dir)
			compiler = Compiler(self.tiapp,
								full_resource_dir,
								self.java,
								self.classes_dir,
								self.project_gen_dir,
								self.project_dir, 
								include_all_modules=include_all_ti_modules)
			compiler.compile(compile_bytecode=self.compile_js, external_modules=self.modules)
			self.compiled_files = compiler.compiled_files
			self.android_jars = compiler.jar_libraries
			self.merge_internal_module_resources()

			if not os.path.exists(self.assets_dir):
				os.makedirs(self.assets_dir)

			self.resource_drawables_changed = self.copy_resource_drawables()

			self.warn_dupe_drawable_folders()

			self.copy_module_platform_folders()

			special_resources_dir = os.path.join(self.top_dir,'platform','android')
			if os.path.exists(special_resources_dir):
				debug("found special platform files dir = %s" % special_resources_dir)
				ignore_files = ignoreFiles
				ignore_files.extend(['AndroidManifest.xml']) # don't want to overwrite build/android/AndroidManifest.xml yet
				self.copy_project_platform_folder(ignoreDirs, ignore_files)

			self.generate_stylesheet()
			self.generate_aidl()
			
			self.manifest_changed = self.generate_android_manifest(compiler)
			my_avd = None	
			self.google_apis_supported = False
				
			# find the AVD we've selected and determine if we support Google APIs
			if avd_id is not None:
				for avd_props in avd.get_avds(self.sdk):
					if avd_props['id'] == avd_id:
						my_avd = avd_props
						self.google_apis_supported = (my_avd['name'].find('Google')!=-1 or my_avd['name'].find('APIs')!=-1)
						break
			
			if build_only or avd_id is None:
				self.google_apis_supported = True

			remove_orphaned_files(resources_dir, self.assets_resources_dir, self.non_orphans)

			generated_classes_built = self.build_generated_classes()

			# TODO: enable for "test" / device mode for debugger / fastdev
			if not self.build_only and self.deploy_type == "development":
				self.push_deploy_json()
			self.classes_dex = os.path.join(self.project_dir, 'bin', 'classes.dex')
			
			def jar_includer(path, isfile):
				if isfile and path.endswith(".jar"): return True
				return False
			support_deltafy = Deltafy(self.support_dir, jar_includer)
			self.support_deltas = support_deltafy.scan()
			
			dex_built = False
			if len(self.support_deltas) > 0 or generated_classes_built or self.deploy_type == "production":
				# the dx.bat that ships with android in windows doesn't allow command line
				# overriding of the java heap space, so we call the jar directly
				if platform.system() == 'Windows':
					dex_args = [self.java, '-Xmx1024M', '-Djava.ext.dirs=%s' % self.sdk.get_platform_tools_dir(), '-jar', self.sdk.get_dx_jar()]
				else:
					dex_args = [dx, '-JXmx1536M', '-JXX:-UseGCOverheadLimit']
				dex_args += ['--dex', '--output='+self.classes_dex, self.classes_dir]
				dex_args += self.android_jars
				dex_args += self.module_jars

				dex_args.append(os.path.join(self.support_dir, 'lib', 'titanium-verify.jar'))
				if self.deploy_type != 'production':
					dex_args.append(os.path.join(self.support_dir, 'lib', 'titanium-debug.jar'))
					# the verifier depends on Ti.Network classes, so we may need to inject it
					has_network_jar = False
					for jar in self.android_jars:
						if jar.endswith('titanium-network.jar'):
							has_network_jar = True
							break
					if not has_network_jar:
						dex_args.append(os.path.join(self.support_dir, 'modules', 'titanium-network.jar'))

				info("Compiling Android Resources... This could take some time")
				# TODO - Document Exit message
				run_result = run.run(dex_args, warning_regex=r'warning: ')
				if (run_result == None):
					dex_built = False
					error("System Error while compiling Android classes.dex")
					sys.exit(1)
				else:
					dex_built = True
					debug("Android classes.dex built")

			if dex_built or generated_classes_built or self.tiapp_changed or self.manifest_changed or not self.app_installed or not self.fastdev:
				# metadata has changed, we need to do a full re-deploy
				launched, launch_failed = self.package_and_deploy()
				if launched:
					self.run_app()
					info("Deployed %s ... Application should be running." % self.name)
				elif launch_failed==False and not build_only:
					info("Application installed. Launch from drawer on Home Screen")
			elif not build_only:
				# Relaunch app if nothing was built
				info("Re-launching application ... %s" % self.name)

				relaunched = False
				killed = False
				if self.fastdev:
					killed = self.fastdev_kill_app()
				
				if not killed:
					processes = self.run_adb('shell', 'ps')
					for line in processes.splitlines():
						columns = line.split()
						if len(columns) > 1:
							pid = columns[1]
							id = columns[len(columns)-1]
							
							if id == self.app_id:
								self.run_adb('shell', 'kill', pid)
								relaunched = True

				self.run_app()
				if relaunched:
					info("Relaunched %s ... Application should be running." % self.name)

			self.post_build()

			# Enable port forwarding for debugger if application
			# acts as the server. Currently only V8 runtime uses this mode.
			if debugger_enabled and self.runtime == 'v8':
				info('Forwarding host port %s to device for debugging.' % self.debugger_port)
				forwardPort = 'tcp:%s' % self.debugger_port
				self.sdk.run_adb(['forward', forwardPort, forwardPort])

			#intermediary code for on-device debugging (later)
			#if debugger_host != None:
				#import debugger
				#debug("connecting to debugger: %s, debugger=%s" % (debugger_host, str(debugger)))
				#debugger.run(debugger_host, '127.0.0.1:5999')
		finally:
			os.chdir(curdir)
			sys.stdout.flush()
			
	def post_build(self):
		try:
			if self.postbuild_modules:
				for p in self.postbuild_modules:
					info("Running postbuild function in %s plugin" % p[0])
					p[1].postbuild()
		except Exception,e:
			error("Error performing post-build steps: %s" % e)


if __name__ == "__main__":
	def usage():
		print "%s <command> <project_name> <sdk_dir> <project_dir> <app_id> [key] [password] [alias] [dir] [avdid] [avdsdk] [avdabi] [emulator options]" % os.path.basename(sys.argv[0])
		print
		print "available commands: "
		print
		print "  emulator      build and run the emulator"
		print "  simulator     build and run the app on the simulator"
		print "  install       build and install the app on the device"
		print "  distribute    build final distribution package for upload to marketplace"
		print "  run           build and run the project using values from tiapp.xml"
		print "  run-emulator  run the emulator with a default AVD ID and skin"
		
		sys.exit(1)

	argc = len(sys.argv)
	if argc < 2:
		usage()

	command = sys.argv[1]
	template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
	get_values_from_tiapp = False

	if command == 'run':
		if argc < 4:
			print 'Usage: %s run <project_dir> <android_sdk>' % sys.argv[0]
			sys.exit(1)
		
		get_values_from_tiapp = True
		project_dir = sys.argv[2]
		sdk_dir = sys.argv[3]
		
		avd_id = "7"
	elif command == 'run-emulator':
		if argc < 4:
			print 'Usage: %s run-emulator <project_dir> <android_sdk>' % sys.argv[0]
			sys.exit(1)

		get_values_from_tiapp = True
		project_dir = sys.argv[2]
		sdk_dir = sys.argv[3]
		# sensible defaults?
		avd_id = "7"
		avd_skin = "HVGA"
	else:
		if argc < 6 or command == '--help' or (command=='distribute' and argc < 10):
			usage()
			
	if get_values_from_tiapp:
		tiappxml = TiAppXML(os.path.join(project_dir, 'tiapp.xml'))
		app_id = tiappxml.properties['id']
		project_name = tiappxml.properties['name']
	else:
		project_name = dequote(sys.argv[2])
		sdk_dir = os.path.abspath(os.path.expanduser(dequote(sys.argv[3])))
		project_dir = os.path.abspath(os.path.expanduser(dequote(sys.argv[4])))
		app_id = dequote(sys.argv[5])

	log = TiLogger(os.path.join(os.path.abspath(os.path.expanduser(dequote(project_dir))), 'build.log'))
	log.debug(" ".join(sys.argv))
	
	s = Builder(project_name,sdk_dir,project_dir,template_dir,app_id)
	s.command = command

	try:
		if command == 'run-emulator':
			s.run_emulator(avd_id, avd_skin, None, None, [])
		elif command == 'run':
			s.build_and_run(False, avd_id)
		elif command == 'emulator':
			avd_id = dequote(sys.argv[6])
			if avd_id.isdigit():
				avd_name = None
				avd_skin = dequote(sys.argv[7])
				
				# TODO: This is for studio compatibility only. We will
				# need to rip it out once they support ABI selection.
				# Note that this will ALSO possibly break existing external
				# build scripts in a bad way.
				
				if len(sys.argv) > 9:
					avd_abi = dequote(sys.argv[8])
					add_args = sys.argv[9:]
				else:
					avd_abi = None
					add_args = sys.argv[8:]
			else:
				avd_name = sys.argv[6]
				avd_id = None
				avd_skin = None
				
				# TODO: This is for studio compatibility only. We will
				# need to rip it out once they support ABI selection.
				# Note that this will ALSO possibly break existing external
				# build scripts in a bad way.
				
				if len(sys.argv) > 8:
					avd_abi = dequote(sys.argv[7])
					add_args = sys.argv[8:]
				else:
					avd_abi = None
					add_args = sys.argv[7:]

			s.run_emulator(avd_id, avd_skin, avd_name, avd_abi, add_args)
		elif command == 'simulator':
			info("Building %s for Android ... one moment" % project_name)
			avd_id = dequote(sys.argv[6])
			debugger_host = None
			if len(sys.argv) > 8:
				debugger_host = dequote(sys.argv[8])
			s.build_and_run(False, avd_id, debugger_host=debugger_host)
		elif command == 'install':
			avd_id = dequote(sys.argv[6])
			device_args = ['-d']
			if len(sys.argv) >= 8:
				device_args = ['-s', sys.argv[7]]
			s.build_and_run(True, avd_id, device_args=device_args)
		elif command == 'distribute':
			key = os.path.abspath(os.path.expanduser(dequote(sys.argv[6])))
			password = dequote(sys.argv[7])
			alias = dequote(sys.argv[8])
			output_dir = dequote(sys.argv[9])
			s.build_and_run(True, None, key, password, alias, output_dir)
		elif command == 'build':
			s.build_and_run(False, 1, build_only=True)
		else:
			error("Unknown command: %s" % command)
			usage()
	except SystemExit, n:
		sys.exit(n)
	except:
		e = traceback.format_exc()
		error("Exception occured while building Android project:")
		for line in e.splitlines():
			error(line)
		sys.exit(1)

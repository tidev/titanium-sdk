#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Android Simulator for building a project and launching
# the Android Emulator or on the device
#
import os, sys, subprocess, shutil, time, signal, string, platform, re, glob, hashlib, imp
import run, avd, prereq, zipfile, tempfile, fnmatch, codecs, traceback
from os.path import splitext
from compiler import Compiler
from os.path import join, splitext, split, exists
from shutil import copyfile
from xml.dom.minidom import parseString

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
top_support_dir = os.path.dirname(template_dir) 
sys.path.append(top_support_dir)
sys.path.append(os.path.join(top_support_dir, 'common'))
sys.path.append(os.path.join(top_support_dir, 'module'))

from tiapp import *
from android import Android
from androidsdk import AndroidSDK
from deltafy import Deltafy, Delta
from css import csscompiler
from module import ModuleDetector
import localecompiler

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn', 'CVS'];
android_avd_hw = {'hw.camera': 'yes', 'hw.gps':'yes'}
res_skips = ['style']

MIN_API_LEVEL = 4

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
	print "[INFO] "+msg
	sys.stdout.flush()

def debug(msg):
	print "[DEBUG] "+msg
	sys.stdout.flush()

def warn(msg):
	print "[WARN] "+msg
	sys.stdout.flush()

def trace(msg):
	print "[TRACE] "+msg
	sys.stdout.flush()

def error(msg):
	print "[ERROR] "+msg
	sys.stdout.flush()

def remove_orphaned_files(source_folder, target_folder):
	is_res = source_folder.endswith('Resources') or source_folder.endswith('Resources' + os.sep)
	for root, dirs, files in os.walk(target_folder):
		for f in files:
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
	if re.search("android/images/(high|medium|low|res-[^/]+)/", path.replace("\\", "/")):
		return True
	else:
		return False

def resource_drawable_folder(path):
	if not is_resource_drawable(path):
		return None
	else:
		pattern = r'/android/images/(high|medium|low|res-[^/]+)/'
		match = re.search(pattern, path.replace("\\", "/"))
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
		
		temp_tiapp = TiAppXML(self.project_tiappxml)
		if temp_tiapp and temp_tiapp.android and 'tool-api-level' in temp_tiapp.android:
			self.tool_api_level = int(temp_tiapp.android['tool-api-level'])
		else:
			self.tool_api_level = MIN_API_LEVEL
		self.sdk = AndroidSDK(sdk, self.tool_api_level)
		self.tiappxml = temp_tiapp

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
		
		# we place some files in the users home
		if platform.system() == "Windows":
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
		self.javac = "javac"
		self.java = "java"
		if platform.system() == "Windows":
			if os.environ.has_key("JAVA_HOME"):
				home_jarsigner = os.path.join(os.environ["JAVA_HOME"], "bin", "jarsigner.exe")
				home_javac = os.path.join(os.environ["JAVA_HOME"], "bin", "javac.exe")
				home_java = os.path.join(os.environ["JAVA_HOME"], "bin", "java.exe")
				found = True
				# TODO Document this path and test properly under windows
				if os.path.exists(home_jarsigner):
					self.jarsigner = home_jarsigner
				else:
					# Expected but not found
					found = False
					error("Required jarsigner not found")
					
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
						self.javac = os.path.join(path, 'javac.exe')
						self.java = os.path.join(path, 'java.exe')
						found = True
						break
				if not found:
					error("Error locating JDK: set $JAVA_HOME or put javac and jarsigner on your $PATH")
					sys.exit(1)

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
	
	def wait_for_device(self,type):
		print "[DEBUG] Waiting for device to be ready ..."
		sys.stdout.flush()
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
	
	def create_avd(self,avd_id,avd_skin):
		name = "titanium_%s_%s" % (avd_id,avd_skin)
		if not os.path.exists(self.home_dir):
			os.makedirs(self.home_dir)
		if not os.path.exists(self.sdcard):
			info("Creating shared 64M SD card for use in Android emulator(s)")
			run.run([self.sdk.get_mksdcard(), '64M', self.sdcard])

		avd_path = os.path.join(self.android_home_dir, 'avd')
		my_avd = os.path.join(avd_path,"%s.avd" % name)
		if not os.path.exists(my_avd):
			info("Creating new Android Virtual Device (%s %s)" % (avd_id,avd_skin))
			inputgen = os.path.join(template_dir,'input.py')
			pipe([sys.executable, inputgen], [self.sdk.get_android(), '--verbose', 'create', 'avd', '--name', name, '--target', avd_id, '-s', avd_skin, '--force', '--sdcard', self.sdcard])
			inifile = os.path.join(my_avd,'config.ini')
			inifilec = open(inifile,'r').read()
			inifiledata = open(inifile,'w')
			inifiledata.write(inifilec)
			# TODO - Document options
			for hw_option in android_avd_hw.keys():
				inifiledata.write("%s=%s" % (hw_option, android_avd_hw[hw_option]))
			inifiledata.close()
			
		return name
	
	def run_emulator(self,avd_id,avd_skin):
		info("Launching Android emulator...one moment")
		debug("From: " + self.sdk.get_emulator())
		debug("SDCard: " + self.sdcard)
		debug("AVD ID: " + avd_id)
		debug("AVD Skin: " + avd_skin)
		debug("SDK: " + sdk_dir)
		
		# make sure adb is running on windows, else XP can lockup the python
		# process when adb runs first time
		if platform.system() == "Windows":
			run.run([self.sdk.get_adb(), "start-server"], True, ignore_output=True)

		devices = self.sdk.list_devices()
		for device in devices:
			if device.is_emulator() and device.get_port() == 5560:
				info("Emulator is running.")
				sys.exit(0)
		
		# this will create an AVD on demand or re-use existing one if already created
		avd_name = self.create_avd(avd_id,avd_skin)

		# start the emulator
		emulator_cmd = [
			self.sdk.get_emulator(),
			'-avd',
			avd_name,
			'-port',
			'5560',
			'-sdcard',
			self.sdcard,
			'-logcat',
			"'*:d *'",
			'-no-boot-anim',
			'-partition-size',
			'128' # in between nexusone and droid
		]
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
		output = run.run([self.sdk.get_adb(), self.device_type_arg, 'shell', 'ls', path])
		if output != None:
			if output.find("No such file or directory") == -1:
				return True
		return False
		
	def is_app_installed(self):
		return self.check_file_exists('/data/app/%s.apk' % self.app_id)
		
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


	def copy_resource_drawables(self):
		debug('Processing Android resource drawables')

		def make_resource_drawable_filename(orig):
			normalized = orig.replace("\\", "/")
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

		if self.force_rebuild or self.deploy_type == 'production':
			for root, dirs, files in os.walk(os.path.join(self.top_dir, "Resources")):
				for f in files:
					path = os.path.join(root, f)
					if is_resource_drawable(path):
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
		for f in fileset:
			copy_resource_drawable(f)

	def copy_project_resources(self):
		info("Copying project resources..")
		sys.stdout.flush()
		
		resources_dir = os.path.join(self.top_dir, 'Resources')
		android_resources_dir = os.path.join(resources_dir, 'android')
		self.project_deltafy = Deltafy(resources_dir, include_callback=self.include_path)
		self.project_deltas = self.project_deltafy.scan()
		tiapp_delta = self.project_deltafy.scan_single_file(self.project_tiappxml)
		self.tiapp_changed = tiapp_delta is not None
		if self.tiapp_changed or self.force_rebuild:
			info("Detected tiapp.xml change, forcing full re-build...")
			# force a clean scan/copy when the tiapp.xml has changed
			self.project_deltafy.clear_state()
			self.project_deltas = self.project_deltafy.scan()
			# rescan tiapp.xml so it doesn't show up as created next time around 
			self.project_deltafy.scan_single_file(self.project_tiappxml)
			
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
			if re.search("android/images/(high|medium|low|res-[^/]+)/", path.replace("\\", "/")):
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
				# check to see if this is a compiled file and if so, don't copy
				if dest in self.compiled_files: continue
				if path.startswith(os.path.join(resources_dir, "iphone")) or path.startswith(os.path.join(resources_dir, "blackberry")):
					continue
				parent = os.path.dirname(dest)
				if not os.path.exists(parent):
					os.makedirs(parent)
				trace("COPYING %s FILE: %s => %s" % (delta.get_status_str(), path, dest))
				shutil.copy(path, dest)
				# copy to the sdcard in development mode
				if self.sdcard_copy and self.app_installed and (self.deploy_type == 'development' or self.deploy_type == 'test'):
					if path.startswith(android_resources_dir):
						relative_path = make_relative(delta.get_path(), android_resources_dir)
					else:
						relative_path = make_relative(delta.get_path(), resources_dir)
					relative_path = relative_path.replace("\\", "/")
					cmd = [self.sdk.get_adb(), self.device_type_arg, "push", delta.get_path(), "%s/%s" % (self.sdcard_resources, relative_path)]
					run.run(cmd)
		
	def generate_android_manifest(self,compiler):

		self.generate_localizations()
		
		# NOTE: these are built-in permissions we need -- we probably need to refine when these are needed too
		permissions_required = ['INTERNET','ACCESS_WIFI_STATE','ACCESS_NETWORK_STATE', 'WRITE_EXTERNAL_STORAGE']
		
		GEO_PERMISSION = [ 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'ACCESS_MOCK_LOCATION']
		CONTACTS_PERMISSION = ['READ_CONTACTS']
		VIBRATE_PERMISSION = ['VIBRATE']
		CAMERA_PERMISSION = ['CAMERA']
		
		# this is our module method to permission(s) trigger - for each method on the left, require the permission(s) on the right
		permission_mapping = {
			# GEO
			'Geolocation.watchPosition' : GEO_PERMISSION,
			'Geolocation.getCurrentPosition' : GEO_PERMISSION,
			'Geolocation.watchHeading' : GEO_PERMISSION,
			'Geolocation.getCurrentHeading' : GEO_PERMISSION,
			
			# MEDIA
			'Media.vibrate' : VIBRATE_PERMISSION,
			'Media.createVideoPlayer' : CAMERA_PERMISSION,
			'Media.showCamera' : CAMERA_PERMISSION,
			
			# CONTACTS
			'Contacts.createContact' : CONTACTS_PERMISSION,
			'Contacts.saveContact' : CONTACTS_PERMISSION,
			'Contacts.removeContact' : CONTACTS_PERMISSION,
			'Contacts.addContact' : CONTACTS_PERMISSION,
			'Contacts.getAllContacts' : CONTACTS_PERMISSION,
			'Contacts.showContactPicker' : CONTACTS_PERMISSION,
			'Contacts.showContacts' : CONTACTS_PERMISSION,
			'Contacts.getPersonByID' : CONTACTS_PERMISSION,
			'Contacts.getPeopleWithName' : CONTACTS_PERMISSION,
			'Contacts.getAllPeople' : CONTACTS_PERMISSION,
			'Contacts.getAllGroups' : CONTACTS_PERMISSION,
			'Contacts.getGroupByID' : CONTACTS_PERMISSION,
		}
		
		VIDEO_ACTIVITY = """<activity
		android:name="ti.modules.titanium.media.TiVideoActivity"
		android:configChanges="keyboardHidden|orientation"
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
		
		activity_mapping = {
		
			# MEDIA
			'Media.createVideoPlayer' : VIDEO_ACTIVITY,
			
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
		
		# figure out which permissions we need based on the used module methods
		for mn in compiler.module_methods:
			try:
				perms = permission_mapping[mn]
				if perms:
					for perm in perms: 
						try:
							permissions_required.index(perm)
						except:
							permissions_required.append(perm)
			except:
				pass
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
					if subkey not in ('nodes', 'type', 'name', 'url', 'options', 'classname', 'android:name'):
						service_str += '\n\t\t\t%s="%s"' % (subkey, service[subkey])

				if 'nodes' in service:
					service_str += '>'
					for node in service['nodes']:
						service_str += '\n\t\t\t\t' + node.toxml()
					services.append(service_str + '\n\t\t</service>\n')
				else:
					services.append(service_str + '\n\t\t/>\n')


		self.use_maps = False
		iconname = self.tiapp.properties['icon']
		iconpath = os.path.join(self.assets_resources_dir,iconname)
		iconext = os.path.splitext(iconpath)[1]
		if not os.path.exists(os.path.join('res','drawable')):
			os.makedirs(os.path.join('res','drawable'))
			
		existingicon = os.path.join('res','drawable','appicon%s' % iconext)	
		if os.path.exists(existingicon):	
			os.remove(existingicon)
		if os.path.exists(iconpath):
			shutil.copy(iconpath,existingicon)
		else:
			shutil.copy(os.path.join(self.support_resources_dir, 'default.png'), existingicon)

		# make our Titanium theme for our icon
		resfiledir = os.path.join('res','values')
		if not os.path.exists(resfiledir):
			os.makedirs(resfiledir)
		resfilepath = os.path.join(resfiledir,'theme.xml')
		if not os.path.exists(resfilepath):
			resfile = open(resfilepath,'w')
			TITANIUM_THEME="""<?xml version="1.0" encoding="utf-8"?>
<resources>
<style name="Theme.Titanium" parent="android:Theme.NoTitleBar.Fullscreen">
    <item name="android:windowBackground">@drawable/background</item>
</style>
</resources>
"""
			resfile.write(TITANIUM_THEME)
			resfile.close()
		
		# create our background image which acts as splash screen during load	
		resources_dir = os.path.join(self.top_dir, 'Resources')
		android_images_dir = os.path.join(resources_dir, 'android', 'images')
		# look for density-specific default.png's first
		if os.path.exists(android_images_dir):
			pattern = r'/android/images/(high|medium|low|res-[^/]+)/default.png'
			for root, dirs, files in os.walk(android_images_dir):
				for f in files:
					path = os.path.join(root, f)
					if re.search(pattern, path):
						res_folder = resource_drawable_folder(path)
						debug('found %s splash screen at %s' % (res_folder, path))
						dest_path = os.path.join(self.res_dir, res_folder, 'background.png')
						os.makedirs(dest_path)
						shutil.copy(path, dest_path) 

		splashimage = os.path.join(self.assets_resources_dir,'default.png')
		background_png = os.path.join('res','drawable','background.png')
		if os.path.exists(splashimage):
			debug("found splash screen at %s" % os.path.abspath(splashimage))
			shutil.copy(splashimage, background_png)
		else:
			shutil.copy(os.path.join(self.support_resources_dir, 'default.png'), background_png)
		

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
		def get_manifest_xml(tiapp):
			xml = ''
			if 'manifest' in tiapp.android_manifest:
				for manifest_el in tiapp.android_manifest['manifest']:
					# since we already track permissions in another way, go ahead and us e that
					if manifest_el.nodeName == 'uses-permission' and manifest_el.hasAttribute('android:name'):
						if manifest_el.getAttribute('android:name').split('.')[-1] not in permissions_required:
							permissions_required.append(manifest_el.getAttribute('android:name'))
					elif manifest_el.nodeName not in ('supports-screens', 'uses-sdk'):
						xml += manifest_el.toprettyxml()
			return xml
		
		application_xml = ''
		def get_application_xml(tiapp):
			xml = ''
			if 'application' in tiapp.android_manifest:
				for app_el in tiapp.android_manifest['application']:
					xml += app_el.toxml()
			return xml
		
		# add manifest / application entries from tiapp.xml
		manifest_xml += get_manifest_xml(self.tiapp)
		application_xml += get_application_xml(self.tiapp)
		
		# add manifest / application entries from modules
		detector = ModuleDetector(self.top_dir)
		self.missing_modules, self.modules = detector.find_app_modules(self.tiapp)
		for module in self.modules:
			if module.xml == None: continue
			manifest_xml += get_manifest_xml(module.xml)
			application_xml += get_application_xml(module.xml)

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
					if nodes:
						olddom.documentElement.replaceChild(newnode, nodes[0])

				if supports_screens_node:
					replace_node(dom, supports_screens_node)
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
		
		res_dir = os.path.join(self.project_dir, 'res')
		output = run.run([self.aapt, 'package', '-m', '-J', self.project_gen_dir, '-M', android_manifest, '-S', res_dir, '-I', self.android_jar],
			warning_regex=r'skipping')
		
		r_file = os.path.join(self.project_gen_dir, self.app_id.replace('.', os.sep), 'R.java')
		if not os.path.exists(r_file) or output == None:
			error("Error generating R.java from manifest")
			sys.exit(1)
		
		return manifest_changed

	def generate_stylesheet(self):
		cssc = csscompiler.CSSCompiler(os.path.join(self.top_dir, 'Resources'), 'android', self.app_id)
		project_gen_pkg_dir = os.path.join(self.project_gen_dir, self.app_id.replace('.', os.sep))
		if not os.path.exists(project_gen_pkg_dir):
			os.makedirs(project_gen_pkg_dir)
		app_stylesheet = os.path.join(project_gen_pkg_dir, 'ApplicationStylesheet.java')
		debug("app stylesheet => %s" % app_stylesheet)
		
		asf = codecs.open(app_stylesheet, 'w', 'utf-8')
		asf.write(cssc.code)
		asf.close()
		
	def generate_localizations(self):
		# compile localization files
		localecompiler.LocaleCompiler(self.name,self.top_dir,'android',sys.argv[1]).compile()
	
	def recurse(self, paths, file_glob=None):
		if paths == None: yield None
		if not isinstance(paths, list): paths = [paths]
		
		for path in paths:
			for root, dirs, files in os.walk(path):
				for filename in files:
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
		
		for java_file in self.recurse([self.project_src_dir, self.project_gen_dir], '*.java'):
			# the file list file still needs each file escaped apparently
			src_list.append('"%s"' % java_file.replace("\\", "\\\\"))
	
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
		
		debug("Building Java Sources: " + " ".join(src_list))
		javac_command = [self.javac, '-encoding', 'utf8', '-classpath', classpath, '-d', self.classes_dir, '-sourcepath', self.project_src_dir, '-sourcepath', self.project_gen_dir]
		(src_list_osfile, src_list_filename) = tempfile.mkstemp()
		src_list_file = os.fdopen(src_list_osfile, 'w')
		src_list_file.write("\n".join(src_list))
		src_list_file.close()
		
		javac_command.append('@' + src_list_filename)
		out = run.run(javac_command)
		os.remove(src_list_filename)
	
	def create_unsigned_apk(self, resources_zip_file):
		unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')
		debug("creating unsigned apk: " + unsigned_apk)
		# copy existing resources into the APK
		resources_zip = zipfile.ZipFile(resources_zip_file)
		apk_zip = zipfile.ZipFile(unsigned_apk, 'w')

		def skip_jar_path(path):
			return path.endswith('/') or \
				path.startswith('META-INF/') or \
				path.split('/')[-1].startswith('.')
			
		for path in resources_zip.namelist():
			if skip_jar_path(path): continue
			debug("from resource zip => " + path)
			apk_zip.writestr(path, resources_zip.read(path))
		resources_zip.close()
		
		# add classes.dex
		apk_zip.write(self.classes_dex, 'classes.dex')
		
		# add all resource files from the project
		for root, dirs, files in os.walk(self.project_src_dir):
			for file in files:
				if os.path.splitext(file)[1] != '.java':
					relative_path = os.path.join(root[len(self.project_src_dir)+1:], file)
					debug("resource file => " + relative_path)
					apk_zip.write(os.path.join(root, file), relative_path)
		
		def add_resource_jar(jar_file):
			jar = zipfile.ZipFile(jar_file)
			for path in jar.namelist():
				if skip_jar_path(path): continue
				if os.path.splitext(path)[1] != '.class':
					debug("from JAR %s => %s" % (jar_file, path))
					apk_zip.writestr(path, jar.read(path))
			jar.close()
		
		for jar_file in self.module_jars:
			add_resource_jar(jar_file)
		for jar_file in self.android_jars:
			add_resource_jar(jar_file)
		
		apk_zip.close()
		return unsigned_apk

	def package_and_deploy(self):
		ap_ = os.path.join(self.project_dir, 'bin', 'app.ap_')
		rhino_jar = os.path.join(self.support_dir, 'js.jar')
		run.run([self.aapt, 'package', '-f', '-M', 'AndroidManifest.xml', '-A', self.assets_dir, '-S', 'res', '-I', self.android_jar, '-I', self.titanium_jar, '-F', ap_],
			warning_regex=r'skipping')
	
		unsigned_apk = self.create_unsigned_apk(ap_)
		#unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')
		#apk_build_cmd = [self.apkbuilder, unsigned_apk, '-u', '-z', ap_, '-f', self.classes_dex, '-rf', self.project_src_dir]
		#for jar in self.android_jars:
		#	apk_build_cmd += ['-rj', jar]
		#for jar in self.module_jars:
		#	apk_build_cmd += ['-rj', jar]
		
		#output, err_output = run.run(apk_build_cmd, ignore_error=True, return_error=True)
		#if err_output:
		#	if 'THIS TOOL IS DEPRECATED' in err_output:
		#		debug('apkbuilder deprecation warning received')
		#	else:
		#		run.check_and_print_err(err_output, None)

		if self.dist_dir:
			app_apk = os.path.join(self.dist_dir, self.name + '.apk')	
		else:
			app_apk = os.path.join(self.project_dir, 'bin', 'app.apk')	

		output = run.run([self.jarsigner, '-storepass', self.keystore_pass, '-keystore', self.keystore, '-signedjar', app_apk, unsigned_apk, self.keystore_alias])
		run.check_output_for_error(output, r'RuntimeException: (.*)', True)
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
			sys.exit(0)

		if self.build_only:
			return (False, False)

		out = subprocess.Popen([self.sdk.get_adb(), self.device_type_arg, 'get-state'], stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]
		out = str(out).strip()
		
		# try a few times as sometimes it fails waiting on boot
		attempts = 0
		launched = False
		launch_failed = False
		while attempts < 5:
			try:
				cmd = [self.sdk.get_adb()]
				if self.install:
					self.wait_for_device('d')
					info("Installing application on emulator")
					cmd += ['-d']
				else:
					self.wait_for_device('e')
					info("Installing application on device")
					cmd += ['-e']
				cmd += ['install', '-r', app_apk]
				output = run.run(cmd)
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
		output = run.run([
			self.sdk.get_adb(), self.device_type_arg, 'shell', 'am', 'start',
			'-a', 'android.intent.action.MAIN',
			'-c','android.intent.category.LAUNCHER',
			'-n', '%s/.%sActivity' % (self.app_id , self.classname)])
		
		trace("Launch output: %s" % output)
		
	def build_and_run(self, install, avd_id, keystore=None, keystore_pass='tirocks', keystore_alias='tidev', dist_dir=None, build_only=False):
		deploy_type = 'development'
		self.build_only = build_only
		if install:
			if keystore == None:
				deploy_type = 'test'
			else:
				deploy_type = 'production'

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
				print "[ERROR] Build Failed (Missing plugins directory)"
				sys.stdout.flush()
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
				'deploy_type':deploy_type
			}
			for plugin in self.tiappxml.properties['plugins']:
				local_plugin_file = os.path.join(local_compiler_dir,plugin['name'],'plugin.py')
				plugin_file = os.path.join(tp_compiler_dir,plugin['name'],plugin['version'],'plugin.py')
				print "[INFO] plugin=%s" % plugin_file
				if not os.path.exists(local_plugin_file) and not os.path.exists(plugin_file):
					print "[ERROR] Build Failed (Missing plugin for %s)" % plugin['name']
					sys.stdout.flush()
					sys.exit(1)
				print "[INFO] Detected compiler plugin: %s/%s" % (plugin['name'],plugin['version'])
				code_path = plugin_file
				if os.path.exists(local_plugin_file):	
					code_path = local_plugin_file
				compiler_config['plugin']=plugin
				fin = open(code_path, 'rb')
				m = hashlib.md5()
				m.update(open(code_path,'rb').read()) 
				code_hash = m.hexdigest()
				p = imp.load_source(code_hash, code_path, fin)
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
		self.deploy_type = deploy_type
		
		self.device_type_arg = '-e'
		if self.deploy_type == 'test':
			self.device_type_arg = '-d'
			
		self.dist_dir = dist_dir
		self.aapt = self.sdk.get_aapt()
		self.android_jar = self.sdk.get_android_jar()
		self.titanium_jar = os.path.join(self.support_dir,'titanium.jar')
		dx = self.sdk.get_dx()
		self.apkbuilder = self.sdk.get_apkbuilder()
		self.sdcard_resources = '/sdcard/Ti.debug/%s/Resources' % self.app_id
		
		self.resources_installed = False
		if deploy_type == "production":
			self.app_installed = False
		else:
			self.app_installed = not build_only and self.is_app_installed()
			debug("%s installed? %s" % (self.app_id, self.app_installed))
			
			self.resources_installed = not build_only and self.are_resources_installed()
			debug("%s resources installed? %s" % (self.app_id, self.resources_installed))
			
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
			
			# if os.path.exists('lib'):
			# 	for jar in self.android_jars:
			# 		shutil.copy(jar, 'lib')

			resources_dir = os.path.join(self.top_dir,'Resources')
			self.assets_dir = os.path.join(self.project_dir,'bin','assets')
			self.assets_resources_dir = os.path.join(self.assets_dir,'Resources')
			
			if not os.path.exists(self.assets_dir):
				os.makedirs(self.assets_dir)
			
			shutil.copy(self.project_tiappxml, self.assets_dir)
			finalxml = os.path.join(self.assets_dir,'tiapp.xml')
			self.tiapp = TiAppXML(finalxml)
			self.tiapp.setDeployType(deploy_type)
			self.sdcard_copy = False
			sdcard_property = "ti.android.loadfromsdcard"
			if self.tiapp.has_app_property(sdcard_property):
				self.sdcard_copy = self.tiapp.to_bool(self.tiapp.get_app_property(sdcard_property))

			self.classes_dir = os.path.join(self.project_dir, 'bin', 'classes')	
			if not os.path.exists(self.classes_dir):
				os.makedirs(self.classes_dir)

			self.copy_project_resources()
			
			if self.tiapp_changed or self.force_rebuild or self.deploy_type == "production":
				trace("Generating Java Classes")
				self.android.create(os.path.abspath(os.path.join(self.top_dir,'..')), True, project_dir=self.top_dir)
			else:
				info("Tiapp.xml unchanged, skipping class generation")

			# compile resources
			full_resource_dir = os.path.join(self.project_dir, self.assets_resources_dir)
			compiler = Compiler(self.tiapp, full_resource_dir, self.java, self.classes_dir, self.project_dir)
			compiler.compile()
			self.compiled_files = compiler.compiled_files
			self.android_jars = compiler.jar_libraries
			
			if not os.path.exists(self.assets_dir):
				os.makedirs(self.assets_dir)

			self.copy_resource_drawables()

			self.warn_dupe_drawable_folders()

			special_resources_dir = os.path.join(self.top_dir,'platform','android')
			ignore_files = ignoreFiles
			ignore_files.extend(['AndroidManifest.xml']) # don't want to overwrite build/android/AndroidManifest.xml yet
			if os.path.exists(special_resources_dir):
				showed_info_msg = False
				debug("found special platform files dir = %s" % special_resources_dir)
				for root, dirs, files in os.walk(special_resources_dir):
					for name in ignoreDirs:
						if name in dirs: dirs.remove(name)
					for file in files:
						if file in ignore_files : continue
						if not showed_info_msg:
							info('Copying platform-specific files ...')
							showed_info_msg = True
						from_ = os.path.join(root, file)           
						to_ = from_.replace(special_resources_dir, self.project_dir, 1)
						to_directory = os.path.split(to_)[0]
						if not os.path.exists(to_directory):
							os.makedirs(to_directory)
						shutil.copyfile(from_, to_)
			
			self.generate_stylesheet()
			self.generate_aidl()
			
			manifest_changed = self.generate_android_manifest(compiler)

			# If density-specific images exist yet AndroidManifest does not have
			# anyDensity="true" in <supports-screens>, show a warning (but not for KitchenSink)
			density_image_dir = os.path.join(resources_dir, 'android', 'images')
			if 'smoketest' not in self.name.lower() and 'kitchensink' not in self.name.lower() and os.path.exists(density_image_dir) and os.path.exists(os.path.join(self.project_dir, 'AndroidManifest.xml')):
				using_density_images = False
				for root, dirs, files in os.walk(density_image_dir):
					for f in files:
						path = os.path.join(root, f)
						if is_resource_drawable(path):
							using_density_images = True
							break
				if using_density_images:
					f = codecs.open(os.path.join(self.project_dir, 'AndroidManifest.xml'), 'r', 'utf-8')
					xml = f.read()
					f.close()
					if not re.search(r'anyDensity="true"', xml):
						warn('For your density-specific images (android/images/high|medium|low|res-*) to be effective, you should put a <supports-screens> element with anyDensity="true" in the <android><manifest> section of your tiapp.xml or in a custom AndroidManifest.xml')

			my_avd = None	
			self.google_apis_supported = False
				
			# find the AVD we've selected and determine if we support Google APIs
			for avd_props in avd.get_avds(self.sdk):
				if avd_props['id'] == avd_id:
					my_avd = avd_props
					self.google_apis_supported = (my_avd['name'].find('Google')!=-1 or my_avd['name'].find('APIs')!=-1)
					break
			
			if build_only:
				self.google_apis_supported = True

			remove_orphaned_files(resources_dir, os.path.join(self.project_dir, 'bin', 'assets', 'Resources'))

			self.build_generated_classes()
			generated_classes_built = True
			
			self.classes_dex = os.path.join(self.project_dir, 'bin', 'classes.dex')
			
			def jar_includer(path, isfile):
				if isfile and path.endswith(".jar"): return True
				return False
			support_deltafy = Deltafy(self.support_dir, jar_includer)
			support_deltas = support_deltafy.scan()
			
			dex_built = False
			if len(support_deltas) > 0 or generated_classes_built or self.deploy_type == "production":
				# the dx.bat that ships with android in windows doesn't allow command line
				# overriding of the java heap space, so we call the jar directly
				if platform.system() == 'Windows':
					dex_args = [self.java, '-Xmx1024M', '-Djava.ext.dirs=%s' % self.sdk.get_platform_tools_dir(), '-jar', self.sdk.get_dx_jar()]
				else:
					dex_args = [dx, '-JXmx1536M', '-JXX:-UseGCOverheadLimit']
				dex_args += ['--dex', '--output='+self.classes_dex, self.classes_dir]
				dex_args += self.android_jars
				dex_args += self.module_jars
		
				info("Compiling Android Resources... This could take some time")
				sys.stdout.flush()
				# TODO - Document Exit message
				run_result = run.run(dex_args)
				if (run_result == None):
					dex_built = False
					error("System Error while compiling Android classes.dex")
					sys.exit(1)
				else:
					dex_built = True
			
			if self.sdcard_copy and not build_only and \
				(not self.resources_installed or not self.app_installed) and \
				(self.deploy_type == 'development' or self.deploy_type == 'test'):
				
					if self.install: self.wait_for_device('e')
					else: self.wait_for_device('d')
				
					trace("Performing full copy to SDCARD -> %s" % self.sdcard_resources)
					cmd = [self.sdk.get_adb(), self.device_type_arg, "push", os.path.join(self.top_dir, 'Resources'), self.sdcard_resources]
					output = run.run(cmd)
					trace("result: %s" % output)
			
					android_resources_dir = os.path.join(self.top_dir, 'Resources', 'android')
					if os.path.exists(android_resources_dir):
						cmd = [self.sdk.get_adb(), self.device_type_arg, "push", android_resources_dir, self.sdcard_resources]
						output = run.run(cmd)
						trace("result: %s" % output)
						
			if dex_built or generated_classes_built or self.tiapp_changed or manifest_changed or not self.app_installed or not self.sdcard_copy:
				# metadata has changed, we need to do a full re-deploy
				launched, launch_failed = self.package_and_deploy()
				if launched:
					self.run_app()
					info("Deployed %s ... Application should be running." % self.name)
				elif launch_failed==False and not build_only:
					info("Application installed. Launch from drawer on Home Screen")
			elif not build_only:
				
				# we copied all the files to the sdcard, no need to package
				# just kill from adb which forces a restart
				info("Re-launching application ... %s" % self.name)
				
				relaunched = False
				processes = run.run([self.sdk.get_adb(), self.device_type_arg, 'shell', 'ps'])
				for line in processes.splitlines():
					columns = line.split()
					if len(columns) > 1:
						pid = columns[1]
						id = columns[len(columns)-1]
						
						if id == self.app_id:
							run.run([self.sdk.get_adb(), self.device_type_arg, 'shell', 'kill', pid])
							relaunched = True
				
				self.run_app()
				if relaunched:
					info("Relaunched %s ... Application should be running." % self.name)

		finally:
			os.chdir(curdir)
			sys.stdout.flush()
			

if __name__ == "__main__":
	def usage():
		print "%s <command> <project_name> <sdk_dir> <project_dir> <app_id> [key] [password] [alias] [dir] [avdid] [avdsdk]" % os.path.basename(sys.argv[0])
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
	
	s = Builder(project_name,sdk_dir,project_dir,template_dir,app_id)
	s.command = command

	try:
		if command == 'run-emulator':
			s.run_emulator(avd_id, avd_skin)
		elif command == 'run':
			s.build_and_run(False, avd_id)
		elif command == 'emulator':
			avd_id = dequote(sys.argv[6])
			avd_skin = dequote(sys.argv[7])
			s.run_emulator(avd_id,avd_skin)
		elif command == 'simulator':
			info("Building %s for Android ... one moment" % project_name)
			avd_id = dequote(sys.argv[6])
			s.build_and_run(False,avd_id)
		elif command == 'install':
			avd_id = dequote(sys.argv[6])
			s.build_and_run(True,avd_id)
		elif command == 'distribute':
			key = os.path.abspath(os.path.expanduser(dequote(sys.argv[6])))
			password = dequote(sys.argv[7])
			alias = dequote(sys.argv[8])
			output_dir = dequote(sys.argv[9])
			avd_id = dequote(sys.argv[10])
			s.build_and_run(True,avd_id,key,password,alias,output_dir)
		elif command == 'build':
			s.build_and_run(False, 1, build_only=True)
		else:
			error("Unknown command: %s" % command)
			usage()
	except SystemExit:
		pass
	except:
		exctype, excvalue = sys.exc_info()[:2]
		e = traceback.format_exc()
		e = e.replace('\n','\t')
		print "[ERROR] Error in compiler. %s, %s; %s" % (exctype, excvalue, e)
		sys.exit(1)
		
	sys.exit(0)

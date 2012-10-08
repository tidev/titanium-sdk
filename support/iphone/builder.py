#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Build and Launch iPhone Application in Simulator or install
# the application on the device via iTunes
# 

import os, sys, uuid, subprocess, shutil, signal, string, traceback, imp, filecmp, inspect
import platform, time, re, run, glob, codecs, hashlib, datetime, plistlib
from compiler import Compiler, softlink_for_simulator
from projector import Projector
from xml.dom.minidom import parseString
from xml.etree.ElementTree import ElementTree
from os.path import join, splitext, split, exists
from tools import ensure_dev_path

# the template_dir is the path where this file lives on disk
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

# add the parent and the common directory so we can load libraries from those paths too
sys.path.append(os.path.join(template_dir,'../'))
sys.path.append(os.path.join(template_dir,'../common'))
sys.path.append(os.path.join(template_dir, '../module'))
script_ok = False

from tiapp import *
from css import csscompiler
import localecompiler
from module import ModuleDetector
from tools import *

ignoreFiles = ['.gitignore', '.cvsignore']
ignoreDirs = ['.git','.svn', 'CVS']

# need this so unicode works
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)

def version_sort(a,b):
	x = float(a[0:3]) # ignore more than 2 places
	y = float(b[0:3]) # ignore more than 2 places
	if x > y:
		return -1
	if x < y:
		return 1
	return 0

# this will return the version of the iOS SDK that we have installed
def check_iphone_sdk(s):
	found = []
	output = run.run(["xcodebuild","-showsdks"],True,False)
	#print output
	if output:
		for line in output.split("\n"):
			if line[0:1] == '\t':
				line = line.strip()
				i = line.find('-sdk')
				if i < 0: continue
				type = line[0:i]
				cmd = line[i+5:]
				if cmd.find("iphoneos")==0:
					ver = cmd[8:]
					found.append(ver)
	# The sanity check doesn't have to be as thorough as prereq.
	if s in found:
		return s
	# Sanity check failed. Let's find something close.
	return sorted(found,version_sort)[0]

def dequote(s):
	if s[0:1] == '"':
		return s[1:-1]
	return s

# force kill the simulator if running
def kill_simulator():
	run.run(['/usr/bin/killall',"ios-sim"],True)
	run.run(['/usr/bin/killall',"iPhone Simulator"],True)

def write_project_property(f,prop,val):
	existing_val = read_project_property(f,prop)
	if existing_val!=val:
		fx = open(f,'w')
		fx.write("%s=%s\n"%(prop,val))
		fx.close()
			
def read_project_property(f,prop):
	if os.path.exists(f):
		contents = open(f).read()
		for line in contents.splitlines(False):
			(k,v) = line.split("=")
			if k == prop:
				return v
	return None

def read_project_appid(f):
	return read_project_property(f,'TI_APPID')
	
def read_project_version(f):
	return read_project_property(f,'TI_VERSION')
			
def infoplist_has_appid(f,appid):
	if os.path.exists(f):
		contents = codecs.open(f,encoding='utf-8').read()
		return contents.find(appid)>0
	return False
		
def copy_module_resources(source, target, copy_all=False, force=False):
	if not os.path.exists(os.path.expanduser(target)):
		os.makedirs(os.path.expanduser(target))
	for root, dirs, files in os.walk(source, True, None, True):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
		for file in files:
			if copy_all==False and splitext(file)[-1] in ('.html', '.js', '.css', '.a', '.m', '.c', '.cpp', '.h', '.mm'):
				continue
			if file in ignoreFiles:
				continue
			from_ = os.path.join(root, file)			  
			to_ = os.path.expanduser(from_.replace(source, target, 1))
			to_directory = os.path.expanduser(split(to_)[0])
			if not exists(to_directory):
				os.makedirs(to_directory)
			# only copy if different filesize or doesn't exist
			if not os.path.exists(to_) or os.path.getsize(from_)!=os.path.getsize(to_) or force:
				if os.path.exists(to_): os.remove(to_)
				shutil.copyfile(from_, to_)

# WARNING: This could be a time bomb waiting to happen, because it mangles
# the app bundle name for NO REASON.  Or... does it?
def make_app_name(s):
	r = re.compile('[0-9a-zA-Z_]')
	buf = ''
	for i in s:
		if i=='-':
			buf+='_'
			continue
		if r.match(i)!=None:
			buf+=i
	# if name starts with number, we simply append a k to it
	if re.match('^[0-9]+',buf):
		buf = 'k%s' % buf
	return buf

def getText(nodelist):
	rc = ""
	for node in nodelist:
		if node.nodeType == node.TEXT_NODE:
			rc+=node.data
		elif node.nodeType == node.ELEMENT_NODE:
			rc+=getText(node.childNodes)
	return rc

def make_map(dict):
	props = {}
	curkey = None

	for i in dict.childNodes:
		if i.nodeType == 1:
			if i.nodeName == 'key':
				curkey = str(getText(i.childNodes)).strip()
			elif i.nodeName == 'dict':
				props[curkey] = make_map(i)
				curkey = None
			elif i.nodeName == 'array':
				s = i.getElementsByTagName('string')
				if len(s):
					txt = ''
					for t in s:
						txt+=getText(t.childNodes)
					props[curkey]=txt
				else:
					props[curkey]=None
				curkey = None
			else:
				if i.childNodes.length > 0:
					props[curkey] = getText(i.childNodes)
				else:
					props[curkey] = i.nodeName
				curkey = None

	return props

def dump_resources_listing(rootdir,out):
	out.write("\nFile listing for %s\n\n" % rootdir)
	total = 0
	for root, subFolders, files in os.walk(rootdir, True, None, True):
		for file in files:
			p = os.path.join(root,file)
			s = os.path.getsize(p)
			total+=s
			s = "[%.0f]" % s
			p = p[len(rootdir)+1:]
			if p.startswith('build/android') or p.startswith('build/mobileweb'): continue
			out.write("  %s %s\n" % (string.ljust(p,120),string.ljust(s,8)))
	out.write("-" * 130)
	out.write("\nTotal files: %.1f MB\n" % ((total/1024)/1024))
	out.write("\n")

def dump_infoplist(infoplist,out):
	plist = codecs.open(infoplist, encoding='utf-8').read()
	out.write("Contents of Info.plist\n\n")
	out.write(plist)
	out.write("\n")
	out.write("=" * 130)
	out.write("\n\n")
		
def read_provisioning_profile(f,o):
	f = open(f,'rb').read()
	b = f.index('<?xml')
	e = f.index('</plist>')
	xml_content = f[b:e+8]
	o.write("Reading provisioning profile:\n\n%s\n" % xml_content)
	dom = parseString(xml_content)
	dict = dom.getElementsByTagName('dict')[0]
	props = make_map(dict)
	return props

def get_aps_env(provisioning_profile):
	entitlements = provisioning_profile['Entitlements']
	if entitlements.has_key('aps-environment'):
		return entitlements['aps-environment']
	return None
	
def get_task_allow(provisioning_profile):
	entitlements = provisioning_profile['Entitlements']
	return entitlements['get-task-allow']
	
def get_app_prefix(provisioning_profile):
	appid_prefix = provisioning_profile['ApplicationIdentifierPrefix']
	return appid_prefix
	
def get_profile_uuid(provisioning_profile):
	return provisioning_profile['UUID']
	
def generate_customized_entitlements(provisioning_profile,appid,uuid,command,out):
	
	get_task_value = get_task_allow(provisioning_profile)
	aps_env = get_aps_env(provisioning_profile)
	
	buffer = """<?xml version="1.0" encoding="UTF-8"?> 	
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
	<dict>
"""		
	
	app_prefix = None
	
	if command=='distribute':
		app_prefix = get_app_prefix(provisioning_profile)
		out.write("Using app_prefix = %s\n\n" % (app_prefix))
		buffer+="""
		<key>application-identifier</key>
		<string>%s.%s</string>
		""" % (app_prefix,appid)
	
	buffer+="<key>get-task-allow</key>\n		<%s/>" % get_task_value
	
	if aps_env!=None:
		buffer+="\n<key>aps-environment</key>\n		<string>%s</string>" % aps_env
	
	if command=='distribute':
		buffer+="""
		<key>keychain-access-groups</key>
		<array>
			<string>%s.%s</string>
		</array>
		""" % (app_prefix,appid)

	buffer+="""
	</dict>
</plist>"""
	
	return buffer

def xcode_version():
	output = run.run(['xcodebuild','-version'],True,False)
	if output:
		versionLine = output.split('\n')[0]
		return float(versionLine.split(' ')[1].rpartition('.')[0])

def distribute_xc4(name, icon, log):
	# Locations of bundle, app binary, dsym info
	log.write("Creating distribution for xcode4...\n");	
	timestamp = datetime.datetime.now()
	date = timestamp.date().isoformat()
	time = timestamp.time().strftime('%H-%M-%S')
	archive_name = os.path.join(date,'%s_%s' % (name, time))
	archive_bundle = os.path.join(os.path.expanduser("~/Library/Developer/Xcode/Archives"),"%s.xcarchive" % archive_name)
	archive_app = os.path.join(archive_bundle,"Products","Applications","%s.app" % name)
	archive_dsym = os.path.join(archive_bundle,"dSYM")
	
	# create directories
	if not os.access(archive_bundle, os.F_OK): os.makedirs(archive_bundle)
	if not os.access(archive_app, os.F_OK): os.makedirs(archive_app)
	if not os.access(archive_dsym, os.F_OK): os.makedirs(archive_dsym)

	# copy app bundles into the approps. places
	os.system('ditto "%s.app" "%s"' % (name,archive_app))
	os.system('ditto "%s.app.dSYM" "%s"' % (name,archive_dsym))
	
	# plist processing time - this is the biggest difference from XC3.
	archive_info_plist = os.path.join(archive_bundle,'Info.plist')
	log.write("Writing archive plist to: %s\n\n" % archive_info_plist)
	
	# load existing plist values so that we can use them in generating the archive
	# plist
	os.system('/usr/bin/plutil -convert xml1 -o "%s" "%s"' % (os.path.join(archive_bundle,'Info.xml.plist'),os.path.join(archive_app,'Info.plist')))
	project_info_plist = plistlib.readPlist(os.path.join(archive_bundle,'Info.xml.plist'))
	appbundle = "Applications/%s.app" % name
	# NOTE: We chop off the end '.' of 'CFBundleVersion' to provide the 'short' version
	version = project_info_plist['CFBundleVersion']
	app_version_ = version.split('.')
	if(len(app_version_) > 3):
		version = app_version_[0]+'.'+app_version_[1]+'.'+app_version_[2]	
	archive_info = {
		'ApplicationProperties' : {
			'ApplicationPath' : appbundle,
			'CFBundleIdentifier' : project_info_plist['CFBundleIdentifier'],
			'CFBundleShortVersionString' : version,
			'IconPaths' : [os.path.join(appbundle,icon), os.path.join(appbundle,icon)]
		},
		'ArchiveVersion' : float(1),
		'CreationDate' : datetime.datetime.utcnow(),
		'Name' : name,
		'SchemeName' : name
	}
	
	# write out the archive plist and clean up
	log.write("%s\n\n" % archive_info)
	plistlib.writePlist(archive_info,archive_info_plist)
	os.remove(os.path.join(archive_bundle,'Info.xml.plist'))
	
	# Workaround for dumb xcode4 bug that doesn't update the organizer unless
	# files are touched in a very specific manner
	temp = os.path.join(os.path.expanduser("~/Library/Developer/Xcode/Archives"),"temp")
	os.rename(archive_bundle,temp)
	os.rename(temp,archive_bundle)

def is_indexing_enabled(tiapp, simulator_dir, **kwargs):
	# darwin versions:
	# - 9.x: Leopard (10.5)
	# - 10.x: Snow Leopard (10.6)
	# - 11.x: Lion (10.7)

	# for testing purposes
	platform_release = kwargs.get("platform_release", platform.release())
	darwin_version = [int(n) for n in platform_release.split(".")]

	enable_mdfind = True
	if tiapp.has_app_property('ti.ios.enablemdfind'):
		enable_mdfind = tiapp.to_bool(tiapp.get_app_property('ti.ios.enablemdfind'))

	# mdfind is specifically disabled, so don't use it
	if not enable_mdfind:
		return False

	# pre-Leopard, mdfind / mdutil don't exist
	if darwin_version[0] < 10:
		return False

	# for testing purposes
	indexer_status = kwargs.get("indexer_status")
	if indexer_status == None:
		indexer_status = run.run(['mdutil', '-a', '-s'], True)

	# An error occurred running mdutil, play it safe
	if indexer_status == None:
		return False

	lines = indexer_status.splitlines()
	mount_point_status = {}
	for i in range(0, len(lines), 2):
		mount_point = lines[i].rstrip(':')
		if len(lines) > (i+1):
			status = lines[i+1].strip('\t.')
			# Only add mount points that the simulator_dir starts with
			if simulator_dir.startswith(mount_point):
				mount_point_status[mount_point] = status
		# mdutil must be disabled if we don't get the right amount of output
		else:
			return False

	if len(mount_point_status) > 0:
		# There may be multiple volumes that have a mount point that the
		# simulator_dir matches, so the one with the longest length
		# *should* be the most specific / correct mount point.
		mount_points = mount_point_status.keys()
		mount_points.sort(lambda a, b: cmp(len(b), len(a)))
		status = mount_point_status[mount_points[0]]

		if 'Indexing enabled' in status:
			return True

	return False

HEADER = """/**
* Appcelerator Titanium Mobile
* This is generated code. Do not modify. Your changes *will* be lost.
* Generated code is Copyright (c) 2009-2011 by Appcelerator, Inc.
* All Rights Reserved.
*/
#import <Foundation/Foundation.h>
"""

DEFAULTS_IMPL_HEADER= """#import "TiUtils.h"
#import "ApplicationDefaults.h"
 
@implementation ApplicationDefaults
  
+ (NSMutableDictionary*) copyDefaults
{
    NSMutableDictionary * _property = [[NSMutableDictionary alloc] init];\n
"""

FOOTER ="""
@end
"""

def copy_tiapp_properties(project_dir):
	tiapp = ElementTree()
	src_root = os.path.dirname(sys.argv[0])
	assets_tiappxml = os.path.join(project_dir,'tiapp.xml')
	if not os.path.exists(assets_tiappxml):
		shutil.copy(os.path.join(project_dir, 'tiapp.xml'), assets_tiappxml)
	tiapp.parse(open(assets_tiappxml, 'r'))
	impf = open("ApplicationDefaults.m",'w+')
	appl_default = os.path.join(project_dir,'build','iphone','Classes','ApplicationDefaults.m')
	impf.write(HEADER)
	impf.write(DEFAULTS_IMPL_HEADER)
	for property_el in tiapp.findall("property"):
		name = property_el.get("name")
		type = property_el.get("type")
		value = property_el.text
		if name == None: continue
		if value == None: value = ""
		if type == "string":
			impf.write("""    [_property setObject:[TiUtils stringValue:@"%s"] forKey:@"%s"];\n"""%(value,name))
		elif type == "bool":
			impf.write("""    [_property setObject:[NSNumber numberWithBool:[TiUtils boolValue:@"%s"]] forKey:@"%s"];\n"""%(value,name))
		elif type == "int":
			impf.write("""    [_property setObject:[NSNumber numberWithInt:[TiUtils intValue:@"%s"]] forKey:@"%s"];\n"""%(value,name))
		elif type == "double":
			impf.write("""    [_property setObject:[NSNumber numberWithDouble:[TiUtils doubleValue:@"%s"]] forKey:@"%s"];\n"""%(value,name))
		elif type == None:
			impf.write("""    [_property setObject:[TiUtils stringValue:@"%s"] forKey:@"%s"];\n"""%(value,name))
		else:
			print """[WARN] Cannot set property "%s" , type "%s" not supported""" % (name,type)
	if (len(tiapp.findall("property")) > 0) :
		impf.write("\n    return _property;\n}")
	else: 
		impf.write("\n    [_property release];")
		impf.write("\n    return nil;\n}")
	impf.write(FOOTER)
	impf.close()
	if open(appl_default,'r').read() == open('ApplicationDefaults.m','r').read():
		os.remove('ApplicationDefaults.m')
		return False
	else:
		shutil.copyfile('ApplicationDefaults.m',appl_default)
		os.remove('ApplicationDefaults.m')
		return True
	

def cleanup_app_logfiles(tiapp, log_id, iphone_version):
	print "[DEBUG] finding old log files"
	sys.stdout.flush()
	simulator_dir = os.path.expanduser('~/Library/Application\ Support/iPhone\ Simulator/%s' % iphone_version)

	# No need to clean if the directory doesn't exist
	if not os.path.exists(simulator_dir):
		return

	results = None

	# If the indexer is enabled, we can use spotlight for faster searching
	if is_indexing_enabled(tiapp, simulator_dir):
		print "[DEBUG] Searching for old log files with mdfind..."
		sys.stdout.flush()
		results = run.run(['mdfind',
			'-onlyin', simulator_dir,
			'-name', '%s.log' % log_id
		], True)

	# Indexer is disabled, revert to manual crawling
	if results == None:
		print "[DEBUG] Searching for log files without mdfind..."
		sys.stdout.flush()
		def find_all_log_files(folder, fname):
			results = []
			for root, dirs, files in os.walk(os.path.expanduser(folder)):
				for file in files:
					if fname==file:
						fullpath = os.path.join(root, file)
						results.append(fullpath)
			return results
		for f in find_all_log_files(simulator_dir, '%s.log' % log_id):
			print "[DEBUG] removing old log file: %s" % f
			sys.stdout.flush()
			os.remove(f)
	else:
		for i in results.splitlines(False):
			print "[DEBUG] removing old log file: %s" % i
			os.remove(i)

def find_name_conflicts(project_dir, project_name):
	for dir in ['Resources', 'Resources/iphone']:
		for name in os.listdir(os.path.join(project_dir, dir)):
			if name.lower() == project_name.lower():
				print "[ERROR] Project name %s conflicts with resource named %s: Cannot build. Please change one." % (project_name, os.path.join(project_dir, dir, name))
				sys.exit(1)
	pass

#
# this script is invoked from our tooling but you can run from command line too if 
# you know the arguments
#
# the current pattern is <command> [arguments]
#
# where the arguments are dependent on the command being passed
#	
def main(args):
	global script_ok
	argc = len(args)
	if argc < 2 or argc==2 and (args[1]=='--help' or args[1]=='-h'):
		print "%s <command> <version> <project_dir> <appid> <name> [options]" % os.path.basename(args[0])
		print
		print "available commands: "
		print
		print "  install       install the app to itunes for testing on iphone"
		print "  simulator     build and run on the iphone simulator"
		print "  adhoc         build for adhoc distribution"
		print "  distribute    build final distribution bundle"
		print "  xcode         build from within xcode"
		print "  run           build and run app from project folder"
	
		sys.exit(1)

	print "[INFO] One moment, building ..."
	sys.stdout.flush()
	start_time = time.time()
	command = args[1].decode("utf-8")
	ensure_dev_path()

	target = 'Debug'
	deploytype = 'development'
	devicefamily = 'iphone'
	debug = False
	build_only = False
	simulator = False
	xcode_build = False
	force_xcode = False
	simtype = devicefamily

	# when you run from xcode, we'll pass xcode as the command and the 
	# xcode script will simply pass some additional args as well as xcode
	# will add some additional useful stuff to the ENVIRONMENT and we pull
	# those values out here
	if command == 'xcode':
		xcode_build = True
		src_root = os.environ['SOURCE_ROOT']
		project_dir = os.path.abspath(os.path.join(src_root,'../','../'))
		name = os.environ['PROJECT_NAME']
		target = os.environ['CONFIGURATION']
		appid = os.environ['TI_APPID']
		arch = os.environ['CURRENT_ARCH']
		sdk_name = os.environ['SDK_NAME']
		iphone_version = sdk_name.replace('iphoneos','').replace('iphonesimulator','')
		# SUPPORTED_DEVICE_FAMILIES 1 or 2 or both
		# TARGETED_DEVICE_FAMILY 1 or 2
		target_device = os.environ['TARGETED_DEVICE_FAMILY']
		if target_device == '1':
			devicefamily = 'iphone'
		elif target_device == '2':
			devicefamily = 'ipad'
		elif target_device == '1,2':
			devicefamily = 'universal'
		if arch == 'i386': 
			# simulator always indicates simulator
			deploytype = 'development'
		else:
			# if arch!=i386 indicates a build for device
			if target=='Debug':
				# non-simulator + debug build indicates test on device
				deploytype = 'test'
			else:
				# non-simulator + release build indicates package for distribution
				deploytype = 'production'
		#Ensure the localization files are copied in the application directory
		out_dir = os.path.join(os.environ['TARGET_BUILD_DIR'],os.environ['CONTENTS_FOLDER_PATH'])
		localecompiler.LocaleCompiler(name,project_dir,devicefamily,deploytype,out_dir).compile()
		compiler = Compiler(project_dir,appid,name,deploytype)
		compiler.compileProject(xcode_build,devicefamily,iphone_version)
		script_ok = True
		sys.exit(0)
	else:
		# the run command is when you run from titanium using the run command
		# and it will run the project in the current directory immediately in the simulator
		# from the command line
		if command == 'run':
			if argc < 3:
				print "Usage: %s run <project_dir> [ios_version]" % os.path.basename(args[0])
				sys.exit(1)
			if argc == 3:
				iphone_version = check_iphone_sdk('4.0')
			else:
				iphone_version = dequote(args[3].decode("utf-8"))
			project_dir = os.path.expanduser(dequote(args[2].decode("utf-8")))
			iphonesim = os.path.abspath(os.path.join(template_dir,'ios-sim'))
			iphone_dir = os.path.abspath(os.path.join(project_dir,'build','iphone'))
			tiapp_xml = os.path.join(project_dir,'tiapp.xml')
			ti = TiAppXML(tiapp_xml)
			appid = ti.properties['id']
			name = ti.properties['name']
			command = 'simulator' # switch it so that the rest of the stuff works
		else:
			iphone_version = dequote(args[2].decode("utf-8"))
			iphonesim = os.path.abspath(os.path.join(template_dir,'ios-sim'))
			project_dir = os.path.expanduser(dequote(args[3].decode("utf-8")))
			appid = dequote(args[4].decode("utf-8"))
			name = dequote(args[5].decode("utf-8"))
			tiapp_xml = os.path.join(project_dir,'tiapp.xml')
			ti = TiAppXML(tiapp_xml)
			
		app_name = make_app_name(name)
		iphone_dir = os.path.abspath(os.path.join(project_dir,'build','iphone'))
		
		# We need to create the iphone dir if necessary, now that
		# the tiapp.xml allows build target selection
		if not os.path.isdir(iphone_dir):
			if os.path.exists(iphone_dir):
				os.remove(iphone_dir)
			os.makedirs(iphone_dir)
		
		project_xcconfig = os.path.join(iphone_dir,'project.xcconfig')
		target = 'Release'
		ostype = 'os'
		version_file = None
		log_id = None
		provisioning_profile = None
		debughost = None
		debugport = None
		debugairkey = None
		debughosts = None
		postbuild_modules = []
		finalize_modules = []

		def run_finalize():
			try:
				if finalize_modules:
					for p in finalize_modules:
						print "[INFO] Running finalize %s..." % p[0]
						o.write("Running finalize %s" % p[0])
						p[1].finalize()
			except Exception,e:
				print "[ERROR] Error in finalize: %s" % e
				o.write("Error in finalize: %s" % e)

		
		# starting in 1.4, you don't need to actually keep the build/iphone directory
		# if we don't find it, we'll just simply re-generate it
		if not os.path.exists(iphone_dir):
			from iphone import IPhone
			print "[INFO] Detected missing project but that's OK. re-creating it..."
			iphone_creator = IPhone(name,appid)
			iphone_creator.create(iphone_dir,True)
			sys.stdout.flush()
			
		# we use different arguments dependent on the command
		# pluck those out here
		if command == 'distribute':
			iphone_version = check_iphone_sdk(iphone_version)
			link_version = iphone_version
			dist_keychain = None
			appuuid = dequote(args[6].decode("utf-8"))
			dist_name = dequote(args[7].decode("utf-8"))
			output_dir = os.path.expanduser(dequote(args[8].decode("utf-8")))
			if argc > 9:
				devicefamily = dequote(args[9].decode("utf-8"))
			if argc > 10:
				dist_keychain = dequote(args[10].decode("utf-8"))
			print "[INFO] Switching to production mode for distribution"
			deploytype = 'production'
		elif command in ['simulator', 'build']:
			link_version = check_iphone_sdk(iphone_version)
			deploytype = 'development'
			debug = True
			simulator = command == 'simulator'
			build_only = command == 'build'
			target = 'Debug'
			ostype = 'simulator'
			if argc > 6:
				devicefamily = dequote(args[6].decode("utf-8"))
			if argc > 7:
				simtype = dequote(args[7].decode("utf-8"))
			else:
				# 'universal' helpfully translates into iPhone here... just in case.
				simtype = devicefamily
			if argc > 8:
				# this is host:port from the debugger
				debughost = dequote(args[8].decode("utf-8"))
				if debughost=='':
					debughost = None
					debugport = None
				else:
					debughost,debugport = debughost.split(":")
		elif command in ['install', 'adhoc']:
			iphone_version = check_iphone_sdk(iphone_version)
			link_version = iphone_version
			dist_keychain = None
			appuuid = dequote(args[6].decode("utf-8"))
			dist_name = dequote(args[7].decode("utf-8"))
			if argc > 8:
				devicefamily = dequote(args[8].decode("utf-8"))
			if argc > 9:
				dist_keychain = dequote(args[9].decode("utf-8"))
				if dist_keychain=='':
					dist_keychain = None
			
			if argc > 10:
				# this is host:port:airkey:hosts from the debugger
				debughost = dequote(args[10].decode("utf-8"))
				if debughost=='':
					debughost = None
					debugport = None
					debugairkey = None
					debughosts = None
				else:
					debughost,debugport,debugairkey,debughosts = debughost.split(":",4)
			
			if command == 'install':
				target = 'Debug'
				deploytype = 'test'
			elif command == 'adhoc':
				target = 'Release'
				deploytype = 'production'
		
		# setup up the useful directories we need in the script
		build_out_dir = os.path.abspath(os.path.join(iphone_dir,'build'))
		build_dir = os.path.abspath(os.path.join(build_out_dir,'%s-iphone%s'%(target,ostype)))
		app_dir = os.path.abspath(os.path.join(build_dir,name+'.app'))
		binary = os.path.join(app_dir,name)
		sdk_version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))
		iphone_resources_dir = os.path.join(iphone_dir,'Resources')
		version_file = os.path.join(iphone_resources_dir,'.version')
		force_rebuild = read_project_version(project_xcconfig)!=sdk_version or not os.path.exists(version_file)
		infoplist = os.path.join(iphone_dir,'Info.plist')
		githash = None
		custom_fonts = []

		# Before doing a single thing, we want to check for conflicts and bail out if necessary.
		find_name_conflicts(project_dir, app_name)

		# if we're not running in the simulator we want to clean out the build directory
		if command!='simulator' and os.path.exists(build_out_dir):
			shutil.rmtree(build_out_dir)
		if not os.path.exists(build_out_dir): 
			os.makedirs(build_out_dir)
		# write out the build log, useful for debugging
		o = codecs.open(os.path.join(build_out_dir,'build.log'),'w',encoding='utf-8')
		def log(msg):
			print msg
			o.write(msg)
		try:
			buildtime = datetime.datetime.now()
			o.write("%s\n" % ("="*80))
			o.write("Appcelerator Titanium Diagnostics Build Log\n")
			o.write("The contents of this file are useful to send to Appcelerator Support if\n")
			o.write("reporting an issue to help us understand your environment, build settings\n")
			o.write("and aid in debugging. Please attach this log to any issue that you report.\n")
			o.write("%s\n\n" % ("="*80))
			o.write("Starting build at %s\n\n" % buildtime.strftime("%m/%d/%y %H:%M"))
			
			# write out the build versions info
			versions_txt = read_config(os.path.join(template_dir,'..','version.txt'))
			o.write("Build details:\n\n")
			for key in versions_txt:
				o.write("   %s=%s\n" % (key,versions_txt[key]))
			o.write("\n\n")
			
			if versions_txt.has_key('githash'): 
				githash = versions_txt['githash']
				
			o.write("Script arguments:\n")
			for arg in args:
				o.write(unicode("   %s\n" % arg, 'utf-8'))
			o.write("\n")
			o.write("Building from: %s\n" % template_dir)
			o.write("Platform: %s\n\n" % platform.version())

			# print out path to debug
			xcode_path=run.run(["/usr/bin/xcode-select","-print-path"],True,False)
			if xcode_path:
				o.write("Xcode path is: %s\n" % xcode_path)
			else:
				o.write("Xcode path undetermined\n")

			# find the module directory relative to the root of the SDK	
			titanium_dir = os.path.abspath(os.path.join(template_dir,'..','..','..','..'))
			tp_module_dir = os.path.abspath(os.path.join(titanium_dir,'modules','iphone'))
			force_destroy_build = command!='simulator'

			detector = ModuleDetector(project_dir)
			missing_modules, modules = detector.find_app_modules(ti, 'iphone')
			module_lib_search_path, module_asset_dirs = locate_modules(modules, project_dir, app_dir, log)
			common_js_modules = []
			
			if len(missing_modules) != 0:
				print '[ERROR] Could not find the following required iOS modules:'
				for module in missing_modules:
					print "[ERROR]\tid: %s\tversion: %s" % (module['id'], module['version'])
				sys.exit(1)

			# search for modules that the project is using
			# and make sure we add them to the compile
			for module in modules:
				if module.js:
					common_js_modules.append(module)
					continue
				module_id = module.manifest.moduleid.lower()
				module_version = module.manifest.version
				module_lib_name = ('lib%s.a' % module_id).lower()
				# check first in the local project
				local_module_lib = os.path.join(project_dir, 'modules', 'iphone', module_lib_name)
				local = False
				if os.path.exists(local_module_lib):
					module_lib_search_path.append([module_lib_name, local_module_lib])
					local = True
					log("[INFO] Detected third-party module: %s" % (local_module_lib))
				else:
					if module.lib is None:
						module_lib_path = module.get_resource(module_lib_name)
						log("[ERROR] Third-party module: %s/%s missing library at %s" % (module_id, module_version, module_lib_path))
						sys.exit(1)
					module_lib_search_path.append([module_lib_name, os.path.abspath(module.lib).rsplit('/',1)[0]])
					log("[INFO] Detected third-party module: %s/%s" % (module_id, module_version))
				force_xcode = True

				if not local:
					# copy module resources
					img_dir = module.get_resource('assets', 'images')
					if os.path.exists(img_dir):
						dest_img_dir = os.path.join(app_dir, 'modules', module_id, 'images')
						if not os.path.exists(dest_img_dir):
							os.makedirs(dest_img_dir)
						module_asset_dirs.append([img_dir, dest_img_dir])

					# copy in any module assets
					module_assets_dir = module.get_resource('assets')
					if os.path.exists(module_assets_dir): 
						module_dir = os.path.join(app_dir, 'modules', module_id)
						module_asset_dirs.append([module_assets_dir, module_dir])

			full_version = sdk_version
			if 'version' in versions_txt:
				full_version = versions_txt['version']
				if 'timestamp' in versions_txt or 'githash' in versions_txt:
					full_version += ' ('
					if 'timestamp' in versions_txt:
						full_version += '%s' % versions_txt['timestamp']
					if 'githash' in versions_txt:
						full_version += ' %s' % versions_txt['githash']
					full_version += ')'

			print "[INFO] Titanium SDK version: %s" % full_version
			print "[INFO] iPhone Device family: %s" % devicefamily
			print "[INFO] iPhone SDK version: %s" % iphone_version
			
			if simulator or build_only:
				print "[INFO] iPhone simulated device: %s" % simtype
				# during simulator we need to copy in standard built-in module files
				# since we might not run the compiler on subsequent launches
				for module_name in ('facebook','ui'):
					img_dir = os.path.join(template_dir,'modules',module_name,'images')
					dest_img_dir = os.path.join(app_dir,'modules',module_name,'images')
					if not os.path.exists(dest_img_dir):
						os.makedirs(dest_img_dir)
					module_asset_dirs.append([img_dir,dest_img_dir])

				# when in simulator since we point to the resources directory, we need
				# to explicitly copy over any files
				ird = os.path.join(project_dir,'Resources','iphone')
				if os.path.exists(ird): 
					module_asset_dirs.append([ird,app_dir])
					
				# We also need to copy over the contents of 'platform/iphone'
				platform_iphone = os.path.join(project_dir,'platform','iphone')
				if os.path.exists(platform_iphone):
					module_asset_dirs.append([platform_iphone,app_dir])
				
				for ext in ('ttf','otf'):
					for f in glob.glob('%s/*.%s' % (os.path.join(project_dir,'Resources'),ext)):
						custom_fonts.append(f)
					

			if not (simulator or build_only):
				version = ti.properties['version']
				# we want to make sure in debug mode the version always changes
				version = "%s.%d" % (version,time.time())
				if (deploytype != 'production'):
					ti.properties['version']=version
				pp = os.path.expanduser("~/Library/MobileDevice/Provisioning Profiles/%s.mobileprovision" % appuuid)
				provisioning_profile = read_provisioning_profile(pp,o)
	
			create_info_plist(ti, template_dir, project_dir, infoplist)

			applogo = None
			clean_build = False

			# check to see if the appid is different (or not specified) - we need to re-generate
			if read_project_appid(project_xcconfig)!=appid or not infoplist_has_appid(infoplist,appid):
				clean_build = True
				force_xcode = True


			new_lib_hash = None
			lib_hash = None	
			existing_git_hash = None

			# this code simply tries and detect if we're building a different
			# version of the project (or same version but built from different git hash)
			# and if so, make sure we force rebuild so to propagate any code changes in
			# source code (either upgrade or downgrade)
			if os.path.exists(app_dir):
				if os.path.exists(version_file):
					line = open(version_file).read().strip()
					lines = line.split(",")
					v = lines[0]
					log_id = lines[1]
					if len(lines) > 2:
						lib_hash = lines[2]
						existing_git_hash = lines[3]
					if lib_hash==None:
						force_rebuild = True
					else:
						if template_dir==v and force_rebuild==False:
							force_rebuild = False
						else:
							log_id = None
				else:
					force_rebuild = True

			else:
				force_rebuild = True

			o.write("\ngithash=%s, existing_git_hash=%s\n" %(githash,existing_git_hash))
				
			if githash!=existing_git_hash:
				force_rebuild = True

			# we want to read the md5 of the libTiCore.a library since it must match
			# the current one we're building and if not, we need to force a rebuild since
			# that means we've copied in a different version of the library and we need
			# to rebuild clean to avoid linking errors
			source_lib=os.path.join(template_dir,'libTiCore.a')
			fd = open(source_lib,'rb')
			m = hashlib.md5()
			m.update(fd.read(1024)) # just read 1K, it's binary
			new_lib_hash = m.hexdigest()
			fd.close()
			
			if new_lib_hash!=lib_hash:
				force_rebuild=True
				o.write("forcing rebuild since libhash (%s) not matching (%s)\n" % (lib_hash,new_lib_hash))

			lib_hash=new_lib_hash

			# when we force rebuild, we need to re-compile and re-copy source, libs etc
			if force_rebuild:
				o.write("Performing full rebuild\n")
				print "[INFO] Performing full rebuild. This will take a little bit. Hold tight..."
				sys.stdout.flush()

				# In order to avoid dual-mangling, we need to make sure that if we're re-projecting,
				# there is NOT an existing xcodeproj file.
				if not os.path.exists(os.path.join(iphone_dir, "%s.xcodeproj" % name)):
					project = Projector(name,sdk_version,template_dir,project_dir,appid, None)
					project.create(template_dir,iphone_dir)
				
				force_xcode = True
				if os.path.exists(app_dir): shutil.rmtree(app_dir)
				# we have to re-copy if we have a custom version
				create_info_plist(ti, template_dir, project_dir, infoplist)
				# since compiler will generate the module dependencies, we need to 
				# attempt to compile to get it correct for the first time.
				compiler = Compiler(project_dir,appid,name,deploytype)
				compiler.compileProject(xcode_build,devicefamily,iphone_version,True)
			else:
				if simulator:
					softlink_for_simulator(project_dir,app_dir)
				contents="TI_VERSION=%s\n"% sdk_version
				contents+="TI_SDK_DIR=%s\n" % template_dir.replace(sdk_version,'$(TI_VERSION)')
				contents+="TI_APPID=%s\n" % appid
				contents+="OTHER_LDFLAGS[sdk=iphoneos*]=$(inherited) -weak_framework iAd\n"
				contents+="OTHER_LDFLAGS[sdk=iphonesimulator*]=$(inherited) -weak_framework iAd\n"
				contents+="#include \"module\"\n"
				xcconfig = open(project_xcconfig,'w+')
				xccontents = xcconfig.read()
				if contents!=xccontents:
					o.write("writing contents of %s:\n\n%s\n" % (project_xcconfig,contents))
					o.write("old contents\n\n%s\n" % (xccontents))
					xcconfig.write(contents)
					xcconfig.close()
				else:
					o.write("Skipping writing contents of xcconfig %s\n" % project_xcconfig)

			# write out any modules into the xcode project
			# this must be done after project create above or this will be overriden
			link_modules(module_lib_search_path, name, iphone_dir)

			cwd = os.getcwd()

			# check to see if the symlink exists and that it points to the
			# right version of the library
			libticore = os.path.join(template_dir,'libTiCore.a')
			make_link = True
			symlink = os.path.join(iphone_dir,'lib','libTiCore.a')
			if os.path.islink(symlink):
				path = os.path.realpath(symlink)
				if path.find(sdk_version) > 0:
					make_link = False
			if make_link:
				libdir = os.path.join(iphone_dir,'lib')
				if not os.path.exists(libdir): os.makedirs(libdir)
				os.chdir(libdir)
				# a broken link will not return true on os.path.exists
				# so we need to use brute force
				try:
					os.unlink("libTiCore.a")
				except:
					pass
				try:
					os.symlink(libticore,"libTiCore.a")
				except:
					pass
				os.chdir(cwd)

			# if the lib doesn't exist, force a rebuild since it's a new build
			if not os.path.exists(os.path.join(iphone_dir,'lib','libtiverify.a')):
				shutil.copy(os.path.join(template_dir,'libtiverify.a'),os.path.join(iphone_dir,'lib','libtiverify.a'))

			if not os.path.exists(os.path.join(iphone_dir,'lib','libti_ios_debugger.a')):
				shutil.copy(os.path.join(template_dir,'libti_ios_debugger.a'),os.path.join(iphone_dir,'lib','libti_ios_debugger.a'))

			# compile JSS files
			cssc = csscompiler.CSSCompiler(os.path.join(project_dir,'Resources'),devicefamily,appid)
			app_stylesheet = os.path.join(iphone_dir,'Resources','stylesheet.plist')
			asf = codecs.open(app_stylesheet,'w','utf-8')
			asf.write(cssc.code)
			asf.close()

			# compile debugger file
			debug_plist = os.path.join(iphone_dir,'Resources','debugger.plist')
			
			# Force an xcodebuild if the debugger.plist has changed
			force_xcode = write_debugger_plist(debughost, debugport, debugairkey, debughosts, template_dir, debug_plist)

			if command not in ['simulator', 'build']:
				# compile plist into binary format so it's faster to load
				# we can be slow on simulator
				os.system("/usr/bin/plutil -convert binary1 \"%s\"" % app_stylesheet)
			
			o.write("Generated the following stylecode code:\n\n")
			o.write(cssc.code)
			o.write("\n")

			# generate the Info.plist file with the appropriate device family
			if devicefamily!=None:
				applogo = ti.generate_infoplist(infoplist,appid,devicefamily,project_dir,iphone_version)
			else:
				applogo = ti.generate_infoplist(infoplist,appid,'iphone',project_dir,iphone_version)
				
			# attempt to load any compiler plugins
			if len(ti.properties['plugins']) > 0:
				local_compiler_dir = os.path.abspath(os.path.join(project_dir,'plugins'))
				tp_compiler_dir = os.path.abspath(os.path.join(titanium_dir,'plugins'))
				if not os.path.exists(tp_compiler_dir) and not os.path.exists(local_compiler_dir):
					o.write("+ Missing plugins directory at %s\n" % tp_compiler_dir)
					print "[ERROR] Build Failed (Missing plugins directory). Please see output for more details"
					sys.stdout.flush()
					sys.exit(1)
				compiler_config = {
					'platform':'ios',
					'devicefamily':devicefamily,
					'simtype':simtype,
					'tiapp':ti,
					'project_dir':project_dir,
					'titanium_dir':titanium_dir,
					'appid':appid,
					'iphone_version':iphone_version,
					'template_dir':template_dir,
					'project_name':name,
					'command':command,
					'deploytype':deploytype,
					'build_dir':build_dir,
					'app_name':app_name,
					'app_dir':app_dir,
					'iphone_dir':iphone_dir
				}
				for plugin in ti.properties['plugins']:
					local_plugin_file = os.path.join(local_compiler_dir,plugin['name'],'plugin.py')
					plugin_file = os.path.join(tp_compiler_dir,plugin['name'],plugin['version'],'plugin.py')
					if not os.path.exists(local_plugin_file) and not os.path.exists(plugin_file):
						o.write("+ Missing plugin at %s (checked %s also)\n" % (plugin_file,local_plugin_file))
						print "[ERROR] Build Failed (Missing plugin for %s). Please see output for more details" % plugin['name']
						sys.stdout.flush()
						sys.exit(1)
					o.write("+ Detected plugin: %s/%s\n" % (plugin['name'],plugin['version']))
					print "[INFO] Detected compiler plugin: %s/%s" % (plugin['name'],plugin['version'])
					code_path = plugin_file
					if os.path.exists(local_plugin_file):	
						code_path = local_plugin_file
					o.write("+ Loading compiler plugin at %s\n" % code_path)
					compiler_config['plugin']=plugin
					fin = open(code_path, 'rb')
					m = hashlib.md5()
					m.update(open(code_path,'rb').read()) 
					code_hash = m.hexdigest()
					p = imp.load_source(code_hash, code_path, fin)
					module_functions = dict(inspect.getmembers(p, inspect.isfunction))
					if module_functions.has_key('postbuild'):
						print "[DEBUG] Plugin has postbuild"
						o.write("+ Plugin has postbuild")
						postbuild_modules.append((plugin['name'], p))
					if module_functions.has_key('finalize'):
						print "[DEBUG] Plugin has finalize"
						o.write("+ Plugin has finalize")
						finalize_modules.append((plugin['name'], p))
					p.compile(compiler_config)
					fin.close()
					
			try:		
				os.chdir(iphone_dir)

				# target the requested value if provided; otherwise, target minimum (4.0)
				# or maximum iphone_version

				if 'min-ios-ver' in ti.ios:
					min_ver = ti.ios['min-ios-ver']
					if min_ver < 4.0:
						print "[INFO] Minimum iOS version %s is lower than 4.0: Using 4.0 as minimum" % min_ver
						min_ver = 4.0
					elif min_ver > float(iphone_version):
						print "[INFO] Minimum iOS version %s is greater than %s (iphone_version): Using %s as minimum" % (min_ver, iphone_version, iphone_version)
						min_ver = float(iphone_version)
				else:
					min_ver = 4.0

				print "[INFO] Minimum iOS version: %s" % min_ver
				deploy_target = "IPHONEOS_DEPLOYMENT_TARGET=%s" % min_ver
				device_target = 'TARGETED_DEVICE_FAMILY=1'  # this is non-sensical, but you can't pass empty string
				
				# No armv6 support above 4.3 or with 6.0+ SDK
				if min_ver >= 4.3 or float(iphone_version) >= 6.0:
					valid_archs = 'armv7 i386'
				else:
					valid_archs = 'armv6 armv7 i386'

				# clean means we need to nuke the build 
				if clean_build or force_destroy_build: 
					print "[INFO] Performing clean build"
					o.write("Performing clean build...\n")
					if os.path.exists(app_dir):
						shutil.rmtree(app_dir)

				if not os.path.exists(app_dir): os.makedirs(app_dir)

				# compile localization files
				# Using app_name here will cause the locale to be put in the WRONG bundle!!
				localecompiler.LocaleCompiler(name,project_dir,devicefamily,deploytype).compile()
				
				# copy any module resources
				if len(module_asset_dirs)>0:
					for e in module_asset_dirs:
						copy_module_resources(e[0],e[1],True)

				# copy CommonJS modules
				for module in common_js_modules:
					#module_id = module.manifest.moduleid.lower()
					#module_dir = os.path.join(app_dir, 'modules', module_id)
					#if os.path.exists(module_dir) is False:
					#	os.makedirs(module_dir)
					shutil.copy(module.js, app_dir)
				
				# copy artworks, if appropriate
				if command in ['adhoc', 'install', 'distribute']:
					artworks = ['iTunesArtwork', 'iTunesArtwork@2x']
					for artwork in artworks:
						if os.path.exists(os.path.join(project_dir, artwork)):
							shutil.copy(os.path.join(project_dir, artwork), app_dir)
				
				# copy any custom fonts in (only runs in simulator)
				# since we need to make them live in the bundle in simulator
				if len(custom_fonts)>0:
					for f in custom_fonts:
						font = os.path.basename(f)
						app_font_path = os.path.join(app_dir, font)
						print "[INFO] Detected custom font: %s" % font
						if os.path.exists(app_font_path):
							os.remove(app_font_path)
						try:
							shutil.copy(f,app_dir)
						except shutil.Error, e:
							print "[WARN] Not copying %s: %s" % (font, e)

				# dump out project file info
				if command not in ['simulator', 'build']:
					dump_resources_listing(project_dir,o)
					dump_infoplist(infoplist,o)

				install_logo(ti, applogo, project_dir, template_dir, app_dir)
				install_defaults(project_dir, template_dir, iphone_resources_dir)

				extra_args = None

				recompile = copy_tiapp_properties(project_dir)
				# if the anything changed in the application defaults then we have to force  a xcode build.
				if recompile == True:
					force_xcode = recompile

				if devicefamily!=None:
					# Meet the minimum requirements for ipad when necessary
					if devicefamily == 'ipad' or devicefamily == 'universal':
						device_target="TARGETED_DEVICE_FAMILY=2"
						# NOTE: this is very important to run on device -- i dunno why
						# xcode warns that 3.2 needs only armv7, but if we don't pass in 
						# armv6 we get crashes on device
						extra_args = ["VALID_ARCHS="+valid_archs]
					# Additionally, if we're universal, change the device family target
					if devicefamily == 'universal':
						device_target="TARGETED_DEVICE_FAMILY=1,2"

				kroll_coverage = ""
				if ti.has_app_property("ti.ios.enablecoverage"):
					enable_coverage = ti.to_bool(ti.get_app_property("ti.ios.enablecoverage"))
					if enable_coverage:
						kroll_coverage = "KROLL_COVERAGE=1"

				def execute_xcode(sdk,extras,print_output=True):

					config = name
					if devicefamily=='ipad':
						config = "%s-iPad" % config
					if devicefamily=='universal':
						config = "%s-universal" % config

					# these are the arguments for running a command line xcode build
					args = ["xcodebuild","-target",config,"-configuration",target,"-sdk",sdk]
					if extras!=None and len(extras)>0: 
						args += extras
					args += [deploy_target,device_target]
					if extra_args!=None and len(extra_args)>0:
						args += extra_args

					o.write("Starting Xcode compile with the following arguments:\n\n")
					for arg in args: o.write("    %s\n" % arg)
					o.write("\napp_id = %s\n" % appid)
					o.write("\n\n")
					o.flush()

					if print_output:
						print "[DEBUG] compile checkpoint: %0.2f seconds" % (time.time()-start_time)
						print "[INFO] Executing XCode build..."
						print "[BEGIN_VERBOSE] Executing XCode Compiler  <span>[toggle output]</span>"

					# h/t cbarber for this; occasionally the PCH header info gets out of sync
					# with the PCH file if you do the "wrong thing" and xcode isn't
					# smart enough to pick up these changes (since the PCH file hasn't 'changed').
					run.run(['touch', '%s_Prefix.pch' % ti.properties['name']], debug=False)
					
					output = run.run(args,False,False,o)

					if print_output:
						print output
						print "[END_VERBOSE]"
						sys.stdout.flush()

					# Output already written by run.run
					#o.write(output)

					# check to make sure the user doesn't have a custom build location 
					# configured in Xcode which currently causes issues with titanium
					idx = output.find("TARGET_BUILD_DIR ")
					if idx > 0:
						endidx = output.find("\n",idx)
						if endidx > 0:
							target_build_dir = dequote(output[idx+17:endidx].strip())
							if not os.path.samefile(target_build_dir,build_dir):
								o.write("+ TARGET_BUILD_DIR = %s\n" % target_build_dir)
								print "[ERROR] Your TARGET_BUILD_DIR is incorrectly set. Most likely you have configured in Xcode a customized build location. Titanium does not currently support this configuration."
								print "[ERROR] Expected dir %s, was: %s" % (build_dir,target_build_dir)
								sys.stdout.flush()
								sys.exit(1)

					# look for build error
					if output.find("** BUILD FAILED **")!=-1 or output.find("ld returned 1")!=-1 or output.find("The following build commands failed:")!=-1:
						o.write("+ Detected build failure\n")
						print "[ERROR] Build Failed. Please see output for more details"
						sys.stdout.flush()
						sys.exit(1)

					o.write("+ Looking for application binary at %s\n" % binary)

					# make sure binary exists
					if not os.path.exists(binary):
						o.write("+ Missing application binary at %s\n" % binary)
						print "[ERROR] Build Failed (Missing app at %s). Please see output for more details" % binary
						sys.stdout.flush()
						sys.exit(1)

					# look for a code signing error
					error = re.findall(r'Code Sign error:(.*)',output)
					if len(error) > 0:
						o.write("+ Detected code sign error: %s\n" % error[0])
						print "[ERROR] Code sign error: %s" % error[0].strip()
						sys.stdout.flush()
						sys.exit(1)
					
				def run_postbuild():
					try:
						if postbuild_modules:
							for p in postbuild_modules:
								o.write("Running postbuild %s" % p[0])
								print "[INFO] Running postbuild %s..." % p[0]
								p[1].postbuild()
					except Exception,e:
						o.write("Error in post-build: %s" % e)
						print "[ERROR] Error in post-build: %s" % e
						
				# build the final release distribution
				args = []

				if command not in ['simulator', 'build']:
					# allow the project to have its own custom entitlements
					custom_entitlements = os.path.join(project_dir,"Entitlements.plist")
					entitlements_contents = None
					if os.path.exists(custom_entitlements):
						entitlements_contents = open(custom_entitlements).read()
						o.write("Found custom entitlements: %s\n" % custom_entitlements)
					else:
						# attempt to customize it by reading prov profile
						entitlements_contents = generate_customized_entitlements(provisioning_profile,appid,appuuid,command,o)
					o.write("Generated the following entitlements:\n\n%s\n\n" % entitlements_contents)
					f=open(os.path.join(iphone_resources_dir,'Entitlements.plist'),'w+')
					f.write(entitlements_contents)
					f.close()
					args+=["CODE_SIGN_ENTITLEMENTS=Resources/Entitlements.plist"]

				# only build if force rebuild (different version) or 
				# the app hasn't yet been built initially
				if ti.properties['guid']!=log_id or force_xcode:
					log_id = ti.properties['guid']
					f = open(version_file,'w+')
					f.write("%s,%s,%s,%s" % (template_dir,log_id,lib_hash,githash))
					f.close()

				# both simulator and build require an xcodebuild
				if command in ['simulator', 'build']:
					debugstr = ''
					if debughost:
						debugstr = 'DEBUGGER_ENABLED=1'
					
					if force_rebuild or force_xcode or not os.path.exists(binary):
						execute_xcode("iphonesimulator%s" % link_version,["GCC_PREPROCESSOR_DEFINITIONS=__LOG__ID__=%s DEPLOYTYPE=development TI_DEVELOPMENT=1 DEBUG=1 TI_VERSION=%s %s %s" % (log_id,sdk_version,debugstr,kroll_coverage)],False)
						
					run_postbuild()
					
					o.write("Finishing build\n")

				if command == 'simulator':
					# first make sure it's not running
					kill_simulator()
					#Give the kill command time to finish
					time.sleep(2)
					
					# sometimes the simulator doesn't remove old log files
					# in which case we get our logging jacked - we need to remove
					# them before running the simulator

					cleanup_app_logfiles(ti, log_id, iphone_version)

					sim = None

					# this handler will simply catch when the simulator exits
					# so we can exit this script
					def handler(signum, frame):
						global script_ok
						print "[INFO] Simulator is exiting"
						
						if not log == None:
							try:
								os.system("kill -2 %s" % str(log.pid))
							except:
								pass
						if not sim == None and signum!=3:
							try:
								os.system("kill -3 %s" % str(sim.pid))
							except:
								pass

						kill_simulator()
						script_ok = True
						sys.exit(0)

					# make sure we're going to stop this script whenever 
					# the simulator exits
					signal.signal(signal.SIGHUP, handler)
					signal.signal(signal.SIGINT, handler)
					signal.signal(signal.SIGQUIT, handler)
					signal.signal(signal.SIGABRT, handler)
					signal.signal(signal.SIGTERM, handler)

					print "[INFO] Launching application in Simulator"

					sys.stdout.flush()
					sys.stderr.flush()

					# set the DYLD_FRAMEWORK_PATH environment variable for the following Popen iphonesim command
					# this allows the XCode developer folder to be arbitrarily named
					xcodeselectpath = os.popen("/usr/bin/xcode-select -print-path").readline().rstrip('\n')
					iphoneprivateframeworkspath = xcodeselectpath + '/Platforms/iPhoneSimulator.platform/Developer/Library/PrivateFrameworks:' + xcodeselectpath + '/../OtherFrameworks'
					os.putenv('DYLD_FRAMEWORK_PATH', iphoneprivateframeworkspath)

					# launch the simulator
					
					# Awkward arg handling; we need to take 'retina' to be a device type,
					# even though it's really not (it's a combination of device type and configuration).
					# So we translate it into two args:
					if simtype == 'retina':
						# Manually overrule retina type if we're an ipad
						if devicefamily == 'ipad':
							simtype = 'ipad'
						else:
							simtype = 'iphone --retina'
					if devicefamily==None:
						sim = subprocess.Popen("\"%s\" launch \"%s\" --sdk %s" % (iphonesim,app_dir,iphone_version),shell=True,cwd=template_dir)
					else:
						sim = subprocess.Popen("\"%s\" launch \"%s\" --sdk %s --family %s" % (iphonesim,app_dir,iphone_version,simtype),shell=True,cwd=template_dir)
					os.unsetenv('DYLD_FRAMEWORK_PATH')

					# activate the simulator window
					ass = os.path.join(template_dir, 'iphone_sim_activate.scpt')
					command = 'osascript "%s" "%s/Platforms/iPhoneSimulator.platform/Developer/Applications/iPhone Simulator.app"' % (ass, xcodeselectpath)
					os.system(command)

					end_time = time.time()-start_time

					print "[INFO] Launched application in Simulator (%0.2f seconds)" % end_time
					sys.stdout.flush()
					sys.stderr.flush()

					# give the simulator a bit to get started and up and running before 
					# starting the logger
					time.sleep(2)

					logger = os.path.realpath(os.path.join(template_dir,'logger.py'))

					# start the logger tail process. this will simply read the output
					# from the logs and stream them back to Titanium Developer on the console
					log = subprocess.Popen([
					  	logger,
						str(log_id)+'.log',
						iphone_version
					])	

					# wait (blocking this script) until the simulator exits	
					try:
						os.waitpid(sim.pid,0)
					except SystemExit:
						# If the user terminates the app here, it's via a
						# soft kill of some kind (i.e. like what TiDev does)
						# and so we should suppress the usual error message.
						# Fixes #2086
						pass

					print "[INFO] Application has exited from Simulator"

					# in this case, the user has exited the simulator itself
					# and not clicked Stop Emulator from within Developer so we kill
					# our tail log process but let simulator keep running
					if not log == None:
						try:
							os.system("kill -2 %s" % str(log.pid))
						except:
							pass

					script_ok = True
					
				###########################################################################	
				# END OF SIMULATOR COMMAND	
				###########################################################################			
				
				#
				# this command is run for installing an app on device or packaging for adhoc distribution
				#
				elif command in ['install', 'adhoc']:

					debugstr = ''
					if debughost:
						debugstr = 'DEBUGGER_ENABLED=1'
						
					args += [
						"GCC_PREPROCESSOR_DEFINITIONS=DEPLOYTYPE=test TI_TEST=1 %s %s" % (debugstr, kroll_coverage),
						"PROVISIONING_PROFILE=%s" % appuuid
					]

					if command == 'install':
						args += ["CODE_SIGN_IDENTITY=iPhone Developer: %s" % dist_name]
					elif command == 'adhoc':
						args += ["CODE_SIGN_IDENTITY=iPhone Distribution: %s" % dist_name]

					if dist_keychain is not None:
						args += ["OTHER_CODE_SIGN_FLAGS=--keychain %s" % dist_keychain]

					args += ["DEPLOYMENT_POSTPROCESSING=YES"]

					execute_xcode("iphoneos%s" % iphone_version,args,False)
					
					if command == 'install':
						print "[INFO] Installing application in iTunes ... one moment"
						sys.stdout.flush()

					dev_path = run.run(['xcode-select','-print-path'],True,False).rstrip()
					package_path = os.path.join(dev_path,'Platforms/iPhoneOS.platform/Developer/usr/bin/PackageApplication')

					if os.path.exists(package_path):
						o.write("+ Preparing to run %s\n"%package_path)
						output = run.run([package_path,app_dir],True)
						o.write("+ Finished running %s\n"%package_path)
						if output: o.write(output)

					# for install, launch itunes with the app
					ipa = os.path.join(os.path.dirname(app_dir),"%s.ipa" % name)
					o.write("+ IPA file should be at %s\n" % ipa);

					# it appears that sometimes this command above fails on certain installs
					# or is missing. let's just open if we have it otherwise, open the app 
					# directory
					if not os.path.exists(ipa):
						# just open the app dir itself
						o.write("+ IPA didn't exist at %s\n" % ipa)
						o.write("+ Will try and open %s\n" % app_dir)
						ipa = app_dir
					
					if command == 'install':
						# to force iTunes to install our app, we simply open the IPA
						# file in itunes
						cmd = "open -b com.apple.itunes \"%s\"" % ipa
						o.write("+ Executing the command: %s\n" % cmd)
						os.system(cmd)
						o.write("+ After executing the command: %s\n" % cmd)

						# now run our applescript to tell itunes to sync to get
						# the application on the phone
						ass = os.path.join(template_dir,'itunes_sync.scpt')
						cmd = "osascript \"%s\"" % ass
						o.write("+ Executing the command: %s\n" % cmd)
						os.system(cmd)
						o.write("+ After executing the command: %s\n" % cmd)

						print "[INFO] iTunes sync initiated"

						o.write("Finishing build\n")
					
					sys.stdout.flush()
					script_ok = True
					
					run_postbuild()
					
				###########################################################################	
				# END OF INSTALL/ADHOC COMMAND	
				###########################################################################	

				#
				# this command is run for packaging an app for distribution
				#
				elif command == 'distribute':

					deploytype = "production"

					args += [
						"GCC_PREPROCESSOR_DEFINITIONS=DEPLOYTYPE=%s TI_PRODUCTION=1" % deploytype,
						"PROVISIONING_PROFILE=%s" % appuuid,
						"CODE_SIGN_IDENTITY=iPhone Distribution: %s" % dist_name,
						"DEPLOYMENT_POSTPROCESSING=YES"
					]

					if dist_keychain is not None:
						args += ["OTHER_CODE_SIGN_FLAGS=--keychain %s" % dist_keychain]
					
					execute_xcode("iphoneos%s" % iphone_version,args,False)

					# switch to app_bundle for zip
					os.chdir(build_dir)
					distribute_xc4(name, applogo, o)

					# open xcode + organizer after packaging
					# Have to force the right xcode open...
					xc_path = run.run(['xcode-select','-print-path'],True,False).rstrip()
					xc_app_index = xc_path.find('/Xcode.app/')
					if (xc_app_index >= 0):
						xc_path = xc_path[0:xc_app_index+10]
					else:
						xc_path = os.path.join(xc_path,'Applications','Xcode.app')
					o.write("Launching xcode: %s\n" % xc_path)
					os.system('open -a %s' % xc_path)
					
					ass = os.path.join(template_dir,'xcode_organizer.scpt')
					cmd = "osascript \"%s\"" % ass
					os.system(cmd)
					
					o.write("Finishing build\n")
					script_ok = True
					
					run_postbuild()

				###########################################################################	
				# END OF DISTRIBUTE COMMAND	
				###########################################################################	

			finally:
				os.chdir(cwd)
		except:
			print "[ERROR] Error: %s" % traceback.format_exc()
			if not script_ok:
				o.write("\nException detected in script:\n")
				traceback.print_exc(file=o)
				sys.exit(1)
		finally:
			if command not in ("xcode") and "run_finalize" in locals():
				run_finalize()
			o.close()

if __name__ == "__main__":
	main(sys.argv)
	sys.exit(0)

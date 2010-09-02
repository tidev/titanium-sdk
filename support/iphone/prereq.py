#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Check the prerequisites for iPhone development
#

import os, sys, subprocess, re, types
import json, run, tempfile, codecs

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

# sort by the latest version first
def version_sort(a,b):
	x = float(a[0:2]) # ignore more than 2 places
	y = float(b[0:2]) # ignore more than 2 places
	if x > y:
		return -1
	if x < y:
		return 1
	return 0
	
def get_sdks():
	found = []
	ipad = False
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
					major = int(ver[0])
					if major>=3 and ver!='3.0':
						found.append(ver)
					# ipad is anything 3.2+
					if major>3 or ver.startswith('3.2'):
						ipad=True
						
	return (sorted(found,version_sort),ipad)
	
def check_iphone3():
	try:
		found,ipad = get_sdks()		
		if len(found) > 0:
			sys.stdout.write('{"success":true, "sdks":[')
			c = 0
			for name in found:
				sys.stdout.write(('"%s"' % name))
				if c+1 < len(found):
					sys.stdout.write(",")
				c+=1
			ipadstr = 'false'
			if ipad:
				ipadstr='true'
			sys.stdout.write('],"ipad":%s}'%ipadstr)
			print
			sys.exit(0)
		else:				
			print '{"success":false,"message":"Missing iPhone SDK which supports 3.1+"}'
			sys.exit(2)

		
	except Exception, e:
		print '{"success":false,"message":"Missing Apple XCode"}'
		sys.exit(1)

def check_itunes_version(props):
	ver = run.run(['/usr/libexec/PlistBuddy','-c','Print :CFBundleVersion','/Applications/iTunes.app/Contents/version.plist'],True,False)
	ver = ver.strip()
	props['itunes_version']=ver
	props['itunes']=False
	props['itunes_message']=None
	if ver:
		toks = ver.split('.')
		major = toks[0]
		minor = toks[1]
		if (major == 8 and minor >= 2) or major > 8:
			props['itunes']=True
			return
	props['itunes_message'] = 'iTunes 8.2 or later required. You have %s' % ver		

def check_for_wwdr(props,line):
	if len(re.findall('Apple Worldwide Developer Relations Certification Authority',line)) > 0:
		props['wwdr']=True
		props['wwdr_message']=None
	
def check_for_iphone_dev(props,line):
	m = re.search(r'\"iPhone Developer: (.*)\"',line)
	if not m == None:
		name = m.group(1).strip()
		name = name.decode('string_escape').decode('utf-8')
		props['iphone_dev']=True
		if props.has_key('iphone_dev_name'):
			try:
				props['iphone_dev_name'].index(name)
			except:
				props['iphone_dev_name'].append(name)
		else:
			props['iphone_dev_name']=[name]
		props['iphone_dev_message']=None

def check_for_iphone_dist(props,line):
	m = re.search(r'\"iPhone Distribution: (.*)\"',line)
	if not m == None:
		name = m.group(1).strip()
		name = name.decode('string_escape').decode('utf-8')
		props['iphone_dist']=True
		if props.has_key('iphone_dist_name'):
			try:
				props['iphone_dist_name'].index(name)
			except:
				props['iphone_dist_name'].append(name)
		else:
			props['iphone_dist_name']=[name]
		props['iphone_dist_message']=None
	
def check_certs(props):
	props['wwdr']=False
	props['wwdr_message'] = "Missing the Apple WWDR intermediate certificate."
	props['iphone_dist']=False
	props['iphone_dev']=False
	props['iphone_dist_message'] = 'Missing iPhone Distribution Certificate'
	props['iphone_dev_message'] = 'Missing iPhone Developer Certificate'
	output = run.run(['security','dump-keychain'],False,False)
# FOR TESTING ONLY
#	output = open(os.path.expanduser("~/Downloads/distribution_only_out.txt")).read()
	for i in output.split('\n'):
		check_for_wwdr(props,i)
		check_for_iphone_dev(props,i)
		check_for_iphone_dist(props,i)

	
def check_for_package():
	props = {}
	check_itunes_version(props)
	check_certs(props)
	sdks,ipad = get_sdks()
	props['sdks']=sdks
	props['ipad']=ipad
	print json.encode(props).encode('utf-8')
			
def main(args):
	if len(args)!=2:
		print "Usage: %s <project|package>" % os.path.basename(args[0])
		sys.exit(1)

	if args[1] == 'project':
		check_iphone3()
	else:
		check_for_package()	
		
	sys.exit(0)

if __name__ == "__main__":
	main(sys.argv)


# FOR TESTING
#check_for_package()
#check_iphone3()


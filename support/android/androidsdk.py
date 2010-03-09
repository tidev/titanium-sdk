#!/usr/bin/python
#
# An autodetection utility for the Android SDK
#

import os, sys, platform, glob

android_api_levels = {
	3: 'android-1.5',
	4: 'android-1.6',
	5: 'android-2.0',
	6: 'android-2.0.1',
	7: 'android-2.1'
}

class AndroidSDK:
	def get_dir(self, envKey, default, supplied):
		if envKey in os.environ:
			return os.environ[envKey]
		
		if supplied is not None:
			return supplied
			
		return default
	
	def __init__(self, android_sdk, api_level):
		if platform.system() == 'Windows':
			default_android_sdk = 'C:\\android-sdk'
		else:
			default_android_sdk = '/opt/android-sdk'
			
		self.android_sdk = self.get_dir('ANDROID_SDK', default_android_sdk, android_sdk)
		self.api_level = api_level
		
		self.find_platform_dir()
		self.find_google_apis_dir()

	def find_dir(self, version, prefix):
		dirs = glob.glob(os.path.join(self.android_sdk, prefix+str(version)+"*"))
		if len(dirs) > 0:
			#grab the first.. good enough?
			return dirs[0]
		
		return None
		
	def find_platform_dir(self):
		platform_dir = self.find_dir(self.api_level, os.path.join('platforms', 'android-'))
		if platform_dir is None:
			old_style_dir = os.path.join(self.android_sdk, 'platforms', android_api_levels[self.api_level])
			if os.path.exists(old_style_dir):
				platform_dir = old_style_dir
		self.platform_dir = platform_dir
	
	def find_google_apis_dir(self):
		self.google_apis_dir = self.find_dir(self.api_level, os.path.join('add-ons', 'google_apis-'))
		
	def get_maps_jar(self):
		if self.google_apis_dir is not None:
			return os.path.join(self.google_apis_dir, "libs", "maps.jar")
		return None
	
	def get_android_jar(self):
		if self.platform_dir is not None:
			return os.path.join(self.platform_dir, "android.jar")
		return None
	
	def get_android_sdk(self):
		return self.android_sdk
	
	def get_platform_dir(self):
		return self.platform_dir
	
	def get_google_apis_dir(self):
		return self.google_apis_dir
	
	def get_platform_tools_dir(self):
		if self.platform_dir is not None:
			return os.path.join(self.platform_dir, 'tools')
		return None
	
	def get_api_level(self):
		return self.api_level
	
	def get_tool(self, topdir, tool):
		if topdir is not None:
			tool_path = os.path.join(topdir, 'tools', tool)
			if platform.system() == "Windows":
				if os.path.exists(tool_path+".exe"): return tool_path+".exe"
				elif os.path.exists(tool_path+".bat"): return tool_path+".bat"
				else: return None
			return tool_path
		return None
	
	def get_dx(self):
		return self.get_tool(self.platform_dir, 'dx')
	
	def get_dx_jar(self):
		if self.platform_dir is not None:
			return os.path.join(self.platform_dir, 'tools', 'lib', 'dx.jar')
		return None
	
	def get_aapt(self):
		return self.get_tool(self.platform_dir, 'aapt')
	
	def get_apkbuilder(self):
		return self.get_tool(self.android_sdk, 'apkbuilder')
	
	def get_android(self):
		return self.get_tool(self.android_sdk, 'android')
	
	def get_emulator(self):
		return self.get_tool(self.android_sdk, 'emulator')
	
	def get_adb(self):
		return self.get_tool(self.android_sdk, 'adb')
	
	def get_mksdcard(self):
		return self.get_tool(self.android_sdk, 'mksdcard')
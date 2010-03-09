#!/usr/bin/python

import os, sys, platform, glob

android_platforms = {
	'1.6': ['android-1.6', 'android-4']
}

google_apis = {
	'r4': ['google_apis-4_r01', 'google_apis-4_r02']
}

class AndroidSDK:
	def get_dir(self, envKey, default, supplied):
		if envKey in os.environ:
			return os.environ[envKey]
		
		if supplied is not None:
			return supplied
			
		return default
	
	def __init__(self, android_sdk=None):
		if platform.system() == 'Windows':
			default_android_sdk = 'C:\\android-sdk'
		else:
			default_android_sdk = '/opt/android-sdk'
			
		self.android_sdk = self.get_dir('ANDROID_SDK', default_android_sdk, android_sdk)

	def find_dir(self, version, prefix, map):
		if version not in map:
			return None
	
		dirs = map[version]
		for dir in dirs:
			d = os.path.join(self.android_sdk, prefix, dir)
			if os.path.exists(d):
				return d
		return None
		
	def find_platform_dir(self, version):
		return self.find_dir(version, 'platforms', android_platforms)
	
	def find_google_apis_dir(self, version):
		return self.find_dir(version, 'add-ons', google_apis)
		
	def find_maps_jar(self, version):
		google_apis_dir = self.find_google_apis_dir(version)
		if google_apis_dir is not None:
			return os.path.join(google_apis_dir, "libs", "maps.jar")
	
	def find_android_jar(self, version):
		platform_dir = self.find_platform_dir(version)
		if platform_dir is not None:
			return os.path.join(platform_dir, "android.jar")
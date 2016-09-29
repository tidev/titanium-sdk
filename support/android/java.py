#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Appcelerator Titanium Mobile
# Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Cross-platform helper to find java and its bin utilities. Code was
# originally in builder.py but ripped out to be used by other scripts
# as well.

import os, platform

def find_java_commands():
	jarsigner = None
	keytool = None
	javac = None
	java = None
	environ_java_home = None

	if os.environ.has_key("JAVA_HOME") and os.path.exists(os.environ["JAVA_HOME"]):
		environ_java_home = os.environ["JAVA_HOME"]

	java_home = environ_java_home

	if platform.system() != "Windows":
		# For Mac and Nix systems we just use the
		# command name by itself.
		jarsigner = "jarsigner"
		keytool = "keytool"
		javac = "javac"
		java = "java"
	else:
		# Windows
		if java_home:
			home_jarsigner = os.path.join(java_home, "bin", "jarsigner.exe")
			home_keytool = os.path.join(java_home, "bin", "keytool.exe")
			home_javac = os.path.join(java_home, "bin", "javac.exe")
			home_java = os.path.join(java_home, "bin", "java.exe")

			if os.path.exists(home_jarsigner):
				jarsigner = home_jarsigner

			if os.path.exists(home_keytool):
				keytool = home_keytool

			if os.path.exists(home_javac):
				javac = home_javac

			if os.path.exists(home_java):
				java = home_java

		else:
			for path in os.environ['PATH'].split(os.pathsep):
				if os.path.exists(os.path.join(path, 'jarsigner.exe')) and os.path.exists(os.path.join(path, 'javac.exe')):
					jarsigner = os.path.join(path, 'jarsigner.exe')
					keytool = os.path.join(path, 'keytool.exe')
					javac = os.path.join(path, 'javac.exe')
					java = os.path.join(path, 'java.exe')
					java_home = os.path.dirname(os.path.dirname(self.javac))
					break

	return {
			"environ_java_home": environ_java_home,
			"java_home": java_home,
			"java": java,
			"javac": javac,
			"keytool": keytool,
			"jarsigner": jarsigner
			}

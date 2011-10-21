#!/usr/bin/env python
import os, sys, mobilesdk
import shutil, time, json
import xml.dom.minidom

class PluginsTest(mobilesdk.MobileSDKTest):
	# Tests TIMOB-4904, and "compile" for external build plugins
	def testPluginFunctions(self):
		self.createProject("pluginTest", "iphone")

		testPlugin = os.path.join(os.path.dirname(os.path.abspath(__file__)), "testResources", "testPlugin.py")
		pluginDir = os.path.join(self.projectDir, "plugins", "testPlugin")
		os.makedirs(pluginDir)

		tiappPath = os.path.join(self.projectDir, "tiapp.xml")
		tiapp = xml.dom.minidom.parse(tiappPath)
		pluginsEl = tiapp.createElement("plugins")
		pluginEl = tiapp.createElement("plugin")
		pluginEl.setAttribute("version", "0.1")
		pluginName = tiapp.createTextNode("testPlugin")
		pluginEl.appendChild(pluginName)
		pluginsEl.appendChild(pluginEl)

		tiapp.documentElement.appendChild(pluginsEl)
		f = open(tiappPath, "w")
		tiapp.writexml(f)
		f.close()

		shutil.copy(testPlugin, os.path.join(pluginDir, "plugin.py"))
		self.buildIOSProject()

		pluginCompile = os.path.join(self.projectDir, "plugin_compile.json")
		self.assertTrue(os.path.exists(pluginCompile))
		compileData = json.loads(open(pluginCompile, "r").read())

		for key in ("platform", "devicefamily", "simtype",
			"project_dir", "titanium_dir", "appid", "iphone_version",
			"template_dir", "project_name", "command",
			"build_dir", "app_name", "app_dir", "deploytype",
			"iphone_dir"):
			self.assertTrue(key in compileData)

		self.assertEqual(compileData["project_dir"], self.projectDir)
		pluginPostBuild = os.path.join(self.projectDir, "plugin_postbuild.txt")
		self.assertTrue(os.path.exists(pluginPostBuild))

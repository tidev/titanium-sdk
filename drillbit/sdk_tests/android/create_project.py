#!/usr/bin/env python
import os, sys, mobilesdk

class CreateProject(mobilesdk.MobileSDKTest):
	def testCreateWithProjectScript(self):
		self.createProject("androidProject", "android")

		self.tiappXml = os.path.join(self.projectDir, 'tiapp.xml')
		self.manifest = os.path.join(self.projectDir, 'manifest')
		self.assertTrue(os.path.exists(self.tiappXml))
		# TODO: enable me
		# self.assertTrue(os.path.exists(self.manifest))

		self.resourcesDir = os.path.join(self.projectDir, 'Resources')
		self.appJs = os.path.join(self.resourcesDir, 'app.js')
		self.assertTrue(os.path.exists(self.resourcesDir))
		self.assertTrue(os.path.exists(self.appJs))
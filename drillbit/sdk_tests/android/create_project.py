#!/usr/bin/env python
import os, sys, mobilesdk

class CreateProject(mobilesdk.MobileSDKTest):
	def setUp(self):
		super(CreateProject, self).setUp()
		self.project_name = 'android_project'
		self.project_id = 'org.appcelerator.drillbit.android_project'

	def testCreateWithProjectScript(self):
		p = self.pythonProcess([self.project_script,
			self.project_name, self.project_id, self.test_dir,
			'android', self.android_sdk])
		p.communicate()
		self.assertEqual(p.returncode, 0)

		self.project_dir = os.path.join(self.test_dir, self.project_name)
		self.assertTrue(os.path.exists(self.project_dir))

		self.tiapp_xml = os.path.join(self.project_dir, 'tiapp.xml')
		self.manifest = os.path.join(self.project_dir, 'manifest')
		self.assertTrue(os.path.exists(self.tiapp_xml))
		#self.assertTrue(os.path.exists(self.manifest))

		self.resources_dir = os.path.join(self.project_dir, 'Resources')
		self.app_js = os.path.join(self.resources_dir, 'app.js')
		self.assertTrue(os.path.exists(self.resources_dir))
		self.assertTrue(os.path.exists(self.app_js))
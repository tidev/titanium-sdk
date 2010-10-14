#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# tiapp parser
# 
import os, types, uuid
import codecs, time, sys
from xml.dom.minidom import parseString

def getText(nodelist):
    rc = ""
    for node in nodelist:
        if node.nodeType == node.TEXT_NODE:
            rc = rc + node.data
    return rc

class TiWindow(object):
	def __init__(self,properties):
		self.properties = properties

	def __repr__(self):
		i = None
		if self.properties.has_key('id'): i = self.properties['id']
		return '<TiWindow:%s>' % self.properties
		
	def get(self, key, defvalue=None):
		if self.properties.has_key(key):
			return self.properties[key]
		return defvalue
			

def get_window_properties(node):
	wp = None
	for w in node.childNodes:
		if w.nodeType == 1:
			if wp == None: wp = {}
			wp[w.nodeName]=getText(w.childNodes)
	return wp

			
class TiAppXML(object):
	def __init__(self,file):
		self.file = file
		self.dom = parseString(codecs.open(self.file,'r','utf-8','replace').read().encode('utf-8'))
		
		self.properties = {
			'id':None,
			'name':None,
			'version':'1.0',
			'copyright':'not specified',
			'publisher':'not specified',
			'description':'not specified',
			'url':'not specified',
			'icon':None,
			'analytics':'true',
			'modules' : []
		}
		self.app_properties = {}
		self.android = {}

		root = self.dom.getElementsByTagName("ti:app")
		children = root[0].childNodes
		self.windows = []
		for child in children:
			if child.nodeType == 1:
				# single window at the root <window>
				if child.nodeName == 'window':
					print "[WARN] window in tiapp.xml no longer supported. this will be ignored"
				# multiple windows rooted by <windows>
				elif child.nodeName == 'windows':
					print "[WARN] windows in tiapp.xml no longer supported. this will be ignored"
				# handle modules		
				elif child.nodeName == 'modules':
					for module in child.childNodes:
						if module.nodeType == 1:
							ver = module.getAttribute('version')
							name = getText(module.childNodes)
							self.properties['modules'].append({'name':name,'version':ver})
				elif child.nodeName == 'android':
					self.parse_android(child)
				elif child.nodeName == 'property':
					name = child.getAttribute('name')
					value = getText(child.childNodes)
					print "[TRACE] app property, %s : %s" % (name, value)
					self.app_properties[name] = value
					
				# properties of the app
				else:
					self.properties[child.nodeName]=getText(child.childNodes)
		
		# ensure we create a guid if the project doesn't already have one
		if not self.properties.has_key('guid'):
			guid = uuid.uuid4().hex
			self.properties['guid'] = guid
			n = self.dom.createElement("guid")
			n.appendChild(self.dom.createTextNode(guid))
			root[0].appendChild(n)
			root[0].appendChild(self.dom.createTextNode("\n"))
			self.dom.writexml(codecs.open(self.file, 'w+','utf-8','replace'), encoding="UTF-8")

	def parse_android(self, node):
		def parse_permissions(node):
			if not 'permissions' in self.android:
				self.android['permissions'] = []
			for child in node.childNodes:
				if child.nodeName == 'permission':
					self.android['permissions'].append(getText(child.childNodes))

		def parse_screens(node):
			if not 'screens' in self.android:
				self.android['screens'] = {}
			screens = self.android['screens']
			for key in node.attributes.keys():
				screens[key] = self.to_bool(node.attributes.getNamedItem(key).value)

		def parse_activities(node):
			if not 'activities' in self.android:
				self.android['activities'] = {}
			activities = self.android['activities']
			for child in node.childNodes:
				if child.nodeName == 'activity':
					name = getText(child.childNodes)
					if not name in activities:
						activities[name] = {}
					activity = activities[name]
					activity['name'] = name
					for attr in child.attributes.keys():
						activity[attr] = child.attributes.getNamedItem(attr).value

		def parse_services(node):
			if not 'services' in self.android:
				self.android['services'] = {}
			services = self.android['services']
			for child in node.childNodes:
				if child.nodeName == 'service':
					name = getText(child.childNodes)
					if not name in services:
						services[name] = {}
					service = services[name]
					service['name'] = name
					for attr in child.attributes.keys():
						service[attr] = child.attributes.getNamedItem(attr).value

		for child in node.childNodes:
			if child.nodeName == 'permissions':
				parse_permissions(child)
			if child.nodeName == 'screens':
				parse_screens(child)
			if child.nodeName == 'activities':
				parse_activities(child)
			if child.nodeName == 'services':
				parse_services(child)

	def has_app_property(self, property):
		return property in self.app_properties
	
	def get_app_property(self, property):
		return self.app_properties[property]
	
	def to_bool(self, value):
		return value in ['true', 'True', 'TRUE', 'yes', 'Yes', 'YES', 'y', 't', '1']
	
	def setDeployType(self, deploy_type):
		found = False
		children = self.dom.getElementsByTagName("ti:app")[0].childNodes
		for child in children:
			if child.nodeType == 1 and child.nodeName == 'property' :
				if child.getAttributeNode('name').nodeValue == 'ti.deploytype' :
					child.firstChild.nodeValue = deploy_type
					found = True
					break

		if not found :
			root = self.dom.getElementsByTagName("ti:app")
			n = self.dom.createElement("property")
			n.setAttribute('name','ti.deploytype')
			n.appendChild(self.dom.createTextNode(deploy_type))
			root[0].appendChild(n)
			
		self.dom.writexml(codecs.open(self.file, 'w+','utf-8','replace'), encoding="UTF-8")

	def generate_infoplist(self,file,appid,family,project_dir,iphone_version):
		icon = 'appicon.png'
		if self.properties.has_key('icon'):
			icon = self.properties['icon']
	
		# we want the icon without the extension for the plist
		icon = os.path.splitext(icon)[0]
			
		self.infoplist_properties = {}	
		for p in self.properties:
			value = self.properties[p]
			if p=='persistent-wifi' and value=='true':
				self.infoplist_properties['UIRequiresPersistentWiFi']='<true/>'
			if p=='prerendered-icon' and value=='true':
				self.infoplist_properties['UIPrerenderedIcon']='<true/>'
			if p=='statusbar-hidden' and value=='true':
				self.infoplist_properties['UIStatusBarHidden']='<true/>'
			if p=='statusbar-style':
				if value == 'default' or value=='grey':
					status_bar_style = '<string>UIStatusBarStyleDefault</string>'
				elif value == 'opaque_black' or value == 'opaque' or value == 'black':
					status_bar_style = '<string>UIStatusBarStyleBlackOpaque</string>'
				elif value == 'translucent_black' or value == 'transparent' or value == 'translucent':
					status_bar_style = '<string>UIStatusBarStyleBlackTranslucent</string>'
				else:	
					status_bar_style = '<string>UIStatusBarStyleDefault</string>'
				self.infoplist_properties['UIStatusBarStyle']=status_bar_style
			
		plist = codecs.open(file,'r','utf-8','replace').read()
		plist = plist.replace('__APPICON__',icon)

		# replace the bundle id with the app id 
		# in case it's changed
		i = plist.index('CFBundleIdentifier')
		if i:
			i = plist.index('<string>',i+1)
			e = plist.index('</string>',i+1)
			st = plist[0:i+8]
			fn = plist[e:]
			plist = st + appid + fn


		# replace the version in case it's changed
		i = plist.index('CFBundleVersion')
		if i:
			i = plist.index('<string>',i+1)
			e = plist.index('</string>',i+1)
			st = plist[0:i+8]
			fn = plist[e:]
			version = self.properties['version']
			plist = st + version + fn

		i = plist.rindex('</dict>')	
		if i:
			before = plist[0:i]
			after = plist[i:]
			newcontent = ''
			for p in self.infoplist_properties:
				v = self.infoplist_properties[p]
				newcontent += '        <key>%s</key>\n        %s\n' %(p,v)
			plist = before + newcontent + after

		f = codecs.open(file,'w+','utf-8','replace')
		f.write(plist)
		f.close()
		
		return icon





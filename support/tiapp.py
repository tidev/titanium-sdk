#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# tiapp parser
# 
import os, types, uuid , fnmatch
import codecs, time, sys
from xml.dom.minidom import parseString
from StringIO import StringIO

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

def touch_tiapp_xml(tiapp_xml):
	print "[DEBUG] touching tiapp.xml to force rebuild next time: " + tiapp_xml
	os.utime(tiapp_xml, None)

			
class TiAppXML(object):
	def __init__(self, file, parse_only=False):
		self.file = file
		if isinstance(self.file, StringIO):
			data = self.file
		else:
			data = codecs.open(self.file,'r','utf-8','replace')
		
		self.dom = parseString(data.read().encode('utf-8'))
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
			'fullscreen':'true',
			'navbar-hidden':'false',
			'statusbar-hidden':'false',
			'modules' : [],
			'plugins' : []
		}
		self.explicit_properties = []
		self.app_properties = {}
		self.android = {}
		self.android_manifest = {}
		self.iphone = {}
		self.ios = {};
		
		root = self.dom.documentElement
		children = root.childNodes
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
							version = module.getAttribute('version')
							platform = module.getAttribute('platform')
							module_id = getText(module.childNodes)
							self.properties['modules'].append({
								'id': module_id,
								'version': version,
								'platform': platform
							})
				# handle plugins
				elif child.nodeName == 'plugins':
					for plugin in child.childNodes:
						if plugin.nodeType == 1:
							ver = plugin.getAttribute('version')
							name = getText(plugin.childNodes)
							self.properties['plugins'].append({'name':name,'version':ver})
				elif child.nodeName == 'android':
					self.parse_android(child)
				elif child.nodeName == 'iphone':
					self.parse_iphone(child)
				elif child.nodeName == 'ios':
					self.parse_ios(child)
				elif child.nodeName == 'property':
					name = child.getAttribute('name')
					value = getText(child.childNodes)
					print "[TRACE] app property, %s : %s" % (name, value)
					self.app_properties[name] = value
					
				# properties of the app
				else:
					self.properties[child.nodeName]=getText(child.childNodes)
					self.explicit_properties.append(child.nodeName)
		
		# ensure we create a guid if the project doesn't already have one
		if not parse_only and not self.properties.has_key('guid'):
			guid = uuid.uuid4().hex
			self.properties['guid'] = guid
			n = self.dom.createElement("guid")
			n.appendChild(self.dom.createTextNode(guid))
			root.appendChild(n)
			root.appendChild(self.dom.createTextNode("\n"))
			self.dom.writexml(codecs.open(self.file, 'w+','utf-8','replace'), encoding="UTF-8")

	def parse_android(self, node):
		def get_text(node): return getText(node.childNodes)
		
		def lazy_init(name, value, map=self.android, set_name=False):
			if not name in map: map[name] = value
			if set_name: map[name]['name'] = name
			return map[name]
		
		def add_attrs(map, element, fn=None):
			for attr in element.attributes.keys():
				value = element.getAttribute(attr)
				if fn != None: value = fn(value)
				map[attr] = value
		
		def parse_manifest(node):
			# android:manifest XML gets copied to the AndroidManifest.xml under the top level <manifest>
			# anything under <application> will also get copied into the manifest's <application>
			for child in node.childNodes:
				if child.nodeType != child.ELEMENT_NODE: continue
				if child.nodeName == 'application':
					if 'application' not in self.android_manifest:
						self.android_manifest['application'] = []
					application = self.android_manifest['application']
					application.extend([n for n in child.childNodes if n.nodeType == n.ELEMENT_NODE])
					self.android_manifest['application-attributes'] = child.attributes
					continue
				
				if 'manifest' not in self.android_manifest:
					self.android_manifest['manifest'] = []
				manifest = self.android_manifest['manifest']
				manifest.append(child)
			if node.attributes.length > 0:
				self.android_manifest['manifest-attributes'] = node.attributes

		def get_url_based_classname(url, appendage):
			parts = url.split('/')
			if len(parts) == 0: return None
			
			start = 0
			if parts[0] == "app:" and len(parts) >= 3:
				start = 2
			
			classname = '_'.join(parts[start:])
			if classname.endswith('.js'):
				classname = classname[:-3]
			
			if len(classname) > 1:
				classname = classname[0:1].upper() + classname[1:]
			else: classname = classname.upper()
			
			escape_chars = ['\\', '/', ' ', '.', '$', '&', '@']
			for escape_char in escape_chars:
				classname = classname.replace(escape_char, '_')
			return classname+appendage

		def get_activity_classname(url):
			return get_url_based_classname(url, 'Activity')

		def get_service_classname(url):
			return get_url_based_classname(url, 'Service')

		def parse_activities(node):
			activities = lazy_init('activities', {})
			for activity_el in node.getElementsByTagName('activity'):
				if activity_el.hasAttribute('url'):
					url = activity_el.getAttribute('url')
				else:
					url = get_text(activity_el)
				activity = lazy_init(url, {}, activities)
				activity['url'] = url
				add_attrs(activity, activity_el)
				activity['classname'] = get_activity_classname(url)
				for child in activity_el.childNodes:
					if child.nodeType != child.ELEMENT_NODE:
						continue
					if 'nodes' not in activity:
						activity['nodes'] = []
					nodes = activity['nodes']
					nodes.append(child)

		def parse_services(node):
			services = lazy_init('services', {})
			for service_el in node.getElementsByTagName('service'):
				if service_el.hasAttribute('url'):
					url = service_el.getAttribute('url')
				else:
					url = get_text(service_el)
				service_type = 'standard'
				if service_el.hasAttribute('type'):
					service_type = service_el.getAttribute('type')
				service = lazy_init(url, {}, services)
				service['url'] = url
				service['service_type'] = service_type
				add_attrs(service, service_el)
				service['classname'] = get_service_classname(url)
				for child in service_el.childNodes:
					if child.nodeType != child.ELEMENT_NODE:
						continue
					if 'nodes' not in service:
						service['nodes'] = []
					nodes = service['nodes']
					nodes.append(child)

		def parse_tool_api_level(node):
			lazy_init('tool-api-level', get_text(node))

		def parse_abi(node):
			lazy_init('abi', get_text(node))


		local_objects = locals()
		parse_tags = ['services', 'activities', 'manifest', 'tool-api-level', 'abi']
		for child in node.childNodes:
			if child.nodeName in parse_tags:
				local_objects['parse_'+child.nodeName.replace('-', '_')](child)

	def parse_iphone(self, node):
		def translate_orientation(orientation):
			info = orientation.split('.')
			tokenMap = {'PORTRAIT':'UIInterfaceOrientationPortrait',
						'UPSIDE_PORTRAIT':'UIInterfaceOrientationPortraitUpsideDown',
						'LANDSCAPE_LEFT':'UIInterfaceOrientationLandscapeLeft',
						'LANDSCAPE_RIGHT':'UIInterfaceOrientationLandscapeRight'}
			
			for token in tokenMap:
				if token in info:
					return tokenMap[token]
			return None

		def parse_orientations(node):
			device = node.getAttribute('device').lower()
			orientations = []
			if (device == None):
				print "[WARN] Orientations for unspecified device; assuming iphone"
				device = 'iphone'
			if device != 'iphone' and device != 'ipad':
				print "[WARN] Unrecognized device %s for iphone, ignoring" % device
				return
			for child in node.childNodes:
				if (child.nodeName == 'orientation'):
					orientation = translate_orientation(getText(child.childNodes))
					if orientation == None:
						print "[WARN] Unrecognized orientation %s: Ignoring" % getText(node.childNodes)
					else:
						orientations.append(orientation)
			self.iphone['orientations_'+device] = orientations
		
		def parse_backgroundModes(node):
			valid_modes = ['audio', 'location', 'voip']
			self.iphone['background'] = []
			for child in node.childNodes:
				if child.nodeName == 'mode':
					mode = getText(child.childNodes)
					if mode not in valid_modes:
						print "[WARN] Invalid background mode %s: ignoring" % mode
						continue
					self.iphone['background'].append(mode)
		
		def parse_requires(node):
			# Note that some of these are meaningless right now, but are
			# included for The Future.
			valid_reqs = ['telephony', 'wifi', 'sms', 'still-camera', 
						  'auto-focus-camera', 'front-facing-camera',
						  'camera-flash', 'video-camera', 'accelerometer',
						  'gyroscope', 'location-services', 'gps', 'magnetometer',
						  'gamekit', 'microphone', 'opengles-1', 'opengles-2',
						  'armv6', 'armv7', 'peer-peer']
			self.iphone['requires'] = []
			for child in node.childNodes:
				if child.nodeName == 'feature':
					feature = getText(child.childNodes)
					if feature not in valid_reqs:
						print "[WARN] Invalid feature %s: ignoring" % feature
						continue
					self.iphone['requires'].append(feature)
		
		def parse_type(node):
			valid_tags = ['name', 'icon', 'uti', 'owner']
			type_info = { 'name':'', 'icon':'', 'uti':[], 'owner':False }
			for child in node.childNodes:
				if child.nodeName in valid_tags:
					value = getText(child.childNodes)
					if child.nodeName == 'uti':
						value = value.split(',')
					elif child.nodeName == 'owner':
						value = self.to_bool(value)
					type_info[child.nodeName] = value
						
			self.iphone['types'].append(type_info)
		
		def parse_fileTypes(node):
			self.iphone['types'] = []
			for child in node.childNodes:
				if child.nodeName == 'type':
					parse_type(child)
		
		
		local_objects = locals()
		parse_tags = ['orientations', 'backgroundModes', 'requires', 'fileTypes']
		for child in node.childNodes:
			if child.nodeName in parse_tags:
				local_objects['parse_'+child.nodeName](child)

	def parse_ios(self, node):
		def getText(nodelist):
		    rc = []
		    for node in nodelist:
		        if node.nodeType == node.TEXT_NODE:
		            rc.append(node.data)
		    return ''.join(rc)
		
		ignore_keys = ['CFBundleDisplayName', 'CFBundleExecutable', 'CFBundleIconFile',
				'CFBundleIdentifier', 'CFBundleInfoDictionaryVersion', 'CFBundleName', 'CFBundlePackageType', 'CFBundleSignature',
				'CFBundleVersion', 'CFBundleShortVersionString', 'LSRequiresIPhoneOS']
		
		for child in node.childNodes:
			if child.nodeName == 'plist':
				plist_dict = child.getElementsByTagName('dict')[0]
				plist = {}
				keyName = ''
				for e in plist_dict.childNodes:
					if e.nodeName == 'key':
						keyName = getText(e.childNodes)
						if keyName in ignore_keys:
							print "[WARN] Skipping key %s from tiapp.xml <plist>" % keyName
							keyName = ''
					elif e.nodeType == e.ELEMENT_NODE and keyName != '':
						if keyName == 'CFBundleURLTypes':
							types_string = ''
							for ee in e.getElementsByTagName('dict'):
								types_string = types_string + ee.toxml('utf-8')
							plist['+'+keyName] = types_string
						elif keyName == 'CFBundleDevelopmentRegion':
							plist['+'+keyName] = e.toxml('utf-8');
						else:
							plist[keyName] = e.toxml('utf-8')
						keyName = ''
				self.ios['plist'] = plist
			elif child.nodeName == 'min-ios-ver':
				value = getText(child.childNodes)
				try:
					ios_version = float(value[0:3]) # Trim to x.x if possible
				except:
					print "[WARN] Could not parse <ios-min-ver> value %s as 'x.x' version: Setting to default" % value
					ios_version = 0.0 # Set to nonsense absolute minimum value
				self.ios['min-ios-ver'] = ios_version

	def has_app_property(self, property):
		return property in self.app_properties

	def get_app_property(self, property):
		return self.app_properties[property]

	def to_bool(self, value):
		return value in ['true', 'True', 'TRUE', 'yes', 'Yes', 'YES', 'y', 't', '1']
	
	def setDeployType(self, deploy_type):
		found = False
		children = self.dom.documentElement.childNodes
		for child in children:
			if child.nodeType == 1 and child.nodeName == 'property' :
				if child.getAttributeNode('name').nodeValue == 'ti.deploytype' :
					child.firstChild.nodeValue = deploy_type
					found = True
					break

		if not found :
			root = self.dom.documentElement
			n = self.dom.createElement("property")
			n.setAttribute('name','ti.deploytype')
			n.appendChild(self.dom.createTextNode(deploy_type))
			root.appendChild(n)
		self.app_properties['ti.deploytype'] = deploy_type
		self.dom.writexml(codecs.open(self.file, 'w+','utf-8','replace'), encoding="UTF-8")

	def generate_infoplist(self,file,appid,family,project_dir,iphone_version):
		icon = 'appicon.png'
		if self.properties.has_key('icon'):
			icon = self.properties['icon']
	
		# we want the icon without the extension for the plist
		iconname = os.path.splitext(icon)[0]
		
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

		for prop in self.iphone:
			if prop == 'orientations_iphone' or prop == 'orientations_ipad':
				propertyName = 'UISupportedInterfaceOrientations'
				if prop == 'orientations_ipad':
					propertyName += '~ipad'
				propertyValue = '\t<array>\n'
				for orientation in self.iphone[prop]:
					propertyValue += "\t\t<string>%s</string>\n" % orientation
				propertyValue += '\t</array>'
				self.infoplist_properties[propertyName]=propertyValue
			if prop == 'background':
				propertyName = 'UIBackgroundModes'
				propertyValue = '\t<array>\n'
				for mode in self.iphone[prop]:
					propertyValue += "\t\t<string>%s</string>\n" % mode
				propertyValue += '\t</array>'
				self.infoplist_properties[propertyName]=propertyValue
			if prop == 'requires':
				propertyName = 'UIRequiredDeviceCapabilities'
				propertyValue = '\t<array>\n'
				for feature in self.iphone[prop]:
					propertyValue += "\t\t<string>%s</string>\n" % feature
				propertyValue += '\t</array>'
				self.infoplist_properties[propertyName]=propertyValue
			if prop == 'types':
				propertyName = 'CFBundleDocumentTypes'
				propertyValue = '\t<array>\n'
				for type in self.iphone[prop]:
					propertyValue += '\t\t<dict>\n'
					propertyValue += "\t\t\t<key>CFBundleTypeName</key><string>%s</string>\n" % type['name']
					propertyValue += "\t\t\t<key>CFBundleTypeIconFiles</key><array><string>%s</string></array>\n" % type['icon']
					propertyValue += '\t\t\t<key>LSItemContentTypes</key>\n\t\t\t<array>'
					for uti in type['uti']:
						propertyValue += "\t\t\t\t<string>%s</string>" % uti
					propertyValue += '\t\t\t</array>\n'
					owner = 'Owner' if type['owner'] else 'Alternate'
					propertyValue += "\t\t\t<key>LSHandlerRank</key><string>%s</string>\n" % owner
					propertyValue += '\t\t</dict>\n'
				propertyValue += '\t</array>'
				
				self.infoplist_properties[propertyName]=propertyValue
		
		plist_props = {}
		if 'plist' in self.ios:
			plist_props = self.ios['plist']
		
		for prop in plist_props:
			if prop[0] != '+':
				self.infoplist_properties[prop] = plist_props[prop]
		
		plist = codecs.open(file,'r','utf-8','replace').read()
		plist = plist.replace('__APPICON__',iconname)

		if '+CFBundleURLTypes' in plist_props:
			i = plist.index('CFBundleURLTypes')
			if i:
				i = plist.index('<array>',i+1)
				st = plist[0:i+8]
				fn = plist[i+8:]
				plist = st + plist_props['+CFBundleURLTypes'] + fn
		
		# replace the development region from plist section
		if '+CFBundleDevelopmentRegion' in plist_props:
			i = plist.index('CFBundleDevelopmentRegion')
			if i:
				i = plist.index('<string>',i+1)
				e = plist.index('</string>',i+1)
				st = plist[0:i]
				fn = plist[e+9:]
				plist = st + plist_props['+CFBundleDevelopmentRegion'] + fn

		#Creating proper CFBundleIconFiles rather than hard coding the values in there
		propertyName = 'CFBundleIconFiles'
		propertyValue = '<array>\n'
		iconsdir1 = os.path.join(project_dir,'Resources','iphone')
		iconsdir2 = os.path.join(project_dir,'Resources')
		tempiconslist = sorted(os.listdir(iconsdir1))
		tempiconslist += sorted(os.listdir(iconsdir2))
		iconslist = list(set(sorted(tempiconslist)))
		iconorder = list([iconname+".png",iconname+"@2x.png",iconname+"-72.png",iconname+"-72@2x.png",iconname+"-Small-50.png",iconname+"-Small-50@2x.png",iconname+"-Small.png",iconname+"-Small@2x.png"])
		for type in iconorder:
			for nexticon in iconslist:
				if type == nexticon:
					propertyValue += "\t\t<string>%s</string>\n" % nexticon
		propertyValue += '\t</array>\n'
		self.infoplist_properties[propertyName]=propertyValue
		
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
						
		# replace the CFBundleShortVersionString in case it's changed
		try:
			i = plist.index('CFBundleShortVersionString')
			if i:
				i = plist.index('<string>',i+1)
				e = plist.index('</string>',i+1)
				st = plist[0:i+8]
				fn = plist[e:]
				CFBundleShortVersionString = self.properties['version']
				app_version_ = CFBundleShortVersionString.split('.')
				if(len(app_version_) > 3):
					CFBundleShortVersionString = app_version_[0]+'.'+app_version_[1]+'.'+app_version_[2]
				plist = st + CFBundleShortVersionString + fn
		except ValueError:
			print "[WARN] The project seems to be having custom info.plist which does not contain  the `CFBundleShortVersionString` key"
			print "[INFO] Generating the missing `CFBundleShortVersionString` key"
			propertyName = 'CFBundleShortVersionString'
			CFBundleShortVersionString = self.properties['version']
			app_version_ = CFBundleShortVersionString.split('.')
			if(len(app_version_) > 3):
				CFBundleShortVersionString = app_version_[0]+'.'+app_version_[1]+'.'+app_version_[2]
			propertyValue = "<string>"+CFBundleShortVersionString+'</string>'
			self.infoplist_properties[propertyName] = propertyValue
			
		i = plist.rindex('</dict>')	
		if i:
			before = plist[0:i]
			after = plist[i:]
			newcontent = ''
			for p in self.infoplist_properties:
				v = self.infoplist_properties[p]
				newcontent += '\t<key>%s</key>\n\t%s\n' %(p,v)
			plist = before + newcontent + after

		f = codecs.open(file,'w+','utf-8','replace')
		f.write(plist)
		f.close()
		
		return icon





#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# tiapp parser
# 
import os, types, uuid
import codecs
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
		self.dom = parseString(codecs.open(self.file,'r','utf-8').read().encode("utf-8"))
		
		self.properties = {
			'id':None,
			'name':None,
			'version':None,
			'copyright':None,
			'publisher':None,
			'url':None,
			'icon':None
		}
		
		root = self.dom.getElementsByTagName("ti:app")
		children = root[0].childNodes
		self.windows = []
		for child in children:
			if child.nodeType == 1:
				# single window at the root <window>
				if child.nodeName == 'window':
					wp = get_window_properties(child)
					if not wp == None: self.windows.append(TiWindow(wp))
				# multiple windows rooted by <windows>
				elif child.nodeName == 'windows':
					for window in child.childNodes:
						wp = get_window_properties(window)
						if not wp == None: self.windows.append(TiWindow(wp))	
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
			self.dom.writexml(codecs.open(self.file, "w+","utf-8"), encoding="UTF-8")
					
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
			
		self.dom.writexml(codecs.open(self.file, "w+","utf-8"), encoding="UTF-8")


#
# class for turning tiapp.xml into tiapp.plist
#
class TiPlist(object):
	def __init__(self,tiapp):
		self.tiapp = tiapp
		
	def make_window(self,window,index,status_bar_style):
		out = ' <dict>\n'
		for i in window.properties:
			value = window.properties[i]
			# these are special types mapping
			if index == 0 and i == 'fullscreen' and value == 'true':
				self.infoplist_properties['UIStatusBarHidden']='<true/>'
			if i=='orientation' and value == 'landscape':
				self.infoplist_properties['UIInterfaceOrientation']='<string>UIInterfaceOrientationLandscapeRight</string>'
			out+='  <key>UIStatusBarStyle</key>\n  %s\n' % status_bar_style
			if type(value)==types.StringType or type(value)==types.UnicodeType:
				out+="  <key>%s</key>\n  <string>%s</string>\n" %(i,window.properties[i])
			elif type(value)==types.ListType:
				out+="  <key>%s</key>\n" % i
				out+="  <array>\n"
				for v in window.properties[i]:
					out+="   <string>%s</string>\n" % v
				out+="  </array>\n"
		return out + ' </dict>\n'
		
	def generate_infoplist(self,file,template,appid):
		icon = 'appicon.png'
		if self.tiapp.properties.has_key('icon'):
			icon = self.tiapp.properties['icon']

		plist = codecs.open(template,'r','utf-8').read()
		plist = plist.replace('appicon.png',icon)
		
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
			version = self.tiapp.properties['version']
			plist = st + version + fn
			
		i = plist.rindex('</dict>')	
		if i:
			before = plist[0:i]
			after = plist[i:]
			newcontent = ''
			for p in self.infoplist_properties:
				v = self.infoplist_properties[p]
				newcontent += '     <key>%s</key>\n     %s\n' %(p,v)
			plist = before + newcontent + after
			
		f = codecs.open(file,'w+','utf-8')
		f.write(plist.encode("utf-8"))
		f.close()
		
		return icon
		
	def generate(self,modules,appid,deploytype):
		
		self.infoplist_properties = {}
		self.tiapp.properties['id']=appid
		self.tiapp.properties['deploytype']=deploytype
		
		out = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
"""

		status_bar_style = '<string>UIStatusBarStyleDefault</string>'

		for p in self.tiapp.properties:
			value = self.tiapp.properties[p]
			if not value == None:
				out+="  <key>%s</key>\n  <string>%s</string>\n" %(p,value)

			if p=='persistent-wifi' and value=='true':
				self.infoplist_properties['UIRequiresPersistentWiFi']='<true/>'
			if p=='prerendered-icon' and value=='true':
				self.infoplist_properties['UIPrerenderedIcon']='<true/>'
			if p=='statusbar-style':
				if value == 'default' or value=='grey':
					status_bar_style = '<string>UIStatusBarStyleDefault</string>'
				elif value == 'opaque_black':
					status_bar_style = '<string>UIStatusBarStyleBlackOpaque</string>'
				elif value == 'translucent_black':
					status_bar_style = '<string>UIStatusBarStyleBlackTranslucent</string>'
				else:	
					status_bar_style = '<string>UIStatusBarStyleDefault</string>'
				self.infoplist_properties['UIStatusBarStyle']=status_bar_style
			
		out+=" <key>startup</key>\n"
		
		if len(self.tiapp.windows) == 1:
			out+=self.make_window(self.tiapp.windows[0],0,status_bar_style)
		else:
			out+=" <array>\n"
			count=0
			for window in self.tiapp.windows:
				out+=self.make_window(window,count,status_bar_style)
				count+=1
			out+=" </array>\n"
				
		out+=""" <key>modules</key>
 <dict>
    %s
 </dict>
</dict>
</plist>""" % modules

		return out.encode("utf-8")


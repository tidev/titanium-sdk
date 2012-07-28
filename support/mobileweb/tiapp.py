#!/usr/bin/env python

import os, types, uuid, codecs, time, sys
from xml.dom.minidom import parseString

ignore_nodes = ['android', 'iphone', 'deployment-targets']

def getText(nodelist):
	rc = ''
	for node in nodelist:
		if node.nodeType == node.TEXT_NODE:
			rc = rc + node.data
	rc = rc.strip()
	if rc.lower() in ['true', 'yes', '1']:
		rc = 'true'
	elif rc in ['false', 'no', '0']:
		rc = 'false'
	return rc

class TiAppXML(dict):
	def __init__(self, xml_file, deploytype, parse_only=False):
		self['analytics'] = True
		self['modules'] = []
		self['build'] = {}
		self['properties'] = {}
		self['mobileweb'] = {
			'analytics': {
				'use-xhr': 'false'
			},
			'disable-error-screen': 'false',
			'filesystem': {
				'backend': 'Ti/_/Filesystem/Local',
				'registry': 'ondemand'
			},
			'map': {
				'backend': 'Ti/_/Map/Google',
				'apikey': ''
			},
			'splash': {
				'enabled': 'true',
				'inline-css-images': 'true'
			},
			'theme': 'default'
		}
		self['precache'] = {
			'images': [],
			'includes': [],
			'locales': [],
			'requires': []
		}
		self['unsupported-platforms'] = {}
		
		dom = parseString(codecs.open(xml_file,'r','utf-8','replace').read().encode('utf-8'))
		root = dom.documentElement
		
		for child in root.childNodes:
			if child.nodeType == 1 and child.nodeName not in ignore_nodes:
				if child.nodeName == 'modules':
					for module in child.childNodes:
						if module.nodeType == 1:
							platform = module.getAttribute('platform')
							if platform in ['', 'mobileweb', 'commonjs']:
								self['modules'].append({
									'id': getText(module.childNodes),
									'version': module.getAttribute('version'),
									'platform': platform
								})
				elif child.nodeName == 'mobileweb':
					for node in child.childNodes:
						if node.nodeType == 1:
							if node.nodeName == 'precache':
								for precache_node in node.childNodes:
									if precache_node.nodeType == 1:
										self[node.nodeName][precache_node.nodeName + 's'].append(getText(precache_node.childNodes))
							elif node.nodeName == 'build':
								for build_node in node.childNodes:
									if build_node.nodeType == 1 and build_node.nodeName == deploytype:
										for build_param_node in build_node.childNodes:
											if build_param_node.nodeType == 1:
												self[node.nodeName][build_param_node.nodeName] = getText(build_param_node.childNodes)
							elif node.nodeName in self['mobileweb']:
								if isinstance(self['mobileweb'][node.nodeName], dict):
									for subnode in node.childNodes:
										if subnode.nodeType == 1:
											if subnode.nodeName in self['mobileweb'][node.nodeName]:
												if isinstance(self['mobileweb'][node.nodeName][subnode.nodeName], dict):
													for subsubnode in subnode.childNodes:
														if subsubnode.nodeType == 1:
															self['mobileweb'][node.nodeName][subnode.nodeName][subsubnode.nodeName] = getText(subsubnode.childNodes)
												elif isinstance(self['mobileweb'][node.nodeName][subnode.nodeName], list):
													self['mobileweb'][node.nodeName][subnode.nodeName].append(getText(subnode.childNodes))
												else:
													self['mobileweb'][node.nodeName][subnode.nodeName] = getText(subnode.childNodes)
											else:
												self['mobileweb'][node.nodeName][subnode.nodeName] = getText(subnode.childNodes)
								elif isinstance(self['mobileweb'][node.nodeName], list):
									self['mobileweb'][node.nodeName].append(getText(node.childNodes))
								else:
									self['mobileweb'][node.nodeName] = getText(node.childNodes)
							else:
								self['mobileweb'][node.nodeName] = getText(node.childNodes)
				elif child.nodeName == 'property':
					self['properties'][child.getAttribute('name')] = {
						'type': child.getAttribute('type') or 'string',
						'value': getText(child.childNodes)
					}
				else:
					self[child.nodeName] = getText(child.childNodes)
		
		# ensure we create a guid if the project doesn't already have one
		if not parse_only and not self.has_key('guid'):
			guid = uuid.uuid4().hex
			self.guid = guid
			n = dom.createElement("guid")
			n.appendChild(dom.createTextNode(guid))
			root.appendChild(n)
			root.appendChild(dom.createTextNode("\n"))
			dom.writexml(codecs.open(xml_file, 'w+','utf-8','replace'), encoding="UTF-8")

#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 
# Appcelerator Titanium
# Licensed under the Apache Public License (version 2)
# see the main LICENSE for Appcelerator for more details
# 
# CSS parser and code generation
#
import css, csslex, cssyacc, ply
import os,codecs,time,types,sys

ignoreFiles = ['.gitignore', '.cvsignore']
ignoreDirs = ['.git','.svn', 'CVS']

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../../'))
sys.path.append(os.path.join(template_dir,'../'))

from tiapp import *

ANDROID_CLASS_TEMPLATE = """/**
 * Appcelerator Titanium
 * WARNING: This is a generated file.  Do not modify.
 */
package %s;

import java.util.HashMap;
import org.appcelerator.titanium.ITiStylesheet;
import org.appcelerator.titanium.TiDict;

public final class ApplicationStylesheet implements ITiStylesheet 
{
	private static final HashMap<String,HashMap<String,HashMap<String,Object>>> classesMap;
	private static final HashMap<String,HashMap<String,HashMap<String,Object>>> idsMap;
	private static final HashMap<String,HashMap<String,HashMap<String,HashMap<String,Object>>>> classesDensityMap;
	private static final HashMap<String,HashMap<String,HashMap<String,HashMap<String,Object>>>> idsDensityMap;

	static
	{
		classesMap = new HashMap<String,HashMap<String,HashMap<String,Object>>>();
		idsMap = new HashMap<String,HashMap<String,HashMap<String,Object>>>();
		classesDensityMap = new HashMap<String,HashMap<String,HashMap<String,HashMap<String,Object>>>>();
		idsDensityMap = new HashMap<String,HashMap<String,HashMap<String,HashMap<String,Object>>>>();
		
%s
%s
%s
%s
	}

	public final HashMap<String,Object> getStylesheet(String objectId, String type, String density, String basename)
	{
		HashMap<String,Object> result = new HashMap<String,Object>();
		if (classesMap!=null && classesMap.containsKey(basename))
		{
			HashMap<String,Object> r = classesMap.get(basename).get(type);
			if (r!=null) result.putAll(r);
		}
		if (classesDensityMap!=null && classesDensityMap.containsKey(basename))
		{
			HashMap<String,HashMap<String,Object>> r = classesDensityMap.get(basename).get(density);
			if (r!=null && r.containsKey(type)) 
			{
				HashMap<String,Object> r2 = r.get(type);
				if (r2!=null) result.putAll(r2);
			}
		}
		if (idsMap!=null && idsMap.containsKey(basename))
		{
			HashMap<String,Object> r = idsMap.get(basename).get(objectId);
			if (r!=null) result.putAll(r);
		}
		if (idsDensityMap!=null && idsDensityMap.containsKey(basename))
		{
			HashMap<String,HashMap<String,Object>> r = idsDensityMap.get(basename).get(density);
			if (r!=null && r.containsKey(objectId)) 
			{
				HashMap<String,Object> r2 = r.get(objectId);
				if (r2!=null) result.putAll(r2);
			}
		}
		return result;
	}
}

"""


__all__ = ('CSSCompiler')

CSS_MAPPINGS = {
	u'background-image':u'backgroundImage',
	u'background-url':u'backgroundImage',
	u'text-align':u'textAlign',
	u'border-radius':u'borderRadius',
	u'border-color':u'borderColor',
	u'border-width':u'borderWidth',
}


class CSSCompiler(object):
	
	def is_platform(self,key):
		if self.platform == 'iphone':
			return key == 'ios' or key == 'iphone'
		if self.platform == 'ipad':
			return key == 'ios' or key == 'ipad'
		return self.platform == key
	
	def __init__(self,dir,platform,appid):
		self.dir = dir
		self.platform = platform
		self.appid = appid
		self.files = {}
		
		for dirname,dirs,files in os.walk(dir):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)	# don't visit ignored directories			  
			for f in files:
				if f in ignoreFiles: continue
				if not f.endswith('.jss'): continue
				tok = f[0:-4].split('.')
				count = len(tok)
				if count > 1:
					if not self.is_platform(tok[1]): continue
				dict = {'platform':None,
						'density':{},
						'base':None}
				if self.files.has_key(tok[0]):
					dict = self.files[tok[0]]
				if count == 1:
					dict['base'] = os.path.join(dirname,f)
				elif count == 2:
					dict['platform'] = os.path.join(dirname,f)
				elif count == 3:
					dict['density'][tok[2]] = os.path.join(dirname,f)
				
				self.files[tok[0]] = dict
		
		self.classes = {}
		self.ids = {}
		self.classes_density = {}
		self.ids_density = {}
					
		for filepath in self.files:
			file_entry = self.files[filepath]
			classes = {}
			ids = {}
			classes_density = {}
			ids_density = {}
			if file_entry['base']!=None:
				self.fill_entries(file_entry['base'],classes,ids)
			if file_entry['platform']!=None:
				self.fill_entries(file_entry['platform'],classes,ids)
			if file_entry['density']!=None:
				for name in file_entry['density']:
					d = {}
					i = {}
					self.fill_entries(file_entry['density'][name],d,i)
					classes_density[name] = d
					ids_density[name] = i
			self.classes[filepath] = classes
			self.ids[filepath] = ids
			self.classes_density[filepath] = classes_density
			self.ids_density[filepath] = ids_density
		
		self.transform_properties()
		
		if self.platform == 'iphone' or self.platform == 'ipad' or self.platform == 'ios':
			self.code = self.generate_ios_code(self.classes,self.classes_density,self.ids,self.ids_density)
		elif self.platform == 'android':
			self.code = self.generate_android_code(self.classes,self.classes_density,self.ids,self.ids_density)
		elif self.platform == 'blackberry':
			self.code = self.generate_bb_code(self.classes,self.classes_density,self.ids,self.ids_density)
		
	def transform_fonts(self,dict):
		newdict = {}
		for key in dict:
			newdict[key] = {}
			for sel in dict[key]:
				font = None
				newdict[key][sel] = {}
				for prop in dict[key][sel]:
					value = dict[key][sel][prop]
					if prop.startswith('font-'):
						if newdict[key][sel].has_key('font'):
							font = newdict[key][sel]['font']
						else:
							font = {}
						toks = prop.split('-')
						newprop = toks[0] + toks[1].capitalize()
						font[newprop] = value
						newdict[key][sel]['font'] = font
					else:
						newdict[key][sel][prop]=value
		return newdict
				
	def transform_properties(self):
		self.classes = self.transform_fonts(self.classes)
		self.ids = self.transform_fonts(self.ids)
		self.classes_density = self.transform_fonts(self.classes_density)
		self.ids_density = self.transform_fonts(self.ids_density)
			
	def parse(self,data):
		parser = cssyacc.yacc()
		parser.lexer = csslex.lex()
		return parser.parse(data, debug=False)

	def create_ios_dict(self,hash):
		str = '<dict>\n'
		for classname in hash:
			str+='<key>%s</key>\n' % classname
			str+='<dict>\n'
			for key in hash[classname]:
				str+='<key>%s</key>\n' % key
				str+='<dict>\n'
				for subkey in hash[classname][key]:
					value = hash[classname][key][subkey]
					if type(value) == types.DictType:
						str+='<key>%s</key>\n' % subkey
						str+='<dict>\n'
						for k in value:
							str+='<key>%s</key>\n<string>%s</string>\n' % (k,value[k])
						str+='</dict>\n'
					else:
						str+='<key>%s</key>\n<string>%s</string>\n' % (subkey,value)
				str+='</dict>\n'
			str+='</dict>\n'
		str+='</dict>\n'
		return str
		
	def create_ios_density_dict(self,hash):
		str = '<dict>\n'
		for pathname in hash:
			str+='<key>%s</key>\n' % pathname
			str+='<dict>\n'
			for density in hash[pathname]:
				str+='<key>%s</key>\n' % density
				str+='<dict>\n'
				for classname in hash[pathname][density]:
					str+='<key>%s</key>\n' % classname
					str+='<dict>\n'
					for key in hash[pathname][density][classname]:
						value = hash[pathname][density][classname][key]
						if type(value)==types.DictType:
							str+='<key>%s</key>\n' % key
							str+='<dict>\n'
							for k in value:
								str+='<key>%s</key>\n<string>%s</string>\n' % (k,value[k])
							str+='</dict>\n'
						else:
							str+='<key>%s</key>\n<string>%s</string>\n' % (key,value)
				str+='</dict>\n' 
			str+='</dict>\n'
		str+='</dict>\n'
		return str

	def generate_ios_code(self,classes,classes_density,ids,ids_density):
		
		body = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
	<dict>
		<key>classes</key>
		%s
		<key>classes_density</key>
		%s
		<key>ids</key>
		%s
		<key>ids_density</key>
		%s
	</dict>
</plist>"""
		
		return body % (self.create_ios_dict(classes),
						self.create_ios_density_dict(classes_density),
						self.create_ios_dict(ids),
						self.create_ios_density_dict(ids_density))
		
	def generate_mapname(self):
		c = time.time()
		mapname = ("m%f" % c).replace('.','')
		return mapname
		
	def create_android_dict(self,hash,varname):
		str = ''
		for pathname in hash:
			mapname1 = self.generate_mapname()
			xcount = 0
			xstr='		HashMap<String,HashMap<String,Object>> %s = new HashMap<String,HashMap<String,Object>>();\n' % mapname1
			for classname in hash[pathname]:
				xcount+=1
				mapname = self.generate_mapname()
				xstr+='		HashMap<String,Object> %s = new HashMap<String,Object>();\n' % mapname
				xstr+='		%s.put("%s",%s);\n' % (mapname1,classname,mapname)
				for key in hash[pathname][classname]:
					value = hash[pathname][classname][key]
					if type(value) == types.DictType:
						# NOTE: only one level right now which is OK since it's just font
						dictname = self.generate_mapname()
						xstr+='		TiDict %s = new TiDict();\n' % (dictname)
						for k in value:
							v = value[k]
							xstr+='		%s.put("%s","%s");\n' % (dictname,k,v)
						xstr+='		%s.put("%s",%s);\n' % (mapname,key,dictname)
					else:
						xstr+='		%s.put("%s","%s");\n' % (mapname,key,value)
			if xcount > 0:			
				str += xstr
				str += '		%s.put("%s",%s);\n' % (varname,pathname,mapname1)
		return str + '\n'

	def create_android_density_dict(self,hash,varname):
		str = ''
		for pathname in hash:
			mapname1 = self.generate_mapname()
			xcount = 0
			xstr='		HashMap<String,HashMap<String,String>> %s = new HashMap<String,HashMap<String,Object>>();\n' % mapname1
			for density in hash[pathname]:
				mapname2 = self.generate_mapname()
				xstr+='		HashMap<String,HashMap<String,String>> %s = new HashMap<String,HashMap<String,Object>>();\n' % mapname2
				xstr+='		%s.put("%s",%s);\n' % (mapname2,classname,mapname1)
				for classname in hash[pathname][density]:
					mapname = self.generate_mapname()
					xcount+=1
					xstr+='		HashMap<String,Object> %s = new HashMap<String,Object>();\n' % mapname
					xstr+='		%s.put("%s",%s);\n' % (mapname1,classname,mapname)
					for key in hash[pathname][density][classname]:
						xstr+='		%s.put("%s","%s");\n' % (mapname,key,hash[pathname][density][classname][key])
					xstr += '		%s.put("%s",%s);\n' % (varname,pathname,mapname)
				xstr += '		%s.put("%s",%s);\n' % (varname,pathname,mapname1)
			if xcount > 0:
				str+=xstr
		return str + '\n'
				
	def generate_android_code(self,classes,classes_density,ids,ids_density):
		return ANDROID_CLASS_TEMPLATE % (self.appid,
									self.create_android_dict(classes,'classesMap'),
									self.create_android_dict(ids,'idsMap'),
									self.create_android_density_dict(classes_density,'classesDensityMap'),
									self.create_android_density_dict(ids_density,'idsDensityMap'))

	def translate_value(self,value):
		if isinstance(value,css.String):
			return value.value
		return unicode(value)
		
	def translate_key(self,key):
		if CSS_MAPPINGS.has_key(str(key)):
			return CSS_MAPPINGS[str(key)]
		return key 
			
	def fill_entries(self,filepath,classes={},ids={}):
		contents = codecs.open(filepath,'r').read()
		x = self.parse(contents)
		for rule in x:
			if isinstance(rule,css.Ruleset):
				for selector in rule.selectors:
					for r in rule:
						dest = classes
						key = selector
						if selector[0:1]=='#':
							dest = ids
							key = key[1:]
						prop = self.translate_key(r.property)
						if not dest.has_key(key):
							dest[key] = {}
						dest[key][unicode(prop)]=self.translate_value(r.value)
			elif isinstance(rule,css.Import):
				p = os.path.join(self.dir,rule.source.url)
				if not os.path.exists(p):
					print "[ERROR] Couldn't find import file: %s" % p
				else:
					self.fill_entries(p,classes,ids)

if __name__ == "__main__":
	if len(sys.argv)==1 or len(sys.argv) < 3:
		print "Appcelerator CSS Compiler"
		print "Usage: %s <project_dir> <platform> [output]" % os.path.basename(sys.argv[0])
		sys.exit(1)
	
	path = os.path.expanduser(sys.argv[1])
	if not os.path.exists(path):
		print "Project directory not found: %s" % path
		sys.exit(1)
	
	tiapp_xml_path = os.path.join(path,'tiapp.xml')
	if not os.path.exists(tiapp_xml_path):
		print "Project directory doesn't look like a valid Titanium project: %s" % path
		sys.exit(1)	
		
	resources_dir = os.path.join(path,'Resources')
		
	if not os.path.exists(resources_dir):
		print "Project directory doesn't look like a valid Titanium project: %s" % path
		sys.exit(1)	

	platform = sys.argv[2]
	tiapp = TiAppXML(tiapp_xml_path)
	app_id = tiapp.properties['id']
	output_dir = None
	
	if len(sys.argv) > 3:
		output_dir = os.path.expanduser(sys.argv[3])
	
	c = CSSCompiler(resources_dir,platform,app_id)
	
	
	if platform == 'android':
		if output_dir==None:
			srcdir = os.path.join(path,'build','android','src')
			app_sdir = os.path.join(srcdir,app_id.replace('.','/'))
		else:
			app_sdir = output_dir
		if not os.path.exists(app_sdir): os.makedirs(app_sdir)
		app_stylesheet = os.path.join(app_sdir,'ApplicationStylesheet.java')
		asf = codecs.open(app_stylesheet,'w','utf-8')
		asf.write(c.code)
		asf.close()
		print "[INFO] wrote %s" % app_stylesheet
	elif platform in ('iphone','ipad','ios'):
		if output_dir==None:
			iphone_dir = os.path.abspath(os.path.join(path,'build','iphone'))
			app_stylesheet = os.path.join(iphone_dir,'Resources','stylesheet.plist')
		else:
			app_stylesheet = os.path.join(output_dir,'stylesheet.plist')
		asf = codecs.open(app_stylesheet,'w','utf-8')
		asf.write(c.code)
		asf.close()
		print "[INFO] wrote %s" % app_stylesheet
	else:
		print "Unknown or unsupported platform: %s" % platform
		sys.exit(1)
		
	sys.exit(0)
	
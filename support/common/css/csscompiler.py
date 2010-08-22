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



ANDROID_CLASS_TEMPLATE = """/**
 * Appcelerator Titanium
 * WARNING: This is a generated file.  Do not modify.
 */
package %s;

import java.util.HashMap;
import org.appcelerator.titanium.ITiStylesheet;

public class ApplicationStylesheet implements ITiStylesheet 
{
	private static HashMap<String,HashMap<String,HashMap<String,String>>> classesMap;
	private static HashMap<String,HashMap<String,HashMap<String,String>>> idsMap;
	private static HashMap<String,HashMap<String,HashMap<String,HashMap<String,String>>>> classesDensityMap;
	private static HashMap<String,HashMap<String,HashMap<String,HashMap<String,String>>>> idsDensityMap;

	public ApplicationStylesheet()
	{
		classesMap = new HashMap<String,HashMap<String,HashMap<String,String>>>();
		idsMap = new HashMap<String,HashMap<String,HashMap<String,String>>>();
		classesDensityMap = new HashMap<String,HashMap<String,HashMap<String,HashMap<String,String>>>>();
		idsDensityMap = new HashMap<String,HashMap<String,HashMap<String,HashMap<String,String>>>>();
		
%s
%s
%s
%s
	}

	public HashMap<String,String> getStylesheet(String objectId, String type, String density, String basename)
	{
		HashMap<String,String> result = new HashMap<String,String>();
		if (classesMap!=null && classesMap.containsKey(basename))
		{
			HashMap<String,String> r = classesMap.get(basename).get(type);
			if (r!=null) result.putAll(r);
		}
		if (classesDensityMap!=null && classesDensityMap.containsKey(basename))
		{
			HashMap<String,HashMap<String,String>> r = classesDensityMap.get(basename).get(density);
			if (r!=null && r.containsKey(type)) 
			{
				HashMap<String,String> r2 = r.get(type);
				if (r2!=null) result.putAll(r2);
			}
		}
		if (idsMap!=null && idsMap.containsKey(basename))
		{
			HashMap<String,String> r = idsMap.get(basename).get(objectId);
			if (r!=null) result.putAll(r);
		}
		if (idsDensityMap!=null && idsDensityMap.containsKey(basename))
		{
			HashMap<String,HashMap<String,String>> r = idsDensityMap.get(basename).get(density);
			if (r!=null && r.containsKey(objectId)) 
			{
				HashMap<String,String> r2 = r.get(objectId);
				if (r2!=null) result.putAll(r2);
			}
		}
		return result;
	}
}

"""


__all__ = ('CSSCompiler')


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
		
		for dirname,x,files in os.walk(dir):
			for f in files:
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
		
		if self.platform == 'iphone' or self.platform == 'ipad' or self.platform == 'ios':
			self.code = self.generate_ios_code(self.classes,self.classes_density,self.ids,self.ids_density)
		elif self.platform == 'android':
			self.code = self.generate_android_code(self.classes,self.classes_density,self.ids,self.ids_density)
		elif self.platform == 'blackberry':
			self.code = self.generate_bb_code(self.classes,self.classes_density,self.ids,self.ids_density)
		
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
					str+='<key>%s</key>\n<string>%s</string>\n' % (subkey,hash[classname][key][subkey])
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
						str+='<key>%s</key>\n<string>%s</string>\n' % (key,hash[pathname][density][classname][key])
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
			str+='		HashMap<String,HashMap<String,String>> %s = new HashMap<String,HashMap<String,String>>();\n' % mapname1
			for classname in hash[pathname]:
				mapname = self.generate_mapname()
				str+='		HashMap<String,String> %s = new HashMap<String,String>();\n' % mapname
				str+='		%s.put("%s",%s);\n' % (mapname1,classname,mapname)
				for key in hash[pathname][classname]:
					str+='		%s.put("%s","%s");\n' % (mapname,key,hash[pathname][classname][key])
			str += '		%s.put("%s",%s);\n' % (varname,pathname,mapname1)
		return str + '\n'

	def create_android_density_dict(self,hash,varname):
		str = ''
		for pathname in hash:
			mapname1 = self.generate_mapname()
			str+='		HashMap<String,HashMap<String,String>> %s = new HashMap<String,HashMap<String,String>>();\n' % mapname1
			for density in hash[pathname]:
				mapname2 = self.generate_mapname()
				str+='		HashMap<String,HashMap<String,String>> %s = new HashMap<String,HashMap<String,String>>();\n' % mapname2
				str+='		%s.put("%s",%s);\n' % (mapname2,classname,mapname1)
				for classname in hash[pathname][density]:
					mapname = self.generate_mapname()
					str+='		HashMap<String,String> %s = new HashMap<String,String>();\n' % mapname
					str+='		%s.put("%s",%s);\n' % (mapname1,classname,mapname)
					for key in hash[pathname][density][classname]:
						str+='		%s.put("%s","%s");\n' % (mapname,key,hash[pathname][density][classname][key])
					str += '		%s.put("%s",%s);\n' % (varname,pathname,mapname)
				str += '		%s.put("%s",%s);\n' % (varname,pathname,mapname1)
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
						if not dest.has_key(key):
							dest[key] = {}
						dest[key][unicode(r.property)]=self.translate_value(r.value)
			elif isinstance(rule,css.Import):
				p = os.path.join(self.dir,rule.source.url)
				if not os.path.exists(p):
					print "[ERROR] Couldn't find import file: %s" % p
				else:
					self.fill_entries(p,classes,ids)

if __name__ == "__main__":
	c = CSSCompiler("/Users/jhaynie/work/titanium_mobile/demos/KitchenSink/Resources","android","com.appcelerator.titanium")
	print c.code
	
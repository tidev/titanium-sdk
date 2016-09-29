#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Install a provisioning profile
#

import os, sys, subprocess, re, time, poorjson, types
from xml.dom.minidom import parseString
import codecs
from OpenSSL import crypto

def dequote(s):
    if s[0:1] == '"':
        return s[1:-1]
    return s

def getText(nodelist):
    rc = ""
    for node in nodelist:
        if node.nodeType == node.TEXT_NODE:
            rc = rc + node.data
    return rc

def make_map(dict):
	props = {}
	curkey = None
	
	for i in dict.childNodes:
		if i.nodeType == 1:
			if i.nodeName == 'key':
				curkey = str(getText(i.childNodes)).strip()
			elif i.nodeName == 'dict':
				props[curkey] = make_map(i)
				curkey = None
			elif i.nodeName == 'array':
				s = i.getElementsByTagName('string')
				if len(s):
					txt = ''
					for t in s:
						txt+=getText(t.childNodes)
					props[curkey]=txt
				else:
					props[curkey]=None
				curkey = None
			else:
				props[curkey] = getText(i.childNodes)
				curkey = None
	
	return props

def find_dict_element(dict,name):
	found = False
	for i in dict.childNodes:
		if i.nodeType == 1:
			if i.nodeName == 'key':
				if str(getText(i.childNodes)).strip() == name:
					found = True
			elif found:
				return i
	return None
				
def get_cert(dict):
	certs_array = find_dict_element(dict, 'DeveloperCertificates')
	if certs_array:
		certs_array = certs_array.getElementsByTagName('data')
	if not certs_array or not len(certs_array):
		return None
	cert_text = str(getText(certs_array[0].childNodes)).strip()
	cert_text = "-----BEGIN CERTIFICATE-----\n" + cert_text + "\n-----END CERTIFICATE-----\n"
	cert = crypto.load_certificate(crypto.FILETYPE_PEM, cert_text)
	return cert
	
def main(args):
	if len(args)!=2:
		print "%s <provisioning_file>" % os.path.basename(args[0])
		sys.exit(1)
		
	try:
		xml = os.path.abspath(os.path.expanduser(dequote(args[1].decode("utf-8"))))
		
		f = open(xml,'rb').read()
		b = f.index('<?xml')
		e = f.index('</plist>')
		xml_content = f[b:e+8]
		dom = parseString(xml_content)

		dict = dom.getElementsByTagName('dict')[0]
		props = make_map(dict)
				
		profile_type = 'unknown'
	
		if len(re.findall('ProvisionedDevices',xml_content)) > 0:
			profile_type = 'development'
			try:
				cert = get_cert(dict)
				if cert and re.search('Distribution:', cert.get_subject().commonName):
					profile_type = 'adhoc'
			except Exception, e:
				sys.stderr.write('ERROR: %s\n' % str(e))
		else:
			profile_type = 'distribution'
		
		
		name = props['Name']
		name = name.decode('string_escape').decode('utf-8')
		entitlements = props['Entitlements']
		appid = entitlements['application-identifier']
		appid_prefix = props['ApplicationIdentifierPrefix']
		uuid = props['UUID']
	
		bundle_id = appid.replace(appid_prefix+'.','')
		
		# check to see if xcode is already running
		output = subprocess.Popen(["ps", "-ef"], stdout=subprocess.PIPE).communicate()[0]
		is_xcode = re.findall(r'Xcode.app',output)
		xcode = len(is_xcode) > 0
	
		# now we need to install the cert
		# we essentially open xcode causing the cert to be installed
		# automagically (but -g tells it to stay in the background)
		cmd = "open -g \"%s\"" % xml
		os.system(cmd)
	
		# only kill Xcode if it wasn't already running
		if xcode == False:
			# give it a sec to install before killing it
			time.sleep(1.5)
			cmd = "killall Xcode"
			os.system(cmd)
			
		print poorjson.PoorJSON().dump({'type':profile_type,'appid':bundle_id, 'prefix':appid_prefix, 'name':name, 'uuid': uuid})

		sys.exit(0)
		
	except Exception, e:
		print e
		sys.exit(10)

if __name__ == "__main__":
	main(sys.argv)


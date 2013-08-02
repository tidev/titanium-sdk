#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# Portions (c) 2009 Sridhar Ratnakumar
#

import os, sys, re
simple_tag_pattern = re.compile(r"<[^>]*?>")
not_real_titanium_types = ("Titanium.Proxy", "Titanium.Module", "Titanium.Event")
DEFAULT_PLATFORMS = ["android", "blackberry", "iphone", "ipad", "mobileweb", "tizen"]
platform_names = { "android": "Android", "blackberry": "BlackBerry", 
				"iphone": "iPhone", "ipad": "iPad", "mobileweb": "Mobile Web", "tizen": "Tizen" }
initial_platform_version = { "blackberry": "3.1.2", "mobileweb" : "1.8", "tizen": "3.1" }
platform_namespaces = [ "Android", "iOS",  "iPhone", "iPad", "MobileWeb", "BlackBerry", "Tizen" ]

# odict source is in docgen folder (parent of this folder).
# Newer versions of Python also have OrderedDict.
this_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(this_dir, "..")))
try:
	from collections import OrderedDict
except:
	from odict import odict as OrderedDict

## {{{ http://code.activestate.com/recipes/576720/ (r6)
## From Sridhar Ratnakumar, licensed under MIT License
def lazyproperty(func):
    """A decorator for lazy evaluation of properties
    """
    cache = {}
    def _get(self):
        try:
            return cache[self]
        except KeyError:
            cache[self] = value = func(self)
            return value
        
    return property(_get)
## end of http://code.activestate.com/recipes/576720/ }}}

def strip_tags(value):
	return simple_tag_pattern.sub("", value)

def dict_has_non_empty_member(d, member_name):
	return member_name in d and d[member_name] is not None and len(d[member_name]) > 0

def to_ordered_dict(orig_dict, key_order):
	already_added = []
	odict = OrderedDict()
	for key in key_order:
		if key in orig_dict:
			odict[key] = orig_dict[key]
			already_added.append(key)

	# Possible that not all keys were provided, so go thru orig
	# dict and make sure all elements get in new, ordered dict
	for key in orig_dict:
		if not key in already_added:
			odict[key] = orig_dict[key]
	return odict

def pretty_platform_name(platform):
	name = platform.lower()
	if name in platform_names:
		return platform_names[name]
	else:
		return name

def first_version_for_platform(platform):
	name = platform.lower()
	if name in initial_platform_version:
		return initial_platform_version[name]
	else:
		return None

#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# Portions (c) 2009 Sridhar Ratnakumar
#

import sys, re
simple_tag_pattern = re.compile(r"<[^>]*?>")
not_real_titanium_types = ("Titanium.Proxy", "Titanium.Module", "Titanium.Event")

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

def dict_has_non_empty_member(d, list_name):
	return list_name in d and d[list_name] is not None and len(d[list_name]) > 0


#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# Portions (c) 2009 Sridhar Ratnakumar
#

import sys, re
WARN = 1
INFO = 2
VERBOSE = 3
log_level = INFO
simple_tag_pattern = re.compile(r"<[^>]*?>")
not_real_titanium_types = ("Titanium.Proxy", "Titanium.Module", "Titanium.Event")


def log(severity, message, level):
	if log_level >= level:
		print >> sys.stderr, "[%s] %s" % (severity, message)

def err(s):
	log("ERROR", s, WARN)

def warn(s):
	log("WARN", s, WARN)

def info(s):
	log("INFO", s, INFO)

def vinfo(s):
	log("INFO", s, VERBOSE)

def msg(s):
	print >> sys.stderr, s

def dict_has_non_empty_member(d, list_name):
	return list_name in d and d[list_name] is not None and len(d[list_name]) > 0

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

def set_log_level(v):
	global log_level
	log_level = v

def strip_tags(value):
	return simple_tag_pattern.sub("", value)

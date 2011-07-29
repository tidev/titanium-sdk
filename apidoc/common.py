#!/usr/bin/env python
#
# Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
# Licensed under the Apache Public License (version 2)
#
# Portions (c) 2009 Sridhar Ratnakumar
#

import sys

def log(severity, message):
	print >> sys.stderr, "[%s] %s" % (severity, message)

def err(s):
	log("ERROR", s)

def warn(s):
	log("WARN", s)

def info(s):
	log("INFO", s)

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


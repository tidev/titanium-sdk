#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# example compiler plugin
# the config object is a set of properties
# that are passed (dependent on platform)
# that will allow you to hook into the compiler tooling
# 


def compile(config):
	print "[INFO] Compiler plugin loaded and working for %s" % config['platform']


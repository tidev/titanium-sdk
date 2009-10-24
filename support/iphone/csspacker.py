#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# CSS Minification Script
# http://www.siafoo.net/snippet/16
# released in public domain
#
from __future__ import division
import sys
import getopt
import re
import string

def compress(input):

    output = ''

    while True:
        open_c = input.find('/*')
        
        if open_c == -1: 
            output += input 
            break;
        
        output += input[ : open_c]
        input  = input[ open_c + 2 : ]

        close_c = input.find('*/')
        
        if close_c == -1:
            #print 'Runaway comment detected'
            return output

        input = input[close_c + 2: ]
    
    # Replace tab with space
    output = output.replace('\t', ' ')

    # Remove double spaces
    output = re.sub('\s{2,}', ' ', output)

    # Remove spaces around stuff
    output = re.sub('\s*;+\s*', ';', output)
    output = re.sub('\s*:\s*', ':', output)
    output = re.sub('\s*{\s*', '{', output)
    output = re.sub('\s*}\s*', '}', output)

    # Remove unecessary semicolon
    output = output.replace(';}', '}')

    # Split the directives on per line
    output = output.replace('}', '}\n')

    output = output.strip()    

    output = remove_dead(output)
    output = shorten_colors(output)

    # Remove all the newlines
    output = output.replace('\n', '')
    return output

def remove_dead(input):
    output = '' 
    
    for line in input.splitlines(True):
        if not re.search('([\.#][\w_]*{})', line):
            output += line 
    
    return output

def shorten_colors(input):
    output = '' 
    
    p = re.compile(':#([A-Fa-f0-9]{6})')
    
    for line in input.splitlines(True):
        m = p.search(line)
        
        if m is not None:
            old_c = m.group(1)
           
            if old_c[0] == old_c[1] and old_c[2] == old_c[3] and old_c[4] == old_c[5]:
                new_c = old_c[0] + old_c[2] + old_c[4]
                output += line.replace(old_c, new_c)
                continue

        output += line
        
    return output

class CSSPacker(object):
	def __init__(self,contents):
		self.contents = contents
		
	def pack(self):
		return compress(self.contents)

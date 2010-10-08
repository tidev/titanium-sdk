# -*- coding: utf-8 -*-
'''
CSS package
Author: Joshua E Cook <jcook at particleweb dot com>

http://code.google.com/p/css-py/
MIT License

Examples:

from css.parse import parse

data = """p { color: red; font-size: 12pt }
p:first-letter { color: green; font-size: 200% }
p:first-line { color: blue }"""

for rule in parse(data):
    print rule
    # or do something with each rule

'''

__all__ = ('csslex', 'cssyacc', 'css', 'serialize', 'parse', 'csscompiler', 'parsetab')



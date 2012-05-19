#!/usr/bin/env python
# -*- coding: utf-8 -*-

from urllib2 import urlopen
from codecs import EncodedFile
import css, csslex, cssyacc
from uri import uri

__all__ = ('parse','export')

def parse(data):
    parser = cssyacc.yacc()
    parser.lexer = csslex.lex()
    return parser.parse(data, debug=True)

def export(base, stylesheet, recursive=False):
    def recur(rule):
        url = rule.source
        if isinstance(url, css.Uri):
            url = url.url
        url = uri.resolve(base, url)
        export(base, parse(urlopen(url).read()), recursive)

    for rule in stylesheet:
        if recursive and isinstance(rule, css.Import):
            recur(rule)
        else:
            print rule.datum(unicode)


def main(fileuri, options):
    inputfile = urlopen(fileuri)

    stylesheet = parse(inputfile.read())
    export(fileuri, stylesheet)
    

if '__main__' == __name__:
    from optparse import OptionParser
    opts = OptionParser("usage: %prog [options] filename")

    options, args = opts.parse_args()

    if 1 != len(args):
        opts.error("no filename given")
        
    main(args[0],options)

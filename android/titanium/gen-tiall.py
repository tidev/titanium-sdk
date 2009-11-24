#!/usr/bin/python

from jsmin import JavascriptMinify

if __name__ == '__main__':
    import sys, os

    if len(sys.argv) != 3:
      print "Usage: gen-tiall.py <path to tiall.js> <dir of source js>"
      sys.exit(1)

    tiall_js = sys.argv[1]
    src_dir = sys.argv[2]
    tilist_file = os.path.join(src_dir, "tilist.txt")
    l = open(tilist_file, "r")
    sources = []
    for n in l:
        n = n.strip()
        if len(n) > 0:
            sources.append(os.path.join(src_dir,n))

    l.close()

    print "Dest: %s" % (tiall_js)
    outf = open(tiall_js, "w+")

    for f in sources:
        inf = open(f,"r")
        print "Minifying: %s" % (f)
        jsm = JavascriptMinify()
        jsm.minify(inf, outf)

    outf.close()


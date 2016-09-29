# -*- coding: utf-8 -*-

import uri

def was(base, relative, absolute):
    resolved = uri.resolve(base,relative)
    if ( resolved != absolute ):
        raise RuntimeError, "%s != %s"%(resolved,absolute)

def main():
    base = "http://a/b/c/d;p?q"
    
    was(base, "g:h", "g:h");
    was(base, "g", "http://a/b/c/g");
    was(base, "./g", "http://a/b/c/g");
    was(base, "g/", "http://a/b/c/g/");
    was(base, "/g", "http://a/g");
    was(base, "//g", "http://g");
    was(base, "?y", "http://a/b/c/d;p?y");
    was(base, "?y#s", "http://a/b/c/d;p?y#s");
    was(base, "g?y", "http://a/b/c/g?y");
    was(base, "#s", "http://a/b/c/d;p?q#s");
    was(base, "g#s", "http://a/b/c/g#s");
    was(base, "g?y#s", "http://a/b/c/g?y#s");
    was(base, ";x", "http://a/b/c/;x");
    was(base, "g;x", "http://a/b/c/g;x");
    was(base, "g;x?y#s", "http://a/b/c/g;x?y#s");
    was(base, "", "http://a/b/c/d;p?q");
    was(base, ".", "http://a/b/c/");
    was(base, "./", "http://a/b/c/");
    was(base, "..", "http://a/b/");
    was(base, "../", "http://a/b/");
    was(base, "../g", "http://a/b/g");
    was(base, "../..", "http://a/");
    was(base, "../../", "http://a/");
    was(base, "../../g", "http://a/g");

    # abnormal examples
    was(base, "../../..", "http://a/");
    was(base, "../../../", "http://a/");
    was(base, "../../../..", "http://a/");
    was(base, "../../../../", "http://a/");
    was(base, "../../../../.", "http://a/");
    was(base, "../../../g", "http://a/g");
    was(base, "../../../../g", "http://a/g");
    was(base, "/./g", "http://a/g");
    was(base, "/../g", "http://a/g");
    was(base, "g.", "http://a/b/c/g.");
    was(base, ".g", "http://a/b/c/.g");
    was(base, "g..", "http://a/b/c/g..");
    was(base, "..g", "http://a/b/c/..g");
    was(base, "./../g", "http://a/b/g");
    was(base, "./g/.", "http://a/b/c/g/");
    was(base, "g/./h", "http://a/b/c/g/h");
    was(base, "g/../h", "http://a/b/c/h");
    was(base, "g;x=1/./y", "http://a/b/c/g;x=1/y");
    was(base, "g;x=1/../y", "http://a/b/c/y");
    was(base, "g?y/./x", "http://a/b/c/g?y/./x");
    was(base, "g?y/../x", "http://a/b/c/g?y/../x");
    was(base, "g#s/./x", "http://a/b/c/g#s/./x");
    was(base, "g#s/../x", "http://a/b/c/g#s/../x");


if __name__ == '__main__':
    main()

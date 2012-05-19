# -*- coding: utf-8 -*-

from __future__ import generators
from uri import InvalidUri, is_path_symbol

def folder( path ):
    """Extracts the resource folder."""
    return path[:1+path.rfind('/')]


def name( path ):
    """Extracts the resource name."""
    return path[1+path.rfind('/'):]


def walk(path):
    """Generates the folder segments in a path."""
    i = 0
    sep = path.find("/")
    
    while -1 != sep:
        segment = path[i:sep]
        i = sep + 1
        sep = path.find("/",i)
        yield segment


def vet(path):
    """Canonicalizes a path."""
    for c in path:
        if not (is_path_symbol(c) or "/" == c):
            raise InvalidUri, path
    
    while "./" == path[:2]:
        path = path[2:]
    
    while True:
        start_rel = path.find("/./")
        if -1 == start_rel:
            break
        path = path[:start_rel] + path[2+start_rel:]
    
    if "/." == path[-2:]:
        path = path[:-1]
    
    if "." == path:
        path = ""
    
    while True:
        while "../" == path[:3]:
            path = path[3:]
        if ".." == path:
            return ""
        start_rel = path.find("/../")
        if -1 == start_rel:
            break
        path = path[:1+path.rfind("/",0,start_rel-1)] + path[4+start_rel:]
    
    if "/.." == path[-3:]:
        path = path[:1+path.rfind("/",0,-4)]
    
    if "" != path and "/" == path[0]:
        raise InvalidUri, path
    
    return path


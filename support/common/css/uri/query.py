# -*- coding: utf-8 -*-

from urllib import unquote as urldecode

def arg(otherwise, query, name):
    """Extracts the value of a query argument."""
    nameLen = len(name)
    if name+"=" == query[:1+nameLen]:
        first = 1 + nameLen
    else:
        first = query.find("&"+name+"=")
        if -1 == first:
            return otherwise
        first += 2 + nameLen
        last = query.find("&",first)
    
    return urldecode(query[first:last])


# -*- coding: utf-8 -*-

from uri import is_unreserved, is_subdelimiter

class InvalidLocation(ValueError):
    pass

def hostname( location ):
    """Extracts the hostname."""
    end = location.find(':')
    if -1 == end:
        host = location
    else:
        host = location[0:end]
    return host


def port( location, standard ):
    """Extracts the port"""
    end = location.find(':')
    if -1 == end or len(location) == 1+end:
        return standard
    return int(location[1+end:])


def vet( location ):
    """Checks a location for invalid characters."""
    for c in location:
        if not ( is_unreserved(c) or is_subdelimiter(c) or -1 != ":[]%".find(c) ):
            raise InvalidLocation, location
    return location

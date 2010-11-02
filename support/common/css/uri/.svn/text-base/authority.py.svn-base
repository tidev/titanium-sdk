# -*- coding: utf-8 -*-

def userinfo( authority, otherwise='' ):
    """Extracts the user info (user:pass)."""
    end = authority.find('@')
    if -1 == end:
        return otherwise
    return authority[0:end]


def location( authority ):
    """Extracts the location (host:port)."""
    end = authority.find('@')
    if -1 == end:
        return authority
    return authority[1+end:]


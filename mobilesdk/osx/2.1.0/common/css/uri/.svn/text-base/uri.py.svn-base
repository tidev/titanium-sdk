# -*- coding: utf-8 -*-

from logging import debug

class InvalidUri(ValueError):
    pass


def is_alpha( c ):
    return ( ("a" <= c and c <= "z") or 
             ("A" <= c and c <= "Z") )


def is_digit( c ):
    return "0" <= c and c <= "9"


def is_unreserved( c ):
    return is_alpha(c) or is_digit(c) or -1 != "-._~".find(c)


def is_subdelimiter( c ):
    return -1 != "!$&'()*+,;=".find(c)


def is_gendelimiter( c ):
    return -1 != ":/?#[]@".find(c)


def is_reserved( c ):
    return is_gendelimiter(c) or is_subdelimiter(c)


def is_path_symbol( c ):
    return is_unreserved(c) or is_subdelimiter(c) or -1 != "%:@".find(c)


def is_start_symbol( c ):
    return ( ('a' <= c and c <= 'z') or
             ('A' <= c and c <= 'Z') )


def is_component_symbol( c ):
    return ( ('a' <= c and c <= 'z') or 
             ('A' <= c and c <= 'Z') or
             ('0' <= c and c <= '9') or
             '+' == c or
             '.' == c or
             '-' == c )


def scheme_end( uri ):
    uriLen = len(uri)
    if 0 == uriLen or not is_start_symbol(uri[0]):
        return -1
    end = 1
    while end < uriLen and is_component_symbol(uri[end]):
        end = 1 + end
    if uriLen == end or ':' != uri[end]:
        return -1
    return end


def scheme( otherwise, uri ):
    """Extracts the scheme component."""
    last = scheme_end(uri)
    if -1 == last:
        return otherwise
    return uri[0:last].lower()


def authority_begin( uri, offset ):
    offset += 1 # skip past the ':'  
    if '//' == uri[offset:2+offset]:
        offset += 2
    return offset


def authority_end( uri, offset ):
    last = uri.find('/',offset)
    if -1 == last:
        return hierarchy_end(uri,offset)
    return last


def authority( uri ):
    """Extract the authority component."""
    first = authority_begin(uri,scheme_end(uri))
    last = authority_end(uri,first)
    return uri[first:last]


def service_end( uri ):
    return authority_end(uri,authority_begin(uri,scheme_end(uri)))


def hierarchy_end( uri, offset ):
    query = uri.find('?',offset)
    fragment = uri.find('#',offset)
    if -1 == query:
        if -1 == fragment:
            return len(uri)
        else:
            return fragment
    elif -1 == fragment:
        return query
    elif query < fragment:
        return query
    return fragment


def path( uri ):
    """Extracts the rootless path component."""
    first = service_end(uri)
    last = hierarchy_end(uri,first)
    if last == first:
        return ""
    return uri[1+first:last]


def query( otherwise, uri ):
    """Extract the query component."""
    first = uri.find('?')
    if -1 == first:
        return otherwise
    last = uri.find('#')
    if -1 == last:
        return uri[1+first:]
    elif last < first:
        return uri[1+first:last]
    return otherwise


def fragment( otherwise, uri ):
    """Extracts the fragment component."""
    first = uri.find('#')
    if -1 == first:
        return otherwise
    return uri[1+first:]


def proxy( uri ):
    """Extracts the proxy request URI."""
    last = uri.find('#')
    if -1 == last:
        return uri  
    return uri[:last]


def service( uri ):
    """Extracts the remote service identifier."""
    return uri[:service_end(uri)]


def request( uri ):
    """Extracts the request URI."""
    first = service_end(uri)
    last = uri.find('#',first)
    if -1 == last:
        return uri[first:]
    return uri[first:last]


def resolve( base, relative ):
  """Resolves a relative URI."""
  from path import vet as path_vet

  if "" == relative:
    return proxy(base)
    
  if "#" == relative[0]:
    hierarchy = proxy(base)
    tail = relative
  elif "?" == relative[0]:
    hierarchy = base[:hierarchy_end(base,0)]
    tail = relative
  else:
    if -1 != scheme_end(relative):
      authorityLast = service_end(relative)
      for c in relative[:authorityLast]:
        if not ( is_unreserved(c) or is_subdelimiter(c) or -1 != "@/:[]%".find(c) ):
          raise InvalidUri
      if authorityLast < len(relative) and "/" == relative[authorityLast]:
        relativePathFirst = authorityLast + 1
      else:
        relativePathFirst = authorityLast
      root = relative[:relativePathFirst]
      folder = ""
    elif "//" == relative[0:2]:
      authorityLast = authority_end(relative,2)
      for c in relative[2:authorityLast]:
        if not ( is_unreserved(c) or is_subdelimiter(c) or -1 != "@/:[]%".find(c) ):
          raise InvalidUri
      if authorityLast < len(relative) and "/" == relative[authorityLast]:
        relativePathFirst = authorityLast + 1
      else:
        relativePathFirst = authorityLast
      root = base[0:1+base.find(":")] + relative[0:relativePathFirst]
      folder = ""
    elif "/" == relative[0]:
      relativePathFirst = 1
      root = service(base) + "/"
      folder = ""
    else:
      relativePathFirst = 0
      authorityLast = service_end(base)
      if "/" == base[authorityLast]:
        root = base[0:1+authorityLast]
      else:
        root = base[0:authorityLast]
      basePathFirst = len(root)
      basePathLast = hierarchy_end(base,basePathFirst)
      folderLast = base.rfind("/",0,basePathLast)
      if folderLast < basePathFirst:
        folder = ""
      else:
        folder = base[basePathFirst:1+folderLast]
    relativePathLast = hierarchy_end(relative,relativePathFirst)
    relativePath = relative[relativePathFirst:relativePathLast]
    hierarchy = root + path_vet(folder + relativePath)
    tail = relative[relativePathLast:]

  fragmentFirst = tail.find("#")
  if 0 < len(tail) and "?" == tail[0]:
    if -1 == fragmentFirst:
      queryLast = len(tail)
    else:
      queryLast = fragmentFirst
    for c in tail[1:queryLast]:
      if not ( is_path_symbol(c) or -1 == "/?".find(c) ):
        raise InvalidUri
  if -1 != fragmentFirst:
    for c in tail[fragmentFirst:]:
      if not ( is_path_symbol(c) or -1 == "/?".find(c) ):
        raise InvalidUri
  return hierarchy + tail
    
def relate(base, target):
    """Encodes an absolute URI relative to a base URI."""
    first = service_end(base)
    if base[:first] != target[:first]:
        return target
    
    # determine the common parent folder
    last = hierarchy_end(base,first)
    path = base[first:last]
    
    i = 0
    j = path.find('/')
    while -1 != j and path[i:j+1] == target[first+i:first+j+1]:
        i = j + 1
        j = path.find('/',i)
    if -1 != j:
        # wind up to the common base
        buff = []
        if 0 == j:
            j = path.find('/',1)
        while -1 != j:
            buff.append("../")
            j = path.find('/',j+1)
        if 0 == len(buff):
            buff.append("./")
        buff.append(target[first+i:])
        return "".join(buff)
    
    j = last - first
    
    if ( path[i:j] != target[first+i:first+j]
         and ( last == len(target) 
               or '?' == target[last]
               or '#' == target[last] ) ):
        return './' + target[first+i]
    
    f = base.find('#',last)
    if -1 == f:
        f = len(base)
    if ( base[last:f] == target[last:f] 
         and ( f == len(target) or '#' == target[f] ) ):
        return target[f:]
    else:
        return target[last:]

def parse(uri):
    '''Returns a 5-tuple containing the components of the given URI.'''
    def schemeN(uri): 
        return scheme(None,uri)
    
    def queryN(uri): 
        return query(None,uri)
    
    def fragmentN(uri): 
        return fragment(None,uri)
    
    
    parsers = (schemeN,authority,path,queryN,fragmentN)
    return [f(uri) for f in parsers]


if __name__ == '__main__':

  base = "http://a/b/c/d;p?q"
  relative = "g?y#s"
  # was(base, "g:h", "g:h");
  # was(base, "g", "http://a/b/c/g");


  def schemeN(uri): return scheme(None,uri)
  def queryN(uri): return query(None,uri)
  def fragmentN(uri): return fragment(None,uri)

  def path_merge(base,relative):
    return base + relative

  def path_normalize(path):
    return path


  parsers = (schemeN,authority,path,queryN,fragmentN)
  ( r_scheme, r_authority, r_path, r_query, r_fragment 
    ) = parse(relative)
  ( b_scheme, b_authority, b_path, b_query, b_fragment
    ) = parse(base)

  # not strict
  if r_scheme == b_scheme:
    r_scheme = None

  if r_scheme is not None:
    t_scheme = r_scheme
    t_authority = r_authority
    t_path = path_normalize(r_path)
    t_query = r_query
  else:
    if r_authority is not None:
      t_authority = r_authority
      t_path = path_normalize(r_path)
      t_query = r_query
    else:
      if "" == r_path:
        t_path = b_path
        if r_query is not None:
          t_query = r_query
        else:
          t_query = b_query
      else:
        if "/" == r_path[0]:
          t_path = path_normalize(r_path)
        else:
          t_path = path_normalize(path_merge(b_path,r_path))
        t_query = r_query
      t_authority = b_authority
    t_scheme = b_scheme
  t_fragment = b_fragment


  print "%s://%s%s?%s#%s"%(t_scheme,t_authority,t_path,t_query,t_fragment)




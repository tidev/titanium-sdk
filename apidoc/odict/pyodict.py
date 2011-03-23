# Python Software Foundation License

# XXX: it feels like using the class with "is" and "is not" instead of "==" and
# "!=" should be faster.
class _Nil(object):

    def __repr__(self):
        return "nil"

    def __eq__(self, other):
        if (isinstance(other, _Nil)):
            return True
        else:
            return NotImplemented

    def __ne__(self, other):
        if (isinstance(other, _Nil)):
            return False
        else:
            return NotImplemented

_nil = _Nil()

class _odict(object):
    """Ordered dict data structure, with O(1) complexity for dict operations
    that modify one element.

    Overwriting values doesn't change their original sequential order.
    """

    def _dict_impl(self):
        return None

    def __init__(self, data=(), **kwds):
        """This doesn't accept keyword initialization as normal dicts to avoid
        a trap - inside a function or method the keyword args are accessible
        only as a dict, without a defined order, so their original order is
        lost.
        """
        if kwds:
            raise TypeError("__init__() of ordered dict takes no keyword "
                            "arguments to avoid an ordering trap.")
        self._dict_impl().__init__(self)
        # If you give a normal dict, then the order of elements is undefined
        if hasattr(data, "iteritems"):
            for key, val in data.iteritems():
                self[key] = val
        else:
            for key, val in data:
                self[key] = val

    # Double-linked list header
    def _get_lh(self):
        dict_impl = self._dict_impl()
        if not hasattr(self, '_lh'):
            dict_impl.__setattr__(self, '_lh', _nil)
        return dict_impl.__getattribute__(self, '_lh')

    def _set_lh(self, val):
        self._dict_impl().__setattr__(self, '_lh', val)

    lh = property(_get_lh, _set_lh)

    # Double-linked list tail
    def _get_lt(self):
        dict_impl = self._dict_impl()
        if not hasattr(self, '_lt'):
            dict_impl.__setattr__(self, '_lt', _nil)
        return dict_impl.__getattribute__(self, '_lt')

    def _set_lt(self, val):
        self._dict_impl().__setattr__(self, '_lt', val)

    lt = property(_get_lt, _set_lt)

    def __getitem__(self, key):
        return self._dict_impl().__getitem__(self, key)[1]

    def __setitem__(self, key, val):
        dict_impl = self._dict_impl()
        try:
            dict_impl.__getitem__(self, key)[1] = val
        except KeyError, e:
            new = [dict_impl.__getattribute__(self, 'lt'), val, _nil]
            dict_impl.__setitem__(self, key, new)
            if dict_impl.__getattribute__(self, 'lt') == _nil:
                dict_impl.__setattr__(self, 'lh', key)
            else:
                dict_impl.__getitem__(
                    self, dict_impl.__getattribute__(self, 'lt'))[2] = key
            dict_impl.__setattr__(self, 'lt', key)

    def __delitem__(self, key):
        dict_impl = self._dict_impl()
        pred, _ ,succ= self._dict_impl().__getitem__(self, key)
        if pred == _nil:
            dict_impl.__setattr__(self, 'lh', succ)
        else:
            dict_impl.__getitem__(self, pred)[2] = succ
        if succ == _nil:
            dict_impl.__setattr__(self, 'lt', pred)
        else:
            dict_impl.__getitem__(self, succ)[0] = pred
        dict_impl.__delitem__(self, key)

    def __contains__(self, key):
        # XXX: try: self[key] ...
        return key in self.keys()

    def has_key(self, key):
        return key in self

    def __len__(self):
        return len(self.keys())

    def __str__(self):
        pairs = ("%r: %r" % (k, v) for k, v in self.iteritems())
        return "{%s}" % ", ".join(pairs)

    def __repr__(self):
        if self:
            pairs = ("(%r, %r)" % (k, v) for k, v in self.iteritems())
            return "odict([%s])" % ", ".join(pairs)
        else:
            return "odict()"

    def get(self, k, x=None):
        if k in self:
            return self._dict_impl().__getitem__(self, k)[1]
        else:
            return x

    def __iter__(self):
        dict_impl = self._dict_impl()
        curr_key = dict_impl.__getattribute__(self, 'lh')
        while curr_key != _nil:
            yield curr_key
            curr_key = dict_impl.__getitem__(self, curr_key)[2]

    iterkeys = __iter__

    def keys(self):
        return list(self.iterkeys())

    def itervalues(self):
        dict_impl = self._dict_impl()
        curr_key = dict_impl.__getattribute__(self, 'lh')
        while curr_key != _nil:
            _, val, curr_key = dict_impl.__getitem__(self, curr_key)
            yield val

    def values(self):
        return list(self.itervalues())

    def iteritems(self):
        dict_impl = self._dict_impl()
        curr_key = dict_impl.__getattribute__(self, 'lh')
        while curr_key != _nil:
            _, val, next_key = dict_impl.__getitem__(self, curr_key)
            yield curr_key, val
            curr_key = next_key

    def items(self):
        return list(self.iteritems())

    def sort(self, cmp=None, key=None, reverse=False):
        items = [(k, v) for k,v in self.items()]
        if cmp is not None:
            items = sorted(items, cmp=cmp)
        elif key is not None:
            items = sorted(items, key=key)
        else:
            items = sorted(items, key=lambda x: x[1])
        if reverse:
            items.reverse()
        self.clear()
        self.__init__(items)

    def clear(self):
        dict_impl = self._dict_impl()
        dict_impl.clear(self)
        dict_impl.__setattr__(self, 'lh', _nil)
        dict_impl.__setattr__(self, 'lt', _nil)

    def copy(self):
        return self.__class__(self)

    def update(self, data=(), **kwds):
        if kwds:
            raise TypeError("update() of ordered dict takes no keyword "
                            "arguments to avoid an ordering trap.")
        if hasattr(data, "iteritems"):
            data = data.iteritems()
        for key, val in data:
            self[key] = val

    def setdefault(self, k, x=None):
        try:
            return self[k]
        except KeyError:
            self[k] = x
            return x

    def pop(self, k, x=_nil):
        try:
            val = self[k]
            del self[k]
            return val
        except KeyError:
            if x == _nil:
                raise
            return x

    def popitem(self):
        try:
            dict_impl = self._dict_impl()
            key = dict_impl.__getattribute__(self, 'lt')
            return key, self.pop(key)
        except KeyError:
            raise KeyError("'popitem(): ordered dictionary is empty'")

    def riterkeys(self):
        """To iterate on keys in reversed order.
        """
        dict_impl = self._dict_impl()
        curr_key = dict_impl.__getattribute__(self, 'lt')
        while curr_key != _nil:
            yield curr_key
            curr_key = dict_impl.__getitem__(self, curr_key)[0]

    __reversed__ = riterkeys

    def rkeys(self):
        """List of the keys in reversed order.
        """
        return list(self.riterkeys())

    def ritervalues(self):
        """To iterate on values in reversed order.
        """
        dict_impl = self._dict_impl()
        curr_key = dict_impl.__getattribute__(self, 'lt')
        while curr_key != _nil:
            curr_key, val, _ = dict_impl.__getitem__(self, curr_key)
            yield val

    def rvalues(self):
        """List of the values in reversed order.
        """
        return list(self.ritervalues())

    def riteritems(self):
        """To iterate on (key, value) in reversed order.
        """
        dict_impl = self._dict_impl()
        curr_key = dict_impl.__getattribute__(self, 'lt')
        while curr_key != _nil:
            pred_key, val, _ = dict_impl.__getitem__(self, curr_key)
            yield curr_key, val
            curr_key = pred_key

    def ritems(self):
        """List of the (key, value) in reversed order.
        """
        return list(self.riteritems())

    def firstkey(self):
        if self:
            return self._dict_impl().__getattribute__(self, 'lh')
        else:
            raise KeyError("'firstkey(): ordered dictionary is empty'")

    def lastkey(self):
        if self:
            return self._dict_impl().__getattribute__(self, 'lt')
        else:
            raise KeyError("'lastkey(): ordered dictionary is empty'")

    def as_dict(self):
        return self._dict_impl()(self.items())

    def _repr(self):
        """_repr(): low level repr of the whole data contained in the odict.
        Useful for debugging.
        """
        dict_impl = self._dict_impl()
        form = "odict low level repr lh,lt,data: %r, %r, %s"
        return form % (dict_impl.__getattribute__(self, 'lh'),
                       dict_impl.__getattribute__(self, 'lt'),
                       dict_impl.__repr__(self))

class odict(_odict, dict):

    def _dict_impl(self):
        return dict

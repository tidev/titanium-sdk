odict
=====

_odict is abstract and subclasses need to implement _dict_impl.
::
    >>> from odict.pyodict import _odict
    >>> o = _odict()

    >>> class MyODict(_odict, dict):
    ...     def _dict_impl(self):
    ...         return dict
    >>> o = MyODict()
    >>> del o

__init__ test, with keyword args.
::
    >>> from odict import odict
    >>> odict(a=1)
    Traceback (most recent call last):
      ...
    TypeError: __init__() of ordered dict takes no keyword arguments to avoid an ordering trap.
    
    If initialized with a dict the order of elements is undefined!:
    >>> o = odict({"a":1, "b":2, "c":3, "d":4})
    >>> print o
    {'a': 1, 'c': 3, 'b': 2, 'd': 4}

Also updates don't accepts kwds.
::
    >>> o.update(foo=1)
    Traceback (most recent call last):
      ...
    TypeError: update() of ordered dict takes no keyword arguments to avoid an ordering trap.

Test containment.
::
    >>> 'a' in o
    True

    >>> 'foo' in o
    False
    
    >>> o.has_key('a')
    True

Fetch values.
::
    >>> o.get('a')
    1
    >>> o.get('foo', '')
    ''

Iter values.
::
    >>> o.values()
    [1, 3, 2, 4]

Copy odict.
::
    >>> o.copy() is not o
    True
    
    >>> o.copy()
    odict([('a', 1), ('c', 3), ('b', 2), ('d', 4)])
    
    >>> o['a'] is o.copy()['a']
    True

Update odict.
::

    >>> o2 = odict()
    >>> o2.update(data=((1, 1), (2, 2)))
    >>> o2
    odict([(1, 1), (2, 2)])
    
    >>> o2.update(data={3:3})
    >>> o2
    odict([(1, 1), (2, 2), (3, 3)])

First and last key.
::
    >>> o.firstkey()
    'a'

    >>> o.lastkey()
    'd'

    >>> odict().firstkey()
    Traceback (most recent call last):
    ...
    KeyError: "'firstkey(): ordered dictionary is empty'"

    >>> odict().lastkey()
    Traceback (most recent call last):
    ...
    KeyError: "'lastkey(): ordered dictionary is empty'"

Reverse iteration.
::
    >>> [x for x in o.riterkeys()]
    ['d', 'b', 'c', 'a']

    >>> o.rkeys()
    ['d', 'b', 'c', 'a']

    >>> [x for x in o.ritervalues()]
    [4, 2, 3, 1]

    >>> o.rvalues()
    [4, 2, 3, 1]

    >>> [x for x in o.riteritems()]
    [('d', 4), ('b', 2), ('c', 3), ('a', 1)]

    >>> o.ritems()
    [('d', 4), ('b', 2), ('c', 3), ('a', 1)]

From keys initialization.
::
    >>> o2 = odict.fromkeys((1,2,3), 'x')
    >>> o2
    odict([(1, 'x'), (2, 'x'), (3, 'x')])

Setdefault.
::
    >>> o2.setdefault(1, 9999)
    'x'
    >>> o2.setdefault(4, 9999)
    9999

Popping.
::
    >>> o2.pop(5)
    Traceback (most recent call last):
      ...
    KeyError: 5
    >>> o2.pop(5, 'foo')
    'foo'
    >>> o2.pop(4)
    9999
    >>> o2
    odict([(1, 'x'), (2, 'x'), (3, 'x')])

    >>> o2.popitem()
    (3, 'x')

    >>> odict().popitem()
    Traceback (most recent call last):
    ...
    KeyError: "'popitem(): ordered dictionary is empty'"

removal from empty odict.
::
    >>> o = odict()
    >>> del o["1"]
    Traceback (most recent call last):
      ...
    KeyError: '1'
  
removal from odict with one element.
::
    >>> o = odict()
    >>> o["1"] = 1
    >>> del o["1"]
    >>> o.lh, o.lt, o, o
    (nil, nil, odict(), odict())
    >>> o._repr()
    'odict low level repr lh,lt,data: nil, nil, {}'

removal first element of the odict sequence.
::
    >>> o = odict()
    >>> for i in [1,2,3]: o[str(i)] = i
    >>> del o["1"]
    >>> o.lh, o.lt, o
    ('2', '3', odict([('2', 2), ('3', 3)]))

removal element in the middle of the odict sequence.
::
    >>> o = odict()
    >>> for i in [1,2,3]: o[str(i)] = i
    >>> del o["2"]
    >>> o.lh, o.lt, o
    ('1', '3', odict([('1', 1), ('3', 3)]))

removal element at the end of the odict sequence.
::
    >>> o = odict()
    >>> for i in [1,2,3]: o[str(i)] = i
    >>> del o["3"]
    >>> o.lh, o.lt, o
    ('1', '2', odict([('1', 1), ('2', 2)]))

``deepcopy`` test.
::
    >>> o = odict()
    >>> o['1'] = 1
    >>> o['2'] = 2
    >>> o['3'] = 3
    >>> o
    odict([('1', 1), ('2', 2), ('3', 3)])
    
    >>> import copy
    >>> o_copied = copy.deepcopy(o)
    >>> o_copied is o
    False
    
    >>> o_copied
    odict([('1', 1), ('2', 2), ('3', 3)])

type conversion to ordinary ``dict``.

Type conversion to ``dict`` will fail.
::
    >>> dict(odict([(1, 1)]))
    {1: [nil, 1, nil]}

Reason -> http://bugs.python.org/issue1615701

The ``__init__`` function of ``dict`` checks wether arg is subclass of dict,
and ignores overwritten ``__getitem__`` & co if so.

This was fixed and later reverted due to behavioural problems with ``pickle``.

The following ways for type conversion work.
:: 
    >>> dict(odict([(1, 1)]).items())
    {1: 1}
    
    >>> odict([(1, 1)]).as_dict()
    {1: 1}
    
Makes sure that serialisation works.
::
    >>> import odict
    >>> import cPickle
    >>> cPickle.loads(cPickle.dumps([odict.odict([(1, 2),])]))
    [odict([(1, 2)])]
    
    >>> import pickle
    >>> pickle.loads(pickle.dumps([odict.odict([(1, 2),])]))
    [odict([(1, 2)])]

Test sorting.
::
    >>> od = odict.odict([('a', 1), ('c', 3), ('b', 2)])
    >>> od.sort()
    >>> od.items()
    [('a', 1), ('b', 2), ('c', 3)]

A custom ``cmp`` function. Note that you get (key, value) tuples to compare.
As example a ``cmp`` function which sorts by key in reversed order.
::
    >>> def cmp(x, y):
    ...    if x[0] > y[0]: return -1
    ...    if x[0] < y[0]: return 1
    ...    return 0
    >>> od = odict.odict([('a', 1), ('c', 3), ('b', 2)])
    >>> od = odict.odict([('a', 1), ('c', 3), ('b', 2)])
    >>> od.sort(cmp=cmp)
    >>> od.items()
    [('c', 3), ('b', 2), ('a', 1)]
    
Test ``key`` and ``reverse`` kwargs.
::
    >>> od = odict.odict([('a', 1), ('c', 3), ('b', 2)])
    >>> od.sort(key=lambda x: x[0])
    >>> od.items()
    [('a', 1), ('b', 2), ('c', 3)]
    
    >>> od.sort(key=lambda x: x[0], reverse=True)
    >>> od.items()
    [('c', 3), ('b', 2), ('a', 1)]

Overwrite __getattr__ and __setattr__ on subclass of odict and check if odict
still works.
::
    >>> class Sub(odict.odict):
    ...     def __getattr__(self, name):
    ...         try:
    ...             return self[name]
    ...         except KeyError:
    ...             raise AttributeError(name)
    ...     def __setattr__(self, name, value):
    ...         self[name] = value

    >>> sub = Sub()
    >>> sub.title = 'foo'
    >>> sub.keys()
    ['title']
    
    >>> sub.title
    'foo'

Check bool expressions
::
    >>> odict.odict() and True or False
    False
    
    >>> odict.odict([('a', 1)]) and True or False
    True
    
    >>> if odict.odict([('a', 1)]):
    ...     print True
    True

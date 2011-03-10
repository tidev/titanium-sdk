# Python Software Foundation License

import odict
import time

CREATE_DELETE_ROW = '+----------------+--------------------+'
RELATION_ROW = '+---------------------------+-----------+'

def create(factory, _range):
    for i in range(_range):
        root[str(i)] = factory()

def delete(_range):
    for i in range(_range):
        del root[str(i)]

def result(factory, _range):
    start = time.time()
    create(factory, _range)
    mid = time.time()
    delete(_range)
    end = time.time()
    space = (8 - len(str(_range))) * ' '
    print '| Add %s   %s| %s%s |' % (str(_range),
                                     space,
                                     str(mid - start),
                                     (18 - len(str(mid - start))) * ' ')
    print CREATE_DELETE_ROW
    print '| Delete %s%s| %s%s |' % (str(_range),
                                     space,
                                     str(end - mid),
                                     (18 - len(str(end - mid))) * ' ')
    print CREATE_DELETE_ROW
    return start, mid, end

def relation_row(action, _range, relation):
    space = (8 - len(str(_range))) * ' '
    print '| %s %s objects %s| 1:%s%s |' % \
          (action,
           str(_range),
           space,
           str(relation)[:6],
           (14 - len(str(relation))) * ' ')
    print RELATION_ROW

def head(value):
    print ''
    print value
    print len(value) * '='
    print ''

def run():
    head('dict')
    root = dict()
    global root
    print CREATE_DELETE_ROW
    dict_results = {
        1000: result(dict, 1000),
        10000: result(dict, 10000),
        100000: result(dict, 100000),
        1000000: result(dict, 1000000),
    }
    head('odict')
    root = odict.odict()
    global root
    print CREATE_DELETE_ROW
    odict_results = {
        1000: result(odict.odict, 1000),
        10000: result(odict.odict, 10000),
        100000: result(odict.odict, 100000),
        1000000: result(odict.odict, 1000000),
    }
    head('relation ``dict:odict``')
    print RELATION_ROW
    for key, value in dict_results.items():
        dstart, dmid, dend = value
        ostart, omid, oend = odict_results[key]
        relation_create = (omid - ostart) / (dmid - dstart)
        relation_delete = (oend - omid) / (dend - dmid)
        relation_row('creating', key, relation_create)
        relation_row('deleting', key, relation_delete)

if __name__ == '__main__':
    run()

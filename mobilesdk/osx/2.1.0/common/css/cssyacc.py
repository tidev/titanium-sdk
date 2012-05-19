# -*- coding: utf-8 -*-
'''
A parser for CSS.
'''

import re
from ply import yacc as ply_yacc
from csslex import csslexer
import css

__all__ = ('cssparser', 'yacc', 'parsetab')

def normalize(x):
    '''Normalizes escaped characters to their literal value.'''
    p = ur'\\0{0,4}([0-9]{2})'
    r = lambda m: chr(int(m.groups()[0],16))
    return re.sub(p,r,x).lower()

def URI_value(x):
    url = normalize(x)[4:-1].strip()
    if -1 != '"\''.find(url[0]):
        url = STRING_value(url)
    return css.Uri(url)

def STRING_value(x):
    q = x[0]
    return css.String(x[1:-1].replace(u'\\'+q,q))


class cssparser(object):
    tokens = csslexer.tokens

    def p_stylesheet(self, p):
        '''
        stylesheet : charset spaces_or_sgml_comments imports statements
                   | spaces_or_sgml_comments imports statements
        '''
        if isinstance(p[1], css.Charset):
            p[0] = css.Stylesheet(p[4], p[3], p[1])
        else:
            p[0] = css.Stylesheet(p[3], p[2])
        #print p.slice

    def p_charset(self, p):
        '''
        charset : CHARSET_SYM STRING ';'
        '''
        p[0] = css.Charset(STRING_value(p[2]))

    def p_media(self, p):
        '''
        media : MEDIA_SYM spaces media_types LBRACE spaces rulesets '}' spaces
        '''
        p[0] = css.Media(p[3], p[6])

    def p_medium(self, p):
        '''
        medium : IDENT spaces
        '''
        p[0] = p[1]

    def p_page(self, p):
        '''
        page : PAGE_SYM spaces pseudo_page spaces LBRACE block_declarations '}' spaces
             | PAGE_SYM spaces LBRACE block_declarations '}' spaces
        '''
        if isinstance(p[3], css.Ident):
            p[0] = css.Page(p[6], p[3])
        else:
            p[0] = css.Page(p[4])

    def p_pseudo_page(self, p):
        '''
        pseudo_page : ':' IDENT
        '''
        p[0] = css.Ident(p[2])

    def p_import(self, p):
        '''
        import : IMPORT_SYM spaces import_source media_types spaces ';' spaces
               | IMPORT_SYM spaces import_source ';' spaces
        '''
        if isinstance(p[4], list):
            p[0] = css.Import(p[3], p[4])
        else:
            p[0] = css.Import(p[3])

    def p_operator(self, p):
        '''
        operator : '/' spaces
                 | COMMA spaces
                 | empty
        '''
        p[0] = p[1]

    def p_combinator(self, p):
        '''
        combinator : PLUS spaces
                   | GREATER spaces
                   | spaces
        '''
        p[0] = p[1]

    def p_unary_operator(self, p):
        '''
        unary_operator : '-' 
                       | PLUS
        '''
        p[0] = p[1]

    def p_property(self, p):
        '''
        property : IDENT spaces
        '''
        p[0] = css.Ident(p[1])

    def p_ruleset(self, p):
        '''
        ruleset : ruleset_selector_group LBRACE spaces block_declarations '}' spaces
        '''
        p[0] = css.Ruleset(p[1], p[4])

    def p_selector(self, p):
        '''
        selector : simple_selector simple_selectors
        '''
        p[0] = u''.join(p[1:])

    def p_simple_selector(self, p):
        '''
        simple_selector : element_name simple_selector_components
                        | simple_selector_component simple_selector_components
        '''
        p[0] = u''.join(p[1:])

    def p_simple_selectors(self, p):
        '''
        simple_selectors : combinator simple_selector simple_selectors
                         | empty
        '''
        p[0] = u''.join(p[1:])


    def p_simple_selector_component(self, p):
        '''
        simple_selector_component : HASH
                                  | class
                                  | attrib
                                  | pseudo
        '''
        p[0] = p[1]

    def p_simple_selector_components(self, p):
        '''
        simple_selector_components : simple_selector_component simple_selector_components
                                   | empty
        '''
        p[0] = u''.join(p[1:])

    def p_class(self, p):
        '''
        class : '.' IDENT
        '''
        p[0] = u''.join(p[1:])

    def p_element_name(self, p):
        '''
        element_name : IDENT
                     | '*'
        '''
        p[0] = p[1]

    def p_attrib(self, p):
        '''
        attrib : '[' spaces IDENT spaces attrib_match ']'
        '''
        p[0] = u''.join(p[1:])

    def p_pseudo(self, p):
        '''
        pseudo : ':' IDENT
               | ':' FUNCTION spaces IDENT spaces ')'
               | ':' FUNCTION spaces ')'
        '''
        p[0] = u''.join(p[1:])

    def p_declaration(self, p):
        '''
        declaration : property ':' spaces expr prio
                    | property ':' spaces expr
                    | empty
        '''
        if len(p) == 2:
            p[0] = None
        else:
            important = len(p) == 6
            p[0] = css.Declaration(p[1], p[4], important)

    def p_prio(self, p):
        '''
        prio : IMPORTANT_SYM spaces
        '''
        p[0] = p[1]

    def p_expr(self, p):
        '''
        expr : expr operator term
             | expr term
             | term
        '''
        if len(p) == 4:
            p[0] = u''.join([unicode(x) for x in p[1:]])
        elif len(p) == 3:
            p[0] = unicode(p[1]) + u' ' + unicode(p[2])
        else:
            p[0] = p[1]
    
    def p_term(self, p):
        '''
        term : unary_operator term_quant spaces
             | term_quant spaces
             | STRING spaces
             | IDENT spaces
             | URI spaces
             | hexcolor
             | function
        '''
        if isinstance(p[1], css.Function) or isinstance(p[1], css.Hexcolor):
            p[0] = p[1]
        elif p.slice[1].type == 'URI':
            p[0] = URI_value(p[1])
        elif p.slice[1].type == 'STRING':
            p[0] = STRING_value(p[1])
        elif p.slice[1].type == 'IDENT':
            p[0] = css.Ident(p[1])            
        elif -1 != '-+'.find(p[1]):
            p[0] = css.Term(p[2], p[1])
        else:
            p[0] = css.Term(p[1])
    
    def p_term_quant(self, p):
        '''
        term_quant : NUMBER
                   | PERCENTAGE
                   | LENGTH
                   | EMS
                   | EXS
                   | ANGLE
                   | TIME
                   | FREQ
        '''
        p[0] = normalize(p[1])

    def p_function(self, p):
        '''
        function : FUNCTION spaces expr ')' spaces
        '''
        name = p[1][:-1] # strip the open paren
        p[0] = css.Function(name, p[3])

    def p_hexcolor(self, p):
        '''
        hexcolor : HASH spaces
        '''
        p[0] = css.Hexcolor(p[1])

    def p_spaces(self, p):
        '''
        spaces : spaces S
               | S
               | empty
        '''
        p[0] = p[1] and u' '




    def p_imports(self, p):
        '''
        imports : imports import spaces_or_sgml_comments
                | import spaces_or_sgml_comments
                | empty
        '''
        if not p[1]:
            p[0] = []
        elif isinstance(p[1], list):
            p[0] = p[1]
            p[0].append(p[2])
        else:
            p[0] = [p[1]]

    def p_statements(self, p):
        '''
        statements : statements ruleset spaces_or_sgml_comments
                   | statements media spaces_or_sgml_comments
                   | statements page spaces_or_sgml_comments
                   | ruleset spaces_or_sgml_comments
                   | media spaces_or_sgml_comments
                   | page spaces_or_sgml_comments
                   | empty
        '''
        if not p[1]:
            p[0] = []
        elif isinstance(p[1], list):
            p[0] = p[1]
            p[0].append(p[2])
        else:
            p[0] = [p[1]]

    def p_import_source(self, p):
        '''
        import_source : STRING spaces
                      | URI spaces
        '''
        if p.slice[1].type == 'URI':
            p[0] = URI_value(p[1])
        else:
            p[0] = STRING_value(p[1])

    def p_media_types(self, p):
        '''
        media_types : media_types COMMA spaces medium
                    | medium
        '''
        if len(p) == 2:
            p[0] = [p[1]]
        else:
            p[0] = p[1]
            p[0].append(p[4])

    def p_rulesets(self, p):
        '''
        rulesets : rulesets ruleset
                 | ruleset
                 | empty
        '''
        if not p[1]:
            p[0] = []
        elif isinstance(p[1], list):
            p[0] = p[1]
            p[0].append(p[2])
        else:
            p[0] = [p[1]]

    def p_ruleset_selector_group(self, p):
        '''
        ruleset_selector_group : ruleset_selector_group COMMA spaces selector
                               | selector
        '''
        if len(p) == 2:
            p[0] = p[1:]
        else:
            p[0] = p[1] + p[4:]

    def p_block_declarations(self, p):
        '''
        block_declarations : block_declarations ';' spaces declaration
                           | declaration
        '''
        if len(p) == 2:
            p[0] = []
            if p[1]:
                p[0].append(p[1])
        else:
            p[0] = p[1]
            if p[4]:
                p[0].append(p[4])

    def p_attrib_match(self, p):
        '''
        attrib_match : '=' spaces attrib_val spaces
                     | INCLUDES spaces attrib_val spaces
                     | DASHMATCH spaces attrib_val spaces
                     | empty
        '''
        p[0] = u''.join(p[1:])

    def p_attrib_val(self, p):
        '''
        attrib_val : IDENT
                   | STRING
        '''
        p[0] = p[1]

    def p_spaces_or_sgml_comments(self, p):
        '''
        spaces_or_sgml_comments : spaces_or_sgml_comments S
                                | spaces_or_sgml_comments CDO
                                | spaces_or_sgml_comments CDC
                                | S
                                | CDO
                                | CDC
                                | empty
        '''
        p[0] = p[1] and u' '

    def p_empty(self, p):
        '''
        empty :
        '''
        p[0] = u''

    def p_error(self, p):
        print "Syntax error at '%r'" % (p,)


def yacc(**kw):
    kw['module'] = cssparser()
    if 'start' not in kw:
        kw['start'] = 'stylesheet'
    return ply_yacc.yacc(**kw)

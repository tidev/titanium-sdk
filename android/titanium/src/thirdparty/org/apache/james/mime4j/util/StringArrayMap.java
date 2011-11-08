/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.james.mime4j.util;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;


/**
 * An object, which may be used to implement header, or parameter
 * maps. The maps keys are the header or parameter names. The
 * maps values are strings (single value), lists, or arrays.
 */
public class StringArrayMap implements Serializable {
    private static final long serialVersionUID = -5833051164281786907L;
    private final Map map = new HashMap();

    /**
     * <p>Converts the given object into a string. The object may be either of:
     * <ul>
     *   <li>a string, which is returned without conversion</li>
     *   <li>a list of strings, in which case the first element is returned</li>
     *   <li>an array of strings, in which case the first element is returned</li>
     * </ul>
     */
    public static String asString(Object pValue) {
        if (pValue == null) {
            return null;
        }
        if (pValue instanceof String) {
            return (String) pValue;
        }
        if (pValue instanceof String[]) {
            return ((String[]) pValue)[0];
        }
        if (pValue instanceof List) {
            return (String) ((List) pValue).get(0);
        }
        throw new IllegalStateException("Invalid parameter class: " + pValue.getClass().getName());
    }

    /**
     * <p>Converts the given object into a string array. The object may be either of:
     * <ul>
     *   <li>a string, which is returned as an array with one element</li>
     *   <li>a list of strings, which is being converted into a string array</li>
     *   <li>an array of strings, which is returned without conversion</li>
     * </ul>
     */
    public static String[] asStringArray(Object pValue) {
        if (pValue == null) {
            return null;
        }
        if (pValue instanceof String) {
            return new String[]{(String) pValue};
        }
        if (pValue instanceof String[]) {
            return (String[]) pValue;
        }
        if (pValue instanceof List) {
            final List l = (List) pValue;
            return (String[]) l.toArray(new String[l.size()]);
        }
        throw new IllegalStateException("Invalid parameter class: " + pValue.getClass().getName());
    }

    /**
     * <p>Converts the given object into a string enumeration. The object may be either of:
     * <ul>
     *   <li>a string, which is returned as an enumeration with one element</li>
     *   <li>a list of strings, which is being converted into a string enumeration</li>
     *   <li>an array of strings, which is being converted into a string enumeration</li>
     * </ul>
     */
    public static Enumeration asStringEnum(final Object pValue) {
        if (pValue == null) {
            return null;
        }
        if (pValue instanceof String) {
            return new Enumeration(){
                private Object value = pValue;
                public boolean hasMoreElements() {
                    return value != null;
                }
                public Object nextElement() {
                    if (value == null) {
                        throw new NoSuchElementException();
                    }
                    final String s = (String) value;
                    value = null;
                    return s;
                }
            };
        }
        if (pValue instanceof String[]) {
            final String[] values = (String[]) pValue;
            return new Enumeration() {
                private int offset;
                public boolean hasMoreElements() {
                    return offset < values.length;
                }
                public Object nextElement() {
                    if (offset >= values.length) {
                        throw new NoSuchElementException();
                    }
                    return values[offset++];
                }
            };
        }
        if (pValue instanceof List) {
            return Collections.enumeration((List) pValue);
        }
        throw new IllegalStateException("Invalid parameter class: " + pValue.getClass().getName());
    }

    /**
     * Converts the given map into a string array map: The map values
     * are string arrays.
     */
    public static Map asMap(final Map pMap) {
        for (Iterator iter = pMap.entrySet().iterator();  iter.hasNext();  ) {
            final Map.Entry entry = (Map.Entry) iter.next();
            final String[] value = asStringArray(entry.getValue());
            entry.setValue(value);
        }
        return Collections.unmodifiableMap(pMap);
    }

    /**
     * Adds a value to the given map.
     */
    protected void addMapValue(Map pMap, String pName, String pValue) {
        Object o = pMap.get(pName);
        if (o == null) {
            o = pValue;
        } else if (o instanceof String) {
            final List list = new ArrayList();
            list.add(o);
            list.add(pValue);
            o = list;
        } else if (o instanceof List) {
            ((List) o).add(pValue);
        } else if (o instanceof String[]) {
            final List list = new ArrayList();
            final String[] arr = (String[]) o;
            for (int i = 0;  i < arr.length;  i++) {
                list.add(arr[i]);
            }
            list.add(pValue);
            o = list;
        } else {
            throw new IllegalStateException("Invalid object type: " + o.getClass().getName());
        }
        pMap.put(pName, o);
    }

    /**
     * Lower cases the given name.
     */
    protected String convertName(String pName) {
        return pName.toLowerCase();
    }

    /**
     * Returns the requested value.
     */
    public String getValue(String pName) {
        return asString(map.get(convertName(pName)));
    }

    /**
     * Returns the requested values as a string array.
     */
    public String[] getValues(String pName) {
        return asStringArray(map.get(convertName(pName)));
    }

    /**
     * Returns the requested values as an enumeration.
     */
    public Enumeration getValueEnum(String pName) {
        return asStringEnum(map.get(convertName(pName)));
    }

    /**
     * Returns the set of registered names as an enumeration.
     * @see #getNameArray()
     */
    public Enumeration getNames() {
        return Collections.enumeration(map.keySet());
    }

    /**
     * Returns an unmodifiable map of name/value pairs. The map keys
     * are the lower cased parameter/header names. The map values are
     * string arrays.
     */
    public Map getMap() {
        return asMap(map);
    }

    /**
     * Adds a new name/value pair.
     */
    public void addValue(String pName, String pValue) {
        addMapValue(map, convertName(pName), pValue);
    }

    /**
     * Returns the set of registered names.
     * @see #getNames()
     */
    public String[] getNameArray() {
        final Collection c = map.keySet();
        return (String[]) c.toArray(new String[c.size()]);
    }
}

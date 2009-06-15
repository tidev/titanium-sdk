/****************************************************************
 * Licensed to the Apache Software Foundation (ASF) under one   *
 * or more contributor license agreements.  See the NOTICE file *
 * distributed with this work for additional information        *
 * regarding copyright ownership.  The ASF licenses this file   *
 * to you under the Apache License, Version 2.0 (the            *
 * "License"); you may not use this file except in compliance   *
 * with the License.  You may obtain a copy of the License at   *
 *                                                              *
 *   http://www.apache.org/licenses/LICENSE-2.0                 *
 *                                                              *
 * Unless required by applicable law or agreed to in writing,   *
 * software distributed under the License is distributed on an  *
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY       *
 * KIND, either express or implied.  See the License for the    *
 * specific language governing permissions and limitations      *
 * under the License.                                           *
 ****************************************************************/

package org.apache.james.mime4j.util;

import java.nio.charset.Charset;


/**
 * Frequently used RFC 882 constants and utility methods.
 * 
 * @version $Id:$
 */
public final class MessageUtils {
 
    public static final int STRICT_IGNORE     = 1;
    public static final int STRICT_ERROR      = 2;
    public static final int LENIENT           = 3;
    
    public static final Charset ASCII = CharsetUtil.getCharset("US-ASCII");

    public static final Charset ISO_8859_1 = CharsetUtil.getCharset("ISO-8859-1");
    
    public static final Charset DEFAULT_CHARSET = ASCII;
    
    public static final String CRLF = "\r\n";
    
    public static final int CR = 13; // <US-ASCII CR, carriage return (13)>
    public static final int LF = 10; // <US-ASCII LF, linefeed (10)>
    public static final int SP = 32; // <US-ASCII SP, space (32)>
    public static final int HT = 9;  // <US-ASCII HT, horizontal-tab (9)>

    public static boolean isASCII(char ch) {
        return (0xFF80 & ch) == 0;
    }
    
    public static boolean isASCII(final String s) {
        if (s == null) {
            throw new IllegalArgumentException("String may not be null");
        }
        int len = s.length();
        for (int i = 0; i < len; i++) {
            if (!isASCII(s.charAt(i))) {
                return false;
            }
        }
        return true;
    }
    
    public static boolean isWhitespace(char ch) {
        return ch == SP || ch == HT || ch == CR || ch == LF; 
    }
    
}

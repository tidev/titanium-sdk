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

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;


/**
 * A utility class, which provides some MIME related application logic.
 */
public final class MimeUtil {
    private static final Log log = LogFactory.getLog(MimeUtil.class);
    
    /**
     * The <code>quoted-printable</code> encoding.
     */
    public static final String ENC_QUOTED_PRINTABLE = "quoted-printable";
    /**
     * The <code>binary</code> encoding.
     */
    public static final String ENC_BINARY = "binary";
    /**
     * The <code>base64</code> encoding.
     */
    public static final String ENC_BASE64 = "base64";
    /**
     * The <code>8bit</code> encoding.
     */
    public static final String ENC_8BIT = "8bit";
    /**
     * The <code>7bit</code> encoding.
     */
    public static final String ENC_7BIT = "7bit";

    /** <code>MIME-Version</code> header name (lowercase) */
    public static final String MIME_HEADER_MIME_VERSION = "mime-version";
    /** <code>Content-ID</code> header name (lowercase) */
    public static final String MIME_HEADER_CONTENT_ID = "content-id";
    /** <code>Content-Description</code> header name (lowercase) */
    public static final String MIME_HEADER_CONTENT_DESCRIPTION = "content-description";
    /** 
     * <code>Content-Disposition</code> header name (lowercase). 
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>. 
     */
    public static final String MIME_HEADER_CONTENT_DISPOSITION = "content-disposition";
    /** 
     * <code>Content-Disposition</code> filename parameter (lowercase). 
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>. 
     */
    public static final String PARAM_FILENAME = "filename";
    /** 
     * <code>Content-Disposition</code> modification-date parameter (lowercase). 
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>. 
     */
    public static final String PARAM_MODIFICATION_DATE = "modification-date";
    /** 
     * <code>Content-Disposition</code> creation-date parameter (lowercase). 
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>. 
     */
    public static final String PARAM_CREATION_DATE = "creation-date";
    /** 
     * <code>Content-Disposition</code> read-date parameter (lowercase). 
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>. 
     */
    public static final String PARAM_READ_DATE = "read-date";
    /** 
     * <code>Content-Disposition</code> size parameter (lowercase). 
     * See <a href='http://www.faqs.org/rfcs/rfc2183.html'>RFC2183</a>. 
     */
    public static final String PARAM_SIZE = "size";
    /**
     * <code>Content-Langauge</code> header (lower case).
     * See <a href='http://www.faqs.org/rfcs/rfc4646.html'>RFC4646</a>.
     */
    public static final String MIME_HEADER_LANGAUGE = "content-language";
    /**
     * <code>Content-Location</code> header (lower case).
     * See <a href='http://www.faqs.org/rfcs/rfc2557.html'>RFC2557</a>.
     */
    public static final String MIME_HEADER_LOCATION = "content-location";
    /**
     * <code>Content-MD5</code> header (lower case).
     * See <a href='http://www.faqs.org/rfcs/rfc1864.html'>RFC1864</a>.
     */
    public static final String MIME_HEADER_MD5 = "content-md5";

    // used to create unique ids
    private static final Random random = new Random();
    
    // used to create unique ids
    private static int counter = 0;

    private MimeUtil() {
        // this is an utility class to be used statically.
        // this constructor protect from instantiation.
    }
    
    /**
     * Returns, whether the given two MIME types are identical.
     */
    public static boolean isSameMimeType(String pType1, String pType2) {
        return pType1 != null  &&  pType2 != null  &&  pType1.equalsIgnoreCase(pType2);
    }

    /**
     * Returns true, if the given MIME type is that of a message. 
     */
    public static boolean isMessage(String pMimeType) {
        return pMimeType != null  &&  pMimeType.equalsIgnoreCase("message/rfc822");
    }

    /**
     * Return true, if the given MIME type indicates a multipart entity.
     */
    public static boolean isMultipart(String pMimeType) {
        return pMimeType != null  &&  pMimeType.toLowerCase().startsWith("multipart/");
    }

    /**
     * Returns, whether the given transfer-encoding is "base64".
     */
    public static boolean isBase64Encoding(String pTransferEncoding) {
        return ENC_BASE64.equalsIgnoreCase(pTransferEncoding);
    }

    /**
     * Returns, whether the given transfer-encoding is "quoted-printable".
     */
    public static boolean isQuotedPrintableEncoded(String pTransferEncoding) {
        return ENC_QUOTED_PRINTABLE.equals(pTransferEncoding);
    }

    /**
     * <p>Parses a complex field value into a map of key/value pairs. You may
     * use this, for example, to parse a definition like
     * <pre>
     *   text/plain; charset=UTF-8; boundary=foobar
     * </pre>
     * The above example would return a map with the keys "", "charset",
     * and "boundary", and the values "text/plain", "UTF-8", and "foobar".
     * </p><p>
     * Header value will be unfolded and excess white space trimmed.
     * </p>
     * @param pValue The field value to parse.
     * @return The result map; use the key "" to retrieve the first value.
     */
    public static Map getHeaderParams(String pValue) {
        pValue = pValue.trim();
        
        /*
         * Unfold Content-Type value
         */
        CharArrayBuffer sb = new CharArrayBuffer(128);
        for (int i = 0; i < pValue.length(); i++) {
            char c = pValue.charAt(i);
            if (c == '\r' || c == '\n') {
                continue;
            }
            sb.append(c);
        }
        pValue = sb.toString();
        
        Map result = new HashMap();

        // split main value and parameters
        String main;
        String rest;
        if (pValue.indexOf(";") == -1) {
            main = pValue;
            rest = null;
        } else {
            main = pValue.substring(0, pValue.indexOf(";"));
            rest = pValue.substring(main.length() + 1);
        }

        result.put("", main);
        if (rest != null) {
            char[] chars = rest.toCharArray();
            CharArrayBuffer paramName = new CharArrayBuffer(64);
            CharArrayBuffer paramValue = new CharArrayBuffer(64);

            final byte READY_FOR_NAME = 0;
            final byte IN_NAME = 1;
            final byte READY_FOR_VALUE = 2;
            final byte IN_VALUE = 3;
            final byte IN_QUOTED_VALUE = 4;
            final byte VALUE_DONE = 5;
            final byte ERROR = 99;

            byte state = READY_FOR_NAME;
            boolean escaped = false;
            for (int i = 0; i < chars.length; i++) {
                char c = chars[i];

                switch (state) {
                    case ERROR:
                        if (c == ';')
                            state = READY_FOR_NAME;
                        break;

                    case READY_FOR_NAME:
                        if (c == '=') {
                            log.error("Expected header param name, got '='");
                            state = ERROR;
                            break;
                        }

                        paramName = new CharArrayBuffer(64);
                        paramValue = new CharArrayBuffer(64);

                        state = IN_NAME;
                        // fall-through

                    case IN_NAME:
                        if (c == '=') {
                            if (paramName.length() == 0)
                                state = ERROR;
                            else
                                state = READY_FOR_VALUE;
                            break;
                        }

                        // not '='... just add to name
                        paramName.append(c);
                        break;

                    case READY_FOR_VALUE:
                        boolean fallThrough = false;
                        switch (c) {
                            case ' ':
                            case '\t':
                                break;  // ignore spaces, especially before '"'

                            case '"':
                                state = IN_QUOTED_VALUE;
                                break;

                            default:
                                state = IN_VALUE;
                                fallThrough = true;
                                break;
                        }
                        if (!fallThrough)
                            break;

                        // fall-through

                    case IN_VALUE:
                        fallThrough = false;
                        switch (c) {
                            case ';':
                            case ' ':
                            case '\t':
                                result.put(
                                   paramName.toString().trim().toLowerCase(),
                                   paramValue.toString().trim());
                                state = VALUE_DONE;
                                fallThrough = true;
                                break;
                            default:
                                paramValue.append(c);
                                break;
                        }
                        if (!fallThrough)
                            break;

                    case VALUE_DONE:
                        switch (c) {
                            case ';':
                                state = READY_FOR_NAME;
                                break;

                            case ' ':
                            case '\t':
                                break;

                            default:
                                state = ERROR;
                                break;
                        }
                        break;
                        
                    case IN_QUOTED_VALUE:
                        switch (c) {
                            case '"':
                                if (!escaped) {
                                    // don't trim quoted strings; the spaces could be intentional.
                                    result.put(
                                            paramName.toString().trim().toLowerCase(),
                                            paramValue.toString());
                                    state = VALUE_DONE;
                                } else {
                                    escaped = false;
                                    paramValue.append(c);                                    
                                }
                                break;
                                
                            case '\\':
                                if (escaped) {
                                    paramValue.append('\\');
                                }
                                escaped = !escaped;
                                break;

                            default:
                                if (escaped) {
                                    paramValue.append('\\');
                                }
                                escaped = false;
                                paramValue.append(c);
                                break;
                        }
                        break;

                }
            }

            // done looping.  check if anything is left over.
            if (state == IN_VALUE) {
                result.put(
                        paramName.toString().trim().toLowerCase(),
                        paramValue.toString().trim());
            }
        }

        return result;
    }

    /**
     * Creates a new unique message boundary string that can be used as boundary
     * parameter for the Content-Type header field of a message.
     * 
     * @return a new unique message boundary string.
     */
    public static String createUniqueBoundary() {
        StringBuffer sb = new StringBuffer();
        sb.append("-=Part.");
        sb.append(Integer.toHexString(nextCounterValue()));
        sb.append('.');
        sb.append(Long.toHexString(random.nextLong()));
        sb.append('.');
        sb.append(Long.toHexString(System.currentTimeMillis()));
        sb.append('.');
        sb.append(Long.toHexString(random.nextLong()));
        sb.append("=-");
        return sb.toString();
    }

    /**
     * Creates a new unique message identifier that can be used in message
     * header field such as Message-ID or In-Reply-To. If the given host name is
     * not <code>null</code> it will be used as suffix for the message ID
     * (following an at sign).
     * 
     * The resulting string is enclosed in angle brackets (&lt; and &gt;);
     * 
     * @param hostName host name to be included in the message ID or
     *            <code>null</code> if no host name should be included.
     * @return a new unique message identifier.
     */
    public static String createUniqueMessageId(String hostName) {
        StringBuffer sb = new StringBuffer("<Mime4j.");
        sb.append(Integer.toHexString(nextCounterValue()));
        sb.append('.');
        sb.append(Long.toHexString(random.nextLong()));
        sb.append('.');
        sb.append(Long.toHexString(System.currentTimeMillis()));
        if (hostName != null) {
            sb.append('@');
            sb.append(hostName);
        }
        sb.append('>');
        return sb.toString();
    }

    private static synchronized int nextCounterValue() {
        return counter++;
    }
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.james.mime4j.descriptor;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.james.mime4j.util.MimeUtil;

/**
 * Encapsulates the values of the MIME-specific header fields 
 * (which starts with <code>Content-</code>). 
 *
 * 
 * @version $Id: BodyDescriptor.java,v 1.4 2005/02/11 10:08:37 ntherning Exp $
 */
public class DefaultBodyDescriptor implements MutableBodyDescriptor {
    private static final String US_ASCII = "us-ascii";

    private static final String SUB_TYPE_EMAIL = "rfc822";

    private static final String MEDIA_TYPE_TEXT = "text";

    private static final String MEDIA_TYPE_MESSAGE = "message";

    private static final String EMAIL_MESSAGE_MIME_TYPE = MEDIA_TYPE_MESSAGE + "/" + SUB_TYPE_EMAIL;

    private static final String DEFAULT_SUB_TYPE = "plain";

    private static final String DEFAULT_MEDIA_TYPE = MEDIA_TYPE_TEXT;

    private static final String DEFAULT_MIME_TYPE = DEFAULT_MEDIA_TYPE + "/" + DEFAULT_SUB_TYPE;

    private static Log log = LogFactory.getLog(DefaultBodyDescriptor.class);
    
    private String mediaType = DEFAULT_MEDIA_TYPE;
    private String subType = DEFAULT_SUB_TYPE;
    private String mimeType = DEFAULT_MIME_TYPE;
    private String boundary = null;
    private String charset = US_ASCII;
    private String transferEncoding = "7bit";
    private Map parameters = new HashMap();
    private boolean contentTypeSet;
    private boolean contentTransferEncSet;
    private long contentLength = -1;
    
    /**
     * Creates a new root <code>BodyDescriptor</code> instance.
     */
    public DefaultBodyDescriptor() {
        this(null);
    }

    /**
     * Creates a new <code>BodyDescriptor</code> instance.
     * 
     * @param parent the descriptor of the parent or <code>null</code> if this
     *        is the root descriptor.
     */
    public DefaultBodyDescriptor(BodyDescriptor parent) {
        if (parent != null && MimeUtil.isSameMimeType("multipart/digest", parent.getMimeType())) {
            mimeType = EMAIL_MESSAGE_MIME_TYPE;
            subType = SUB_TYPE_EMAIL;
            mediaType = MEDIA_TYPE_MESSAGE;
        } else {
            mimeType = DEFAULT_MIME_TYPE;
            subType = DEFAULT_SUB_TYPE;
            mediaType = DEFAULT_MEDIA_TYPE;
        }
    }
    
    /**
     * Should be called for each <code>Content-</code> header field of 
     * a MIME message or part.
     * 
     * @param name the field name.
     * @param value the field value.
     */
    public void addField(String name, String value) {
        
        name = name.trim().toLowerCase();
        
        if (name.equals("content-transfer-encoding") && !contentTransferEncSet) {
            contentTransferEncSet = true;
            
            value = value.trim().toLowerCase();
            if (value.length() > 0) {
                transferEncoding = value;
            }
            
        } else if (name.equals("content-length")  &&  contentLength != -1) {
            try {
                contentLength = Long.parseLong(value.trim());
            } catch (NumberFormatException e) {
                log.error("Invalid content-length: " + value);
            }
        } else if (name.equals("content-type") && !contentTypeSet) {
            parseContentType(value);
        }
    }

    private void parseContentType(String value) {
        contentTypeSet = true;
        
        Map params = MimeUtil.getHeaderParams(value);
        
        String main = (String) params.get("");
        String type = null;
        String subtype = null;
        if (main != null) {
            main = main.toLowerCase().trim();
            int index = main.indexOf('/');
            boolean valid = false;
            if (index != -1) {
                type = main.substring(0, index).trim();
                subtype = main.substring(index + 1).trim();
                if (type.length() > 0 && subtype.length() > 0) {
                    main = type + "/" + subtype;
                    valid = true;
                }
            }
            
            if (!valid) {
                main = null;
                type = null;
                subtype = null;
            }
        }
        String b = (String) params.get("boundary");
        
        if (main != null 
                && ((main.startsWith("multipart/") && b != null) 
                        || !main.startsWith("multipart/"))) {
            
            mimeType = main;
            this.subType = subtype;
            this.mediaType = type;
        }
        
        if (MimeUtil.isMultipart(mimeType)) {
            boundary = b;
        }
        
        String c = (String) params.get("charset");
        charset = null;
        if (c != null) {
            c = c.trim();
            if (c.length() > 0) {
                charset = c.toLowerCase();
            }
        }
        if (charset == null && MEDIA_TYPE_TEXT.equals(mediaType)) {
            charset = US_ASCII;
        }
        
        /*
         * Add all other parameters to parameters.
         */
        parameters.putAll(params);
        parameters.remove("");
        parameters.remove("boundary");
        parameters.remove("charset");
    }

    /**
     * Return the MimeType 
     * 
     * @return mimeType
     */
    public String getMimeType() {
        return mimeType;
    }
    
    /**
     * Return the boundary
     * 
     * @return boundary
     */
    public String getBoundary() {
        return boundary;
    }
    
    /**
     * Return the charset
     * 
     * @return charset
     */
    public String getCharset() {
        return charset;
    }
    
    /**
     * Return all parameters for the BodyDescriptor
     * 
     * @return parameters
     */
    public Map getContentTypeParameters() {
        return parameters;
    }
    
    /**
     * Return the TransferEncoding
     * 
     * @return transferEncoding
     */
    public String getTransferEncoding() {
        return transferEncoding;
    }
    
    public String toString() {
        return mimeType;
    }

    public long getContentLength() {
        return contentLength;
    }

    public String getMediaType() {
        return mediaType;
    }

    public String getSubType() {
        return subType;
    }
}

/*
 * $HeadURL: https://svn.apache.org/repos/asf/httpcomponents/httpclient/trunk/module-httpmime/src/main/java/org/apache/http/entity/mime/MultipartEntity.java $
 * $Revision: 705898 $
 * $Date: 2008-10-18 19:14:05 +0200 (Sat, 18 Oct 2008) $
 *
 * ====================================================================
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
 * ====================================================================
 *
 * This software consists of voluntary contributions made by many
 * individuals on behalf of the Apache Software Foundation.  For more
 * information on the Apache Software Foundation, please see
 * <http://www.apache.org/>.
 *
 */

package org.apache.http.entity.mime;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.entity.mime.content.ContentBody;
import org.apache.http.message.BasicHeader;
import org.apache.http.protocol.HTTP;
import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.field.Field;
import org.apache.james.mime4j.message.Message;

/**
 * Multipart/form coded HTTP entity consisting of multiple
 * body parts. 
 * 
 * @author <a href="mailto:oleg at ural.ru">Oleg Kalnichevski</a>
 */
public class MultipartEntity implements HttpEntity {

    /**
     * The pool of ASCII chars to be used for generating a multipart boundary.
     */
    private final static char[] MULTIPART_CHARS = 
        "-_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            .toCharArray();
    
    private final Message message;
    private final HttpMultipart multipart;
    private final Header contentType;
    
    private long length;
    private boolean dirty;
    
    public MultipartEntity(
            HttpMultipartMode mode, 
            final String boundary,
            final Charset charset) {
        super();
        this.multipart = new HttpMultipart("form-data");
        this.contentType = new BasicHeader(
                HTTP.CONTENT_TYPE,
                generateContentType(boundary, charset));
        this.dirty = true;
        
        this.message = new Message();
        org.apache.james.mime4j.message.Header header = 
          new org.apache.james.mime4j.message.Header();
        this.message.setHeader(header);
        this.multipart.setParent(message);
        if (mode == null) {
            mode = HttpMultipartMode.STRICT;
        }
        this.multipart.setMode(mode);
        addField("Content-Type: " + this.contentType.getValue());
    }

    public MultipartEntity(final HttpMultipartMode mode) {
        this(mode, null, null);
    }

    public MultipartEntity() {
        this(HttpMultipartMode.STRICT, null, null);
    }

    protected String generateContentType(
            final String boundary,
            final Charset charset) {
        StringBuilder buffer = new StringBuilder();
        buffer.append("multipart/form-data; boundary=");
        if (boundary != null) {
            buffer.append(boundary);
        } else {
            Random rand = new Random();
            int count = rand.nextInt(11) + 30; // a random size from 30 to 40
            for (int i = 0; i < count; i++) {
                buffer.append(MULTIPART_CHARS[rand.nextInt(MULTIPART_CHARS.length)]);
            }
        }
        if (charset != null) {
            buffer.append("; charset=");
            buffer.append(charset.name());
        }
        return buffer.toString();
    }

    public void addPart(final String name, final ContentBody contentBody) {
        this.multipart.addBodyPart(new FormBodyPart(name, contentBody));
        this.dirty = true;
    }
  
    public boolean isRepeatable() {
        List<?> parts = this.multipart.getBodyParts();
        for (Iterator<?> it = parts.iterator(); it.hasNext(); ) {
            FormBodyPart part = (FormBodyPart) it.next();
            ContentBody body = (ContentBody) part.getBody();
            if (body.getContentLength() < 0) {
                return false;
            }
        }
        return true;
    }

    public boolean isChunked() {
        return !isRepeatable();
    }

    public boolean isStreaming() {
        return !isRepeatable();
    }

    public long getContentLength() {
        if (this.dirty) {
            this.length = this.multipart.getTotalLength();
            this.dirty = false;
        }
        return this.length;
    }

    public Header getContentType() {
        return this.contentType;
    }

    public Header getContentEncoding() {
        return null;
    }

    public void consumeContent()
        throws IOException, UnsupportedOperationException{
        if (isStreaming()) {
            throw new UnsupportedOperationException(
                    "Streaming entity does not implement #consumeContent()");
        }
    }

    public InputStream getContent() throws IOException, UnsupportedOperationException {
        throw new UnsupportedOperationException(
                    "Multipart form entity does not implement #getContent()");
    }

    public void writeTo(final OutputStream outstream) throws IOException {
        this.multipart.writeTo(outstream);
    }

    private void addField(final String s) {
        try {
            this.message.getHeader().addField(Field.parse(s));
        } catch (MimeException ex) {
            // Should never happen
            throw new UnexpectedMimeException(ex);
        }
    }
    
}

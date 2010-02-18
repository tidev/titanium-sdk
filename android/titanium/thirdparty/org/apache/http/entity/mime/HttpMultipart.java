/*
 * $HeadURL: https://svn.apache.org/repos/asf/httpcomponents/httpclient/trunk/module-httpmime/src/main/java/org/apache/http/entity/mime/HttpMultipart.java $
 * $Revision: 675712 $
 * $Date: 2008-07-10 22:16:33 +0200 (Thu, 10 Jul 2008) $
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

import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.Charset;
import java.util.List;

import org.apache.http.entity.mime.content.ContentBody;
import org.apache.http.protocol.HTTP;
import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.field.ContentTypeField;
import org.apache.james.mime4j.field.Field;
import org.apache.james.mime4j.message.Body;
import org.apache.james.mime4j.message.BodyPart;
import org.apache.james.mime4j.message.Entity;
import org.apache.james.mime4j.message.Multipart;
import org.apache.james.mime4j.util.CharsetUtil;
import org.apache.james.mime4j.util.MessageUtils;

/**
 * An extension of the mime4j standard {@link Multipart} class, which is
 * capable of operating either in the strict (fully RFC 822, RFC 2045, 
 * RFC 2046 compliant) or the browser compatible modes.
 * 
 * @author <a href="mailto:oleg at ural.ru">Oleg Kalnichevski</a>
 */
public class HttpMultipart extends Multipart {

    private HttpMultipartMode mode;
    
    public HttpMultipart(final String subType) {
        super(subType);
        this.mode = HttpMultipartMode.STRICT;
    }
    
    public HttpMultipartMode getMode() {
        return this.mode;
    }

    public void setMode(final HttpMultipartMode mode) {
        this.mode = mode;
    }

    protected Charset getCharset() {
        Entity e = getParent();
        ContentTypeField cField = (ContentTypeField) e.getHeader().getField(
                Field.CONTENT_TYPE);
        Charset charset = null;
        
        switch (this.mode) {
        case STRICT:
            charset = MIME.DEFAULT_CHARSET;
            break;
        case BROWSER_COMPATIBLE:
            if (cField.getCharset() != null) {
                charset = CharsetUtil.getCharset(cField.getCharset());
            } else {
                charset = CharsetUtil.getCharset(HTTP.DEFAULT_CONTENT_CHARSET);
            }
            break;
        }
        return charset;
    }
    
    protected String getBoundary() {
        Entity e = getParent();
        ContentTypeField cField = (ContentTypeField) e.getHeader().getField(
                Field.CONTENT_TYPE);
        return cField.getBoundary();
    }

    private void doWriteTo(
        final HttpMultipartMode mode, 
        final OutputStream out, 
        boolean writeContent) throws IOException {
        
        List<?> bodyParts = getBodyParts();
        Charset charset = getCharset();
        String boundary = getBoundary();

        BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(out, charset),
                8192);
        
        switch (mode) {
        case STRICT:
            String preamble = getPreamble();
            if (preamble != null && preamble.length() != 0) {
                writer.write(preamble);
                writer.write("\r\n");
            }

            for (int i = 0; i < bodyParts.size(); i++) {
                writer.write("--");
                writer.write(boundary);
                writer.write("\r\n");
                writer.flush();
                BodyPart part = (BodyPart) bodyParts.get(i);
                part.getHeader().writeTo(out, MessageUtils.STRICT_IGNORE);
                if (writeContent) {
                    part.getBody().writeTo(out, MessageUtils.STRICT_IGNORE);
                }
                writer.write("\r\n");
            }

            writer.write("--");
            writer.write(boundary);
            writer.write("--\r\n");
            String epilogue = getEpilogue();
            if (epilogue != null && epilogue.length() != 0) {
                writer.write(epilogue);
                writer.write("\r\n");
            }
            writer.flush();
            break;
        case BROWSER_COMPATIBLE:

            // (1) Do not write preamble and epilogue
            // (2) Only write Content-Disposition 
            // (3) Use content charset
            
            for (int i = 0; i < bodyParts.size(); i++) {
                writer.write("--");
                writer.write(boundary);
                writer.write("\r\n");
                writer.flush();
                BodyPart part = (BodyPart) bodyParts.get(i);
                
                Field cd = part.getHeader().getField(MIME.CONTENT_DISPOSITION);
                writer.write(cd.toString());
                writer.write("\r\n");
                writer.write("\r\n");
                writer.flush();
                if (writeContent) {
                    part.getBody().writeTo(out, MessageUtils.LENIENT);
                }
                
                writer.write("\r\n");
            }

            writer.write("--");
            writer.write(boundary);
            writer.write("--\r\n");
            writer.flush();
            break;
        }
    }

    /**
     * Writes out the content in the multipart/form encoding. This method 
     * produces slightly different formatting depending on its compatibility 
     * mode.
     * 
     * @see #getMode()
     */
    public void writeTo(final OutputStream out) throws IOException {
        doWriteTo(this.mode, out, true);
    }

    @Override
    public void writeTo(final OutputStream out, int mode) throws IOException, MimeException {
        if (mode == MessageUtils.LENIENT) {
            doWriteTo(HttpMultipartMode.BROWSER_COMPATIBLE, out, true);
        } else {
            doWriteTo(HttpMultipartMode.STRICT, out, true);
        }
    }

    /**
     * Determines the total length of the multipart content (content length of 
     * individual parts plus that of extra elements required to delimit the parts 
     * from one another). If any of the @{link BodyPart}s contained in this object 
     * is of a streaming entity of unknown length the total length is also unknown.
     * <p/>
     * This method buffers only a small amount of data in order to determine the
     * total length of the entire entity. The content of individual parts is not 
     * buffered.  
     * 
     * @return total length of the multipart entity if known, <code>-1</code> 
     *   otherwise.
     */
    public long getTotalLength() {
        List<?> bodyParts = getBodyParts();

        long contentLen = 0;
        for (int i = 0; i < bodyParts.size(); i++) {
            BodyPart part = (BodyPart) bodyParts.get(i);
            Body body = part.getBody();
            if (body instanceof ContentBody) {
                long len = ((ContentBody) body).getContentLength();
                if (len >= 0) {
                    contentLen += len;
                } else {
                    return -1;
                }
            } else {
                return -1;
            }
        }
            
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            doWriteTo(this.mode, out, false);
            byte[] extra = out.toByteArray();
            return contentLen + extra.length;
        } catch (IOException ex) {
            // Should never happen
            return -1;
        }
    }
    
}

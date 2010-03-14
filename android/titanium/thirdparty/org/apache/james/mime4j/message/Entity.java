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

package org.apache.james.mime4j.message;

import java.io.IOException;
import java.io.OutputStream;

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.decoder.CodecUtil;
import org.apache.james.mime4j.field.ContentTransferEncodingField;
import org.apache.james.mime4j.field.ContentTypeField;
import org.apache.james.mime4j.field.Field;
import org.apache.james.mime4j.util.MessageUtils;
import org.apache.james.mime4j.util.MimeUtil;

/**
 * MIME entity. An entity has a header and a body (see RFC 2045).
 *
 * 
 * @version $Id: Entity.java,v 1.3 2004/10/02 12:41:11 ntherning Exp $
 */
public abstract class Entity implements Disposable {
    private Header header = null;
    private Body body = null;
    private Entity parent = null;

    /**
     * Gets the parent entity of this entity.
     * Returns <code>null</code> if this is the root entity.
     * 
     * @return the parent or <code>null</code>.
     */
    public Entity getParent() {
        return parent;
    }
    
    /**
     * Sets the parent entity of this entity.
     * 
     * @param parent the parent entity or <code>null</code> if
     *        this will be the root entity.
     */
    public void setParent(Entity parent) {
        this.parent = parent;
    }
    
    /**
     * Gets the entity header.
     * 
     * @return the header.
     */
    public Header getHeader() {
        return header;
    }
    
    /**
     * Sets the entity header.
     * 
     * @param header the header.
     */
    public void setHeader(Header header) {
        this.header = header;
    }
    
    /**
     * Gets the body of this entity.
     * 
     * @return the body,
     */
    public Body getBody() {
        return body;
    }

    /**
     * Sets the body of this entity.
     * 
     * @param body the body.
     */
    public void setBody(Body body) {
        this.body = body;
        body.setParent(this);
    }
    
    /**
     * Determines the MIME type of this <code>Entity</code>. The MIME type
     * is derived by looking at the parent's Content-Type field if no
     * Content-Type field is set for this <code>Entity</code>.
     * 
     * @return the MIME type.
     */
    public String getMimeType() {
        ContentTypeField child = 
            (ContentTypeField) getHeader().getField(Field.CONTENT_TYPE);
        ContentTypeField parent = getParent() != null 
            ? (ContentTypeField) getParent().getHeader().
                                                getField(Field.CONTENT_TYPE)
            : null;
        
        return ContentTypeField.getMimeType(child, parent);
    }
    
    /**
     * Determines the MIME character set encoding of this <code>Entity</code>.
     * 
     * @return the MIME character set encoding.
     */
    public String getCharset() {
        return ContentTypeField.getCharset( 
            (ContentTypeField) getHeader().getField(Field.CONTENT_TYPE));
    }
    
    /**
     * Determines the transfer encoding of this <code>Entity</code>.
     * 
     * @return the transfer encoding.
     */
    public String getContentTransferEncoding() {
        ContentTransferEncodingField f = (ContentTransferEncodingField) 
                        getHeader().getField(Field.CONTENT_TRANSFER_ENCODING);
        
        return ContentTransferEncodingField.getEncoding(f);
    }
    
    /**
     * Determines if the MIME type of this <code>Entity</code> matches the
     * given one. MIME types are case-insensitive.
     * 
     * @param type the MIME type to match against.
     * @return <code>true</code> on match, <code>false</code> otherwise.
     */
    public boolean isMimeType(String type) {
        return getMimeType().equalsIgnoreCase(type);
    }
    
    /**
     * Determines if the MIME type of this <code>Entity</code> is
     * <code>multipart/*</code>. Since multipart-entities must have
     * a boundary parameter in the <code>Content-Type</code> field this
     * method returns <code>false</code> if no boundary exists.
     * 
     * @return <code>true</code> on match, <code>false</code> otherwise.
     */
    public boolean isMultipart() {
        ContentTypeField f = 
            (ContentTypeField) getHeader().getField(Field.CONTENT_TYPE);
        return f != null && f.getBoundary() != null 
            && getMimeType().startsWith(ContentTypeField.TYPE_MULTIPART_PREFIX);
    }
    
    /**
     * Write the content to the given outputstream
     * 
     * @param out the outputstream to write to
     * @param mode compatibility mode:
     *   {@link MessageUtils#LENIENT}, {@link MessageUtils#STRICT_ERROR}, {@link MessageUtils#STRICT_IGNORE}  
     * @throws IOException 
     */
    public void writeTo(OutputStream out, int mode) throws IOException, MimeException {
        getHeader().writeTo(out, mode);
        
        out.flush();
        
        final Body body = getBody();

        OutputStream encOut;
        if (MimeUtil.ENC_BASE64.equals(getContentTransferEncoding())) {
            encOut = CodecUtil.wrapBase64(out);
        } else if (MimeUtil.ENC_QUOTED_PRINTABLE.equals(getContentTransferEncoding())) {
            encOut = CodecUtil.wrapQuotedPrintable(out, (body instanceof BinaryBody));
        } else {
            encOut = out;
        }
        body.writeTo(encOut, mode);
        encOut.flush();
        // the Base64 output streams requires closing of the stream but
        // we don't want it to close the inner stream so we override the behaviour
        // for the wrapping stream writer.
        if (encOut != out) encOut.close();
    }

    /**
     * Disposes the body of this entity. Note that the dispose call does not get
     * forwarded to the parent entity of this Entity.
     * 
     * Subclasses that need to free resources should override this method and
     * invoke super.dispose().
     * 
     * @see org.apache.james.mime4j.message.Disposable#dispose()
     */
    public void dispose() {
        if (body != null) {
            body.dispose();
        }
    }

}

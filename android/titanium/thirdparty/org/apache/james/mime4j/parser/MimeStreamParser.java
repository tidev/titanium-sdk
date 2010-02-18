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

package org.apache.james.mime4j.parser;

import java.io.IOException;
import java.io.InputStream;

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.descriptor.BodyDescriptor;

/**
 * <p>
 * Parses MIME (or RFC822) message streams of bytes or characters and reports 
 * parsing events to a <code>ContentHandler</code> instance.
 * </p>
 * <p>
 * Typical usage:<br/>
 * <pre>
 *      ContentHandler handler = new MyHandler();
 *      MimeStreamParser parser = new MimeStreamParser();
 *      parser.setContentHandler(handler);
 *      parser.parse(new FileInputStream("mime.msg"));
 * </pre>
 * 
 * @version $Id: MimeStreamParser.java,v 1.8 2005/02/11 10:12:02 ntherning Exp $
 */
public class MimeStreamParser {

    private ContentHandler handler = null;
    private boolean contentDecoding;
    
    private final MimeTokenStream mimeTokenStream;

    public MimeStreamParser(final MimeEntityConfig config) {
        super();
        MimeEntityConfig localConfig;
        if (config != null) {
            try {
                localConfig = (MimeEntityConfig) config.clone();
            } catch (CloneNotSupportedException ex) {
                // should never happen
                localConfig = new MimeEntityConfig();
            }
        } else {
            localConfig = new MimeEntityConfig();
        }
        this.mimeTokenStream = new MimeTokenStream(localConfig);
        this.contentDecoding = false;
    }
    
    public MimeStreamParser() {
        this(null);
    }
    
    /**
     * Determines whether this parser automatically decodes body content
     * based on the on the MIME fields with the standard defaults.
     */ 
    public boolean isContentDecoding() {
        return contentDecoding;
    }

    /**
     * Defines whether parser should automatically decode body content
     * based on the on the MIME fields with the standard defaults.
     */ 
    public void setContentDecoding(boolean b) {
        this.contentDecoding = b;
    }

    /**
     * Parses a stream of bytes containing a MIME message.
     * 
     * @param is the stream to parse.
     * @throws MimeException if the message can not be processed
     * @throws IOException on I/O errors.
     */
    public void parse(InputStream is) throws MimeException, IOException {
        mimeTokenStream.parse(is);
        OUTER: for (;;) {
            int state = mimeTokenStream.getState();
            switch (state) {
                case MimeTokenStream.T_BODY:
                    BodyDescriptor desc = mimeTokenStream.getBodyDescriptor();
                    InputStream bodyContent;
                    if (contentDecoding) {
                        bodyContent = mimeTokenStream.getDecodedInputStream(); 
                    } else {
                        bodyContent = mimeTokenStream.getInputStream(); 
                    }
                    handler.body(desc, bodyContent);
                    break;
                case MimeTokenStream.T_END_BODYPART:
                    handler.endBodyPart();
                    break;
                case MimeTokenStream.T_END_HEADER:
                    handler.endHeader();
                    break;
                case MimeTokenStream.T_END_MESSAGE:
                    handler.endMessage();
                    break;
                case MimeTokenStream.T_END_MULTIPART:
                    handler.endMultipart();
                    break;
                case MimeTokenStream.T_END_OF_STREAM:
                    break OUTER;
                case MimeTokenStream.T_EPILOGUE:
                    handler.epilogue(mimeTokenStream.getInputStream());
                    break;
                case MimeTokenStream.T_FIELD:
                    handler.field(mimeTokenStream.getField());
                    break;
                case MimeTokenStream.T_PREAMBLE:
                    handler.preamble(mimeTokenStream.getInputStream());
                    break;
                case MimeTokenStream.T_RAW_ENTITY:
                    handler.raw(mimeTokenStream.getInputStream());
                    break;
                case MimeTokenStream.T_START_BODYPART:
                    handler.startBodyPart();
                    break;
                case MimeTokenStream.T_START_HEADER:
                    handler.startHeader();
                    break;
                case MimeTokenStream.T_START_MESSAGE:
                    handler.startMessage();
                    break;
                case MimeTokenStream.T_START_MULTIPART:
                    handler.startMultipart(mimeTokenStream.getBodyDescriptor());
                    break;
                default:
                    throw new IllegalStateException("Invalid state: " + state);
            }
            state = mimeTokenStream.next();
        }
    }
    
    /**
     * Determines if this parser is currently in raw mode.
     * 
     * @return <code>true</code> if in raw mode, <code>false</code>
     *         otherwise.
     * @see #setRaw(boolean)
     */
    public boolean isRaw() {
        return mimeTokenStream.isRaw();
    }
    
    /**
     * Enables or disables raw mode. In raw mode all future entities 
     * (messages or body parts) in the stream will be reported to the
     * {@link ContentHandler#raw(InputStream)} handler method only.
     * The stream will contain the entire unparsed entity contents 
     * including header fields and whatever is in the body.
     * 
     * @param raw <code>true</code> enables raw mode, <code>false</code>
     *        disables it.
     */
    public void setRaw(boolean raw) {
        mimeTokenStream.setRecursionMode(MimeTokenStream.M_RAW);
    }
    
    /**
     * Finishes the parsing and stops reading lines.
     * NOTE: No more lines will be parsed but the parser
     * will still call 
     * {@link ContentHandler#endMultipart()},
     * {@link ContentHandler#endBodyPart()},
     * {@link ContentHandler#endMessage()}, etc to match previous calls
     * to 
     * {@link ContentHandler#startMultipart(BodyDescriptor)},
     * {@link ContentHandler#startBodyPart()},
     * {@link ContentHandler#startMessage()}, etc.
     */
    public void stop() {
        mimeTokenStream.stop();
    }
    
    /**
     * Sets the <code>ContentHandler</code> to use when reporting 
     * parsing events.
     * 
     * @param h the <code>ContentHandler</code>.
     */
    public void setContentHandler(ContentHandler h) {
        this.handler = h;
    }

}

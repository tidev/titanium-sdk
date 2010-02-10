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
import org.apache.james.mime4j.decoder.Base64InputStream;
import org.apache.james.mime4j.decoder.QuotedPrintableInputStream;
import org.apache.james.mime4j.descriptor.BodyDescriptor;
import org.apache.james.mime4j.io.BufferedLineReaderInputStream;
import org.apache.james.mime4j.io.LimitedInputStream;
import org.apache.james.mime4j.io.LineReaderInputStream;
import org.apache.james.mime4j.io.LineReaderInputStreamAdaptor;
import org.apache.james.mime4j.io.MimeBoundaryInputStream;
import org.apache.james.mime4j.io.RootInputStream;
import org.apache.james.mime4j.util.MimeUtil;

public class MimeEntity extends AbstractEntity {

    /**
     * Internal state, not exposed.
     */
    private static final int T_IN_BODYPART = -2;
    /**
     * Internal state, not exposed.
     */
    private static final int T_IN_MESSAGE = -3;

    private final RootInputStream rootStream;
    private final BufferedLineReaderInputStream inbuffer;
    
    private int recursionMode;
    private MimeBoundaryInputStream mimeStream;
    private LineReaderInputStreamAdaptor dataStream;
    private boolean skipHeader;
    
    private byte[] tmpbuf;
    
    public MimeEntity(
            RootInputStream rootStream,
            BufferedLineReaderInputStream inbuffer,
            BodyDescriptor parent, 
            int startState, 
            int endState,
            MimeEntityConfig config) {
        super(parent, startState, endState, config);
        this.rootStream = rootStream;
        this.inbuffer = inbuffer;
        this.dataStream = new LineReaderInputStreamAdaptor(
                inbuffer,
                config.getMaxLineLen());
        this.skipHeader = false;
    }

    public MimeEntity(
            RootInputStream rootStream,
            BufferedLineReaderInputStream inbuffer,
            BodyDescriptor parent, 
            int startState, 
            int endState) {
        this(rootStream, inbuffer, parent, startState, endState, 
                new MimeEntityConfig());
    }

    public int getRecursionMode() {
        return recursionMode;
    }

    public void setRecursionMode(int recursionMode) {
        this.recursionMode = recursionMode;
    }

    public void skipHeader(String contentType) {
        if (state != EntityStates.T_START_MESSAGE) {
            throw new IllegalStateException("Invalid state: " + stateToString(state));
        }
        skipHeader = true;
        body.addField("Content-Type", contentType);
    }
    
    protected int getLineNumber() {
        return rootStream.getLineNumber();
    }
    
    protected LineReaderInputStream getDataStream() {
        return dataStream;
    }
    
    public EntityStateMachine advance() throws IOException, MimeException {
        switch (state) {
        case EntityStates.T_START_MESSAGE:
            if (skipHeader) {
                state = EntityStates.T_END_HEADER;
            } else {
                state = EntityStates.T_START_HEADER;
            }
            break;
        case EntityStates.T_START_BODYPART:
            state = EntityStates.T_START_HEADER;
            break;
        case EntityStates.T_START_HEADER:
        case EntityStates.T_FIELD:
            state = parseField() ? EntityStates.T_FIELD : EntityStates.T_END_HEADER;
            break;
        case EntityStates.T_END_HEADER:
            String mimeType = body.getMimeType();
            if (recursionMode == RecursionMode.M_FLAT) {
                state = EntityStates.T_BODY;
            } else if (MimeUtil.isMultipart(mimeType)) {
                state = EntityStates.T_START_MULTIPART;
                clearMimeStream();
            } else if (recursionMode != RecursionMode.M_NO_RECURSE 
                    && MimeUtil.isMessage(mimeType)) {
                state = T_IN_MESSAGE;
                return nextMessage();
            } else {
                state = EntityStates.T_BODY;
            }
            break;
        case EntityStates.T_START_MULTIPART:
            if (dataStream.isUsed()) {
                advanceToBoundary();            
                state = EntityStates.T_END_MULTIPART;
            } else {
                createMimeStream();
                state = EntityStates.T_PREAMBLE;
            }
            break;
        case EntityStates.T_PREAMBLE:
            advanceToBoundary();            
            if (mimeStream.isLastPart()) {
                clearMimeStream();
                state = EntityStates.T_END_MULTIPART;
            } else {
                clearMimeStream();
                createMimeStream();
                state = T_IN_BODYPART;
                return nextMimeEntity();
            }
            break;
        case T_IN_BODYPART:
            advanceToBoundary();
            if (mimeStream.eof() && !mimeStream.isLastPart()) {
                monitor(Event.MIME_BODY_PREMATURE_END);
            } else {
                if (!mimeStream.isLastPart()) {
                    clearMimeStream();
                    createMimeStream();
                    state = T_IN_BODYPART;
                    return nextMimeEntity();
                }
            }
            clearMimeStream();
            state = EntityStates.T_EPILOGUE;
            break;
        case EntityStates.T_EPILOGUE:
            state = EntityStates.T_END_MULTIPART;
            break;
        case EntityStates.T_BODY:
        case EntityStates.T_END_MULTIPART:
        case T_IN_MESSAGE:
            state = endState;
            break;
        default:
            if (state == endState) {
                state = EntityStates.T_END_OF_STREAM;
                break;
            }
            throw new IllegalStateException("Invalid state: " + stateToString(state));
        }
        return null;
    }

    private void createMimeStream() throws IOException {
        String boundary = body.getBoundary();
        int bufferSize = 2 * boundary.length();
        if (bufferSize < 4096) {
            bufferSize = 4096;
        }
        try {
            if (mimeStream != null) {
                mimeStream = new MimeBoundaryInputStream(
                        new BufferedLineReaderInputStream(
                                mimeStream, 
                                bufferSize, 
                                config.getMaxLineLen()), 
                        boundary);
            } else {
                inbuffer.ensureCapacity(bufferSize);
                mimeStream = new MimeBoundaryInputStream(inbuffer, boundary);
            }
        } catch (IllegalArgumentException e) {
            // thrown when boundary is too long
            throw new MimeException(e.getMessage(), e);
        }
        dataStream = new LineReaderInputStreamAdaptor(
                mimeStream,
                config.getMaxLineLen()); 
    }
    
    private void clearMimeStream() {
        mimeStream = null;
        dataStream = new LineReaderInputStreamAdaptor(
                inbuffer,
                config.getMaxLineLen()); 
    }
    
    private void advanceToBoundary() throws IOException {
        if (!dataStream.eof()) {
            if (tmpbuf == null) {
                tmpbuf = new byte[2048];
            }
            InputStream instream = getLimitedContentStream();
            while (instream.read(tmpbuf)!= -1) {
            }
        }
    }
    
    private EntityStateMachine nextMessage() {
        String transferEncoding = body.getTransferEncoding();
        InputStream instream;
        if (MimeUtil.isBase64Encoding(transferEncoding)) {
            log.debug("base64 encoded message/rfc822 detected");
            instream = new Base64InputStream(dataStream);                    
        } else if (MimeUtil.isQuotedPrintableEncoded(transferEncoding)) {
            log.debug("quoted-printable encoded message/rfc822 detected");
            instream = new QuotedPrintableInputStream(dataStream);                    
        } else {
            instream = dataStream;
        }
        
        if (recursionMode == RecursionMode.M_RAW) {
            RawEntity message = new RawEntity(instream);
            return message;
        } else {
            MimeEntity message = new MimeEntity(
                    rootStream, 
                    new BufferedLineReaderInputStream(
                            instream, 
                            4 * 1024,
                            config.getMaxLineLen()),
                    body, 
                    EntityStates.T_START_MESSAGE, 
                    EntityStates.T_END_MESSAGE,
                    config);
            message.setRecursionMode(recursionMode);
            return message;
        }
    }
    
    private EntityStateMachine nextMimeEntity() {
        if (recursionMode == RecursionMode.M_RAW) {
            RawEntity message = new RawEntity(mimeStream);
            return message;
        } else {
            BufferedLineReaderInputStream stream = new BufferedLineReaderInputStream(
                    mimeStream, 
                    4 * 1024,
                    config.getMaxLineLen());
            MimeEntity mimeentity = new MimeEntity(
                    rootStream, 
                    stream,
                    body, 
                    EntityStates.T_START_BODYPART, 
                    EntityStates.T_END_BODYPART,
                    config);
            mimeentity.setRecursionMode(recursionMode);
            return mimeentity;
        }
    }
    
    private InputStream getLimitedContentStream() {
        long maxContentLimit = config.getMaxContentLen();
        if (maxContentLimit >= 0) {
            return new LimitedInputStream(dataStream, maxContentLimit);
        } else {
            return dataStream;
        }
    }
    
    public InputStream getContentStream() {
        switch (state) {
        case EntityStates.T_START_MULTIPART:
        case EntityStates.T_PREAMBLE:
        case EntityStates.T_EPILOGUE:
        case EntityStates.T_BODY:
            return getLimitedContentStream();
        default:
            throw new IllegalStateException("Invalid state: " + stateToString(state));
        }
    }

}

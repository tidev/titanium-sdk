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
import java.util.BitSet;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.descriptor.BodyDescriptor;
import org.apache.james.mime4j.descriptor.DefaultBodyDescriptor;
import org.apache.james.mime4j.descriptor.MaximalBodyDescriptor;
import org.apache.james.mime4j.descriptor.MutableBodyDescriptor;
import org.apache.james.mime4j.io.LineReaderInputStream;
import org.apache.james.mime4j.io.MaxHeaderLimitException;
import org.apache.james.mime4j.io.MaxLineLimitException;
import org.apache.james.mime4j.util.ByteArrayBuffer;
import org.apache.james.mime4j.util.CharArrayBuffer;
import org.apache.james.mime4j.util.MessageUtils;

/**
 * Abstract MIME entity.
 */
public abstract class AbstractEntity implements EntityStateMachine {

    protected final Log log;
    
    protected final BodyDescriptor parent;
    protected final int startState;
    protected final int endState;
    protected final MimeEntityConfig config;
    protected final MutableBodyDescriptor body;
    
    protected int state;

    private final ByteArrayBuffer linebuf;
    private final CharArrayBuffer fieldbuf;

    private int lineCount;
    private String field, fieldName, fieldValue;
    private boolean endOfHeader;
    private int headerCount;

    private static final BitSet fieldChars = new BitSet();

    static {
        for (int i = 0x21; i <= 0x39; i++) {
            fieldChars.set(i);
        }
        for (int i = 0x3b; i <= 0x7e; i++) {
            fieldChars.set(i);
        }
    }

    /**
     * Internal state, not exposed.
     */
    private static final int T_IN_BODYPART = -2;
    /**
     * Internal state, not exposed.
     */
    private static final int T_IN_MESSAGE = -3;

    AbstractEntity(
            BodyDescriptor parent,
            int startState, 
            int endState,
            MimeEntityConfig config) {
        this.log = LogFactory.getLog(getClass());        
        this.parent = parent;
        this.state = startState;
        this.startState = startState;
        this.endState = endState;
        this.config = config;
        this.body = newBodyDescriptor(parent);
        this.linebuf = new ByteArrayBuffer(64);
        this.fieldbuf = new CharArrayBuffer(64);
        this.lineCount = 0;
        this.endOfHeader = false;
        this.headerCount = 0;
    }

    public int getState() {
        return state;
    }
    
    /**
     * Creates a new instance of {@link BodyDescriptor}. Subclasses may override
     * this in order to create body descriptors, that provide more specific
     * information.
     */
    protected MutableBodyDescriptor newBodyDescriptor(BodyDescriptor pParent) {
        final MutableBodyDescriptor result;
        if (config.isMaximalBodyDescriptor()) {
            result = new MaximalBodyDescriptor(pParent);
        } else {
            result = new DefaultBodyDescriptor(pParent);
        }
        return result;
    }

    protected abstract int getLineNumber();
    
    protected abstract LineReaderInputStream getDataStream();
    
    private void fillFieldBuffer() throws IOException, MimeException {
        if (endOfHeader) {
            return;
        }
        int maxLineLen = config.getMaxLineLen();
        LineReaderInputStream instream = getDataStream();
        fieldbuf.clear();
        for (;;) {
            // If there's still data stuck in the line buffer
            // copy it to the field buffer
            int len = linebuf.length();
            if (maxLineLen > 0 && fieldbuf.length() + len >= maxLineLen) {
                throw new MaxLineLimitException("Maximum line length limit exceeded");
            }
            if (len > 0) {
                fieldbuf.append(linebuf, 0, len);
            }
            linebuf.clear();
            if (instream.readLine(linebuf) == -1) {
                monitor(Event.HEADERS_PREMATURE_END);
                endOfHeader = true;
                break;
            }
            len = linebuf.length();
            if (len > 0 && linebuf.byteAt(len - 1) == '\n') {
                len--;
            }
            if (len > 0 && linebuf.byteAt(len - 1) == '\r') {
                len--;
            }
            if (len == 0) {
                // empty line detected 
                endOfHeader = true;
                break;
            }
            lineCount++;
            if (lineCount > 1) {
                int ch = linebuf.byteAt(0);
                if (ch != MessageUtils.SP && ch != MessageUtils.HT) {
                    // new header detected
                    break;
                }
            }
        }
    }

    protected boolean parseField() throws IOException {
        int maxHeaderLimit = config.getMaxHeaderCount();
        for (;;) {
            if (endOfHeader) {
                return false;
            }
            if (headerCount >= maxHeaderLimit) {
                throw new MaxHeaderLimitException("Maximum header limit exceeded");
            }
            
            fillFieldBuffer();
            headerCount++;
            
            // Strip away line delimiter
            int len = fieldbuf.length();
            if (len > 0 && fieldbuf.charAt(len - 1) == '\n') {
                len--;
            }
            if (len > 0 && fieldbuf.charAt(len - 1) == '\r') {
                len--;
            }
            fieldbuf.setLength(len);
            
            boolean valid = true;
            field = fieldbuf.toString();
            int pos = fieldbuf.indexOf(':');
            if (pos == -1) {
                monitor(Event.INALID_HEADER);
                valid = false;
            } else {
                fieldName = fieldbuf.substring(0, pos);
                for (int i = 0; i < fieldName.length(); i++) {
                    if (!fieldChars.get(fieldName.charAt(i))) {
                        monitor(Event.INALID_HEADER);
                        valid = false;
                        break;
                    }
                }
                fieldValue = fieldbuf.substring(pos + 1, fieldbuf.length());
            }
            if (valid) {
                body.addField(fieldName, fieldValue);            
                return true;
            }
        }
    }

    /**
     * <p>Gets a descriptor for the current entity.
     * This method is valid if {@link #getState()} returns:</p>
     * <ul>
     * <li>{@link EntityStates#T_BODY}</li>
     * <li>{@link EntityStates#T_START_MULTIPART}</li>
     * <li>{@link EntityStates#T_EPILOGUE}</li>
     * <li>{@link EntityStates#T_PREAMBLE}</li>
     * </ul>
     * @return <code>BodyDescriptor</code>, not nulls
     */
    public BodyDescriptor getBodyDescriptor() {
        switch (getState()) {
        case EntityStates.T_BODY:
        case EntityStates.T_START_MULTIPART:
        case EntityStates.T_PREAMBLE:
        case EntityStates.T_EPILOGUE:
        case EntityStates.T_END_OF_STREAM:
            return body;
        default:
            throw new IllegalStateException("Invalid state :" + stateToString(state));
        }
    }

    /**
     * This method is valid, if {@link #getState()} returns {@link EntityStates#T_FIELD}.
     * @return String with the fields raw contents.
     * @throws IllegalStateException {@link #getState()} returns another
     *   value than {@link EntityStates#T_FIELD}.
     */
    public String getField() {
        switch (getState()) {
        case EntityStates.T_FIELD:
            return field;
        default:
            throw new IllegalStateException("Invalid state :" + stateToString(state));
        }
    }

    /**
     * This method is valid, if {@link #getState()} returns {@link EntityStates#T_FIELD}.
     * @return String with the fields name.
     * @throws IllegalStateException {@link #getState()} returns another
     *   value than {@link EntityStates#T_FIELD}.
     */
    public String getFieldName() {
        switch (getState()) {
        case EntityStates.T_FIELD:
            return fieldName;
        default:
            throw new IllegalStateException("Invalid state :" + stateToString(state));
        }
    }

    /**
     * This method is valid, if {@link #getState()} returns {@link EntityStates#T_FIELD}.
     * @return String with the fields value.
     * @throws IllegalStateException {@link #getState()} returns another
     *   value than {@link EntityStates#T_FIELD}.
     */
    public String getFieldValue() {
        switch (getState()) {
        case EntityStates.T_FIELD:
            return fieldValue;
        default:
            throw new IllegalStateException("Invalid state :" + stateToString(state));
        }
    }

    /**
     * Monitors the given event.
     * Subclasses may override to perform actions upon events.
     * Base implementation logs at warn.
     * @param event <code>Event</code>, not null
     * @throws MimeException subclasses may elect to throw this exception upon
     * invalid content
     * @throws IOException subclasses may elect to throw this exception
     */
    protected void monitor(Event event) throws MimeException, IOException {
        if (config.isStrictParsing()) {
            throw new MimeParseEventException(event);
        } else {
            warn(event);
        }
    }
    
    /**
     * Creates an indicative message suitable for display
     * based on the given event and the current state of the system.
     * @param event <code>Event</code>, not null
     * @return message suitable for use as a message in an exception
     * or for logging
     */
    protected String message(Event event) {
        String preamble = "Line " + getLineNumber() + ": ";
        final String message;
        if (event == null) {
            message = "Event is unexpectedly null.";
        } else {
            message = event.toString();
        }
        final String result = preamble + message;
        return result;
    }
    
    /**
     * Logs (at warn) an indicative message based on the given event 
     * and the current state of the system.
     * @param event <code>Event</code>, not null
     */
    protected void warn(Event event) {
        if (log.isWarnEnabled()) {
            log.warn(message(event));
        }
    }
    
    /**
     * Logs (at debug) an indicative message based on the given event
     * and the current state of the system.
     * @param event <code>Event</code>, not null
     */
    protected void debug(Event event) {
        if (log.isDebugEnabled()) {
            log.debug(message(event));
        }
    }

    public String toString() {
        return getClass().getName() + " [" + stateToString(state)
        + "][" + body.getMimeType() + "][" + body.getBoundary() + "]";
    }

    /**
     * Renders a state as a string suitable for logging.
     * @param state 
     * @return rendered as string, not null
     */
    public static final String stateToString(int state) {
        final String result;
        switch (state) {
            case EntityStates.T_END_OF_STREAM:
                result = "End of stream";
                break;
            case EntityStates.T_START_MESSAGE:
                result = "Start message";
                break;
            case EntityStates.T_END_MESSAGE:
                result = "End message";
                break;
            case EntityStates.T_RAW_ENTITY:
                result = "Raw entity";
                break;
            case EntityStates.T_START_HEADER:
                result = "Start header";
                break;
            case EntityStates.T_FIELD:
                result = "Field";
                break;
            case EntityStates.T_END_HEADER:
                result = "End header";
                break;
            case EntityStates.T_START_MULTIPART:
                result = "Start multipart";
                break;
            case EntityStates.T_END_MULTIPART:
                result = "End multipart";
                break;
            case EntityStates.T_PREAMBLE:
                result = "Preamble";
                break;
            case EntityStates.T_EPILOGUE:
                result = "Epilogue";
                break;
            case EntityStates.T_START_BODYPART:
                result = "Start bodypart";
                break;
            case EntityStates.T_END_BODYPART:
                result = "End bodypart";
                break;
            case EntityStates.T_BODY:
                result = "Body";
                break;
            case T_IN_BODYPART:
                result = "Bodypart";
                break;
            case T_IN_MESSAGE:
                result = "In message";
                break;
            default:
                result = "Unknown";
                break;
        }
        return result;
    }
    
}

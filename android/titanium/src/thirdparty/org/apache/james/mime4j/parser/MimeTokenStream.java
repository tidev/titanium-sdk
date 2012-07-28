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
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;
import java.nio.charset.IllegalCharsetNameException;
import java.nio.charset.UnsupportedCharsetException;
import java.util.LinkedList;

import org.apache.james.mime4j.MimeException;
import org.apache.james.mime4j.decoder.Base64InputStream;
import org.apache.james.mime4j.decoder.QuotedPrintableInputStream;
import org.apache.james.mime4j.descriptor.BodyDescriptor;
import org.apache.james.mime4j.io.BufferedLineReaderInputStream;
import org.apache.james.mime4j.io.RootInputStream;
import org.apache.james.mime4j.util.MimeUtil;

/**
 * <p>
 * Parses MIME (or RFC822) message streams of bytes or characters.
 * The stream is converted into an event stream.
 * <p>
 * <p>
 * Typical usage:
 * </p>
 * <pre>
 *      MimeTokenStream stream = new MimeTokenStream();
 *      stream.parse(new FileInputStream("mime.msg"));
 *      for (int state = stream.getState();
 *           state != MimeTokenStream.T_END_OF_STREAM;
 *           state = stream.next()) {
 *          switch (state) {
 *            case MimeTokenStream.T_BODY:
 *              System.out.println("Body detected, contents = "
 *                + stream.getInputStream() + ", header data = "
 *                + stream.getBodyDescriptor());
 *              break;
 *            case MimeTokenStream.T_FIELD:
 *              System.out.println("Header field detected: "
 *                + stream.getField());
 *              break;
 *            case MimeTokenStream.T_START_MULTIPART:
 *              System.out.println("Multipart message detexted,"
 *                + " header data = "
 *                + stream.getBodyDescriptor());
 *            ...
 *          }
 *      }
 * </pre>
 * <p>Instances of {@link MimeTokenStream} are reusable: Invoking the
 * method {@link #parse(InputStream)} resets the token streams internal
 * state. However, they are definitely <em>not</em> thread safe. If you
 * have a multi threaded application, then the suggested use is to have
 * one instance per thread.</p>
 * 
 * @version $Id: MimeStreamParser.java,v 1.8 2005/02/11 10:12:02 ntherning Exp $
 */
public class MimeTokenStream implements EntityStates, RecursionMode {
    
    /**
     * Creates a stream that creates a more detailed body descriptor.
     * @return <code>MimeTokenStream</code>, not null
     */
    public static final MimeTokenStream createMaximalDescriptorStream() {
        MimeEntityConfig config = new MimeEntityConfig();
        config.setMaximalBodyDescriptor(true);
        return new MimeTokenStream(config);
    }
    
    /**
     * Creates a stream that strictly validates the input.
     * @return <code>MimeTokenStream</code> which throws a 
     * <code>MimeException</code> whenever possible issues 
     * are dedicated in the input
     */
    public static final MimeTokenStream createStrictValidationStream() {
        MimeEntityConfig config = new MimeEntityConfig();
        config.setStrictParsing(true);
        return new MimeTokenStream(config);
    }
    
    private final MimeEntityConfig config;
    private final LinkedList entities = new LinkedList();
    
    private int state = T_END_OF_STREAM;
    private EntityStateMachine currentStateMachine;
    private int recursionMode = M_RECURSE;
    private BufferedLineReaderInputStream inbuffer;
    private RootInputStream rootInputStream;
    
    /**
     * Constructs a standard (lax) stream.
     * Optional validation events will be logged only.
     * Use {@link #createStrictValidationStream()} to create
     * a stream that strictly validates the input.
     */
    public MimeTokenStream() {
        this(new MimeEntityConfig());
    }
    
    protected MimeTokenStream(final MimeEntityConfig config) {
        super();
        this.config = config;
    }
    
    /** Instructs the {@code MimeTokenStream} to parse the given streams contents.
     * If the {@code MimeTokenStream} has already been in use, resets the streams
     * internal state.
     */
    public void parse(InputStream stream) {
        doParse(stream, null);
    }

    /** Instructs the {@code MimeTokenStream} to parse the given content with 
     * the content type. The message stream is assumed to have no message header
     * and is expected to begin with a message body. This can be the case when 
     * the message content is transmitted using a different transport protocol 
     * such as HTTP.
     * <p/>
     * If the {@code MimeTokenStream} has already been in use, resets the streams
     * internal state.
     */    
    public void parseHeadless(InputStream stream, String contentType) {
        if (contentType == null) {
            throw new IllegalArgumentException("Content type may not be null");
        }
        doParse(stream, contentType);
    }

    private void doParse(InputStream stream, String contentType) {
        entities.clear();
        rootInputStream = new RootInputStream(stream);
        inbuffer = new BufferedLineReaderInputStream(
                rootInputStream, 
                4 * 1024,
                config.getMaxLineLen());
        switch (recursionMode) {
        case M_RAW:
            RawEntity rawentity = new RawEntity(inbuffer);
            currentStateMachine = rawentity;
            break;
        case M_NO_RECURSE:
        case M_FLAT:
            // expected to be called only at start of paring
        case M_RECURSE:
            MimeEntity mimeentity = new MimeEntity(
                    rootInputStream,
                    inbuffer,
                    null, 
                    T_START_MESSAGE, 
                    T_END_MESSAGE,
                    config);
            mimeentity.setRecursionMode(recursionMode);
            if (contentType != null) {
                mimeentity.skipHeader(contentType);
            }
            currentStateMachine = mimeentity;
            break;
        }
        entities.add(currentStateMachine);
        state = currentStateMachine.getState();
    }

    /**
     * Determines if this parser is currently in raw mode.
     * 
     * @return <code>true</code> if in raw mode, <code>false</code>
     *         otherwise.
     * @see #setRecursionMode(int)
     */
    public boolean isRaw() {
        return recursionMode == M_RAW;
    }
    
    /**
     * Gets the current recursion mode.
     * The recursion mode specifies the approach taken to parsing parts.
     * {@link #M_RAW}  mode does not parse the part at all.
     * {@link #M_RECURSE} mode recursively parses each mail
     * when an <code>message/rfc822</code> part is encounted;
     * {@link #M_NO_RECURSE} does not.
     * @return {@link #M_RECURSE}, {@link #M_RAW} or {@link #M_NO_RECURSE}
     */
    public int getRecursionMode() {
        return recursionMode;
    }
    
    /**
     * Sets the current recursion.
     * The recursion mode specifies the approach taken to parsing parts.
     * {@link #M_RAW}  mode does not parse the part at all.
     * {@link #M_RECURSE} mode recursively parses each mail
     * when an <code>message/rfc822</code> part is encounted;
     * {@link #M_NO_RECURSE} does not.
     * @param mode {@link #M_RECURSE}, {@link #M_RAW} or {@link #M_NO_RECURSE}
     */
    public void setRecursionMode(int mode) {
        recursionMode = mode;
        if (currentStateMachine != null) {
            currentStateMachine.setRecursionMode(mode);
        }
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
        inbuffer.clear();
        rootInputStream.truncate();
    }

    /**
     * Returns the current state.
     */
    public int getState() {
        return state;
    }

    /**
     * This method returns the raw entity, preamble, or epilogue contents.
     * <p/>
     * This method is valid, if {@link #getState()} returns either of
     * {@link #T_RAW_ENTITY}, {@link #T_PREAMBLE}, or {@link #T_EPILOGUE}.
     * 
     * @return Data stream, depending on the current state.
     * @throws IllegalStateException {@link #getState()} returns an
     *   invalid value.
     */
    public InputStream getInputStream() {
        return currentStateMachine.getContentStream();
    }
    
    /**
     * This method returns a transfer decoded stream based on the MIME 
     * fields with the standard defaults.
     * <p/>
     * This method is valid, if {@link #getState()} returns either of
     * {@link #T_RAW_ENTITY}, {@link #T_PREAMBLE}, or {@link #T_EPILOGUE}.
     * 
     * @return Data stream, depending on the current state.
     * @throws IllegalStateException {@link #getState()} returns an
     *   invalid value.
     */
    public InputStream getDecodedInputStream() {
        BodyDescriptor bodyDescriptor = getBodyDescriptor();
        String transferEncoding = bodyDescriptor.getTransferEncoding();
        InputStream dataStream = currentStateMachine.getContentStream();
        if (MimeUtil.isBase64Encoding(transferEncoding)) {
            dataStream = new Base64InputStream(dataStream);
        } else if (MimeUtil.isQuotedPrintableEncoded(transferEncoding)) {
            dataStream = new QuotedPrintableInputStream(dataStream);
        }
        return dataStream;
    }

    /**
     * Gets a reader configured for the current body or body part.
     * The reader will return a transfer and charset decoded 
     * stream of characters based on the MIME fields with the standard
     * defaults.
     * This is a conveniance method and relies on {@link #getInputStream()}.
     * Consult the javadoc for that method for known limitations.
     * 
     * @return <code>Reader</code>, not null
     * @see #getInputStream 
     * @throws IllegalStateException {@link #getState()} returns an
     *   invalid value 
     * @throws UnsupportedCharsetException if there is no JVM support 
     * for decoding the charset
     * @throws IllegalCharsetNameException if the charset name specified
     * in the mime type is illegal
     */
    public Reader getReader() {
        final BodyDescriptor bodyDescriptor = getBodyDescriptor();
        final String mimeCharset = bodyDescriptor.getCharset();
        final Charset charset;
        if (mimeCharset == null || "".equals(mimeCharset)) {
            charset = Charset.forName("US-ASCII");
        } else {
            charset = Charset.forName(mimeCharset);
        }
        final InputStream instream = getDecodedInputStream();
        return new InputStreamReader(instream, charset);
    }
    
    /**
     * <p>Gets a descriptor for the current entity.
     * This method is valid if {@link #getState()} returns:</p>
     * <ul>
     * <li>{@link #T_BODY}</li>
     * <li>{@link #T_START_MULTIPART}</li>
     * <li>{@link #T_EPILOGUE}</li>
     * <li>{@link #T_PREAMBLE}</li>
     * </ul>
     * @return <code>BodyDescriptor</code>, not nulls
     */
    public BodyDescriptor getBodyDescriptor() {
        return currentStateMachine.getBodyDescriptor();
    }

    /**
     * This method is valid, if {@link #getState()} returns {@link #T_FIELD}.
     * @return String with the fields raw contents.
     * @throws IllegalStateException {@link #getState()} returns another
     *   value than {@link #T_FIELD}.
     */
    public String getField() {
        return currentStateMachine.getField();
    }
    
    /**
     * This method is valid, if {@link #getState()} returns {@link #T_FIELD}.
     * @return String with the fields name.
     * @throws IllegalStateException {@link #getState()} returns another
     *   value than {@link #T_FIELD}.
     */
    public String getFieldName() {
        return currentStateMachine.getFieldName();
    }

    /**
     * This method is valid, if {@link #getState()} returns {@link #T_FIELD}.
     * @return String with the fields value.
     * @throws IllegalStateException {@link #getState()} returns another
     *   value than {@link #T_FIELD}.
     */
    public String getFieldValue() {
        return currentStateMachine.getFieldValue();
    }

    /**
     * This method advances the token stream to the next token.
     * @throws IllegalStateException The method has been called, although
     *   {@link #getState()} was already {@link #T_END_OF_STREAM}.
     */
    public int next() throws IOException, MimeException {
        if (state == T_END_OF_STREAM  ||  currentStateMachine == null) {
            throw new IllegalStateException("No more tokens are available.");
        }
        while (currentStateMachine != null) {
            EntityStateMachine next = currentStateMachine.advance();
            if (next != null) {
                entities.add(next);
                currentStateMachine = next;
            }
            state = currentStateMachine.getState();
            if (state != T_END_OF_STREAM) {
                return state;
            }
            entities.removeLast();
            if (entities.isEmpty()) {
                currentStateMachine = null;
            } else {
                currentStateMachine = (EntityStateMachine) entities.getLast();
                currentStateMachine.setRecursionMode(recursionMode);
            }
        }
        state = T_END_OF_STREAM;
        return state;
    }

    /**
     * Renders a state as a string suitable for logging.
     * @param state 
     * @return rendered as string, not null
     */
    public static final String stateToString(int state) {
        return AbstractEntity.stateToString(state);
    }
}

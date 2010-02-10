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

package org.apache.james.mime4j.decoder;

import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;

/**
 * This class is based on Base64 and Base64OutputStream code from Commons-Codec 1.4
 * 
 * Provides Base64 encoding and decoding as defined by RFC 2045.
 * 
 * <p>
 * This class implements section <cite>6.8. Base64 Content-Transfer-Encoding</cite> from RFC 2045 <cite>Multipurpose
 * Internet Mail Extensions (MIME) Part One: Format of Internet Message Bodies</cite> by Freed and Borenstein.
 * </p>
 * 
 * @see <a href="http://www.ietf.org/rfc/rfc2045.txt">RFC 2045</a>
 * @author Apache Software Foundation
 * @since 1.0-dev
 * @version $Id$
 */
public class Base64OutputStream extends FilterOutputStream {

    /**
     * Chunk size per RFC 2045 section 6.8.
     * 
     * <p>
     * The {@value} character limit does not count the trailing CRLF, but counts all other characters, including any
     * equal signs.
     * </p>
     * 
     * @see <a href="http://www.ietf.org/rfc/rfc2045.txt">RFC 2045 section 6.8</a>
     */
    static final int CHUNK_SIZE = 76;

    /**
     * Chunk separator per RFC 2045 section 2.1.
     * 
     * @see <a href="http://www.ietf.org/rfc/rfc2045.txt">RFC 2045 section 2.1</a>
     */
    static final byte[] CHUNK_SEPARATOR = {'\r','\n'};

    /**
     * This array is a lookup table that translates 6-bit positive integer
     * index values into their "Base64 Alphabet" equivalents as specified
     * in Table 1 of RFC 2045.
     *
     * Thanks to "commons" project in ws.apache.org for this code. 
     * http://svn.apache.org/repos/asf/webservices/commons/trunk/modules/util/
     */
    private static final byte[] intToBase64 = {
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
            'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
    };

    /**
     * Byte used to pad output.
     */
    private static final byte PAD = '=';

    /**
     * This array is a lookup table that translates unicode characters
     * drawn from the "Base64 Alphabet" (as specified in Table 1 of RFC 2045)
     * into their 6-bit positive integer equivalents.  Characters that
     * are not in the Base64 alphabet but fall within the bounds of the
     * array are translated to -1.
     *
     * Thanks to "commons" project in ws.apache.org for this code.
     * http://svn.apache.org/repos/asf/webservices/commons/trunk/modules/util/ 
     */
    private static final byte[] base64ToInt = {
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54,
            55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4,
            5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
            24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34,
            35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
    };

    /** Mask used to extract 6 bits, used when encoding */
    private static final int MASK_6BITS = 0x3f;

    // The static final fields above are used for the original static byte[] methods on Base64.
    // The private member fields below are used with the new streaming approach, which requires
    // some state be preserved between calls of encode() and decode().


    /**
     * Line length for encoding.  Not used when decoding.  A value of zero or less implies
     * no chunking of the base64 encoded data.
     */
    private final int lineLength;

    /**
     * Line separator for encoding.  Not used when decoding.  Only used if lineLength > 0.
     */
    private final byte[] lineSeparator;

    /**
     * Convenience variable to help us determine when our buffer is going to run out of
     * room and needs resizing.  <code>encodeSize = 4 + lineSeparator.length;</code>
     */
    private final int encodeSize;

    /**
     * Buffer for streaming. 
     */
    private byte[] buf = new byte[1024];

    /**
     * Position where next character should be written in the buffer.
     */
    private int pos;

    /**
     * Variable tracks how many characters have been written to the current line.
     * Only used when encoding.  We use it to make sure each encoded line never
     * goes beyond lineLength (if lineLength > 0).
     */
    private int currentLinePos;

    /**
     * Writes to the buffer only occur after every 3 reads when encoding, an
     * every 4 reads when decoding.  This variable helps track that.
     */
    private int modulus;

    /**
     * Boolean flag to indicate that this Base64OutputStream has been closed.
     * Once closed, this Base64 object becomes useless, and must be thrown away.
     */
    private boolean closed = false;
        
    /**
     * Place holder for the 3 bytes we're dealing with for our base64 logic.
     * Bitwise operations store and extract the base64 encoding or decoding from
     * this variable.
     */
    private int x;

    /**
     * Default constructor:  lineLength is 76, and the lineSeparator is CRLF
     * when encoding, and all forms can be decoded.
     */
    public Base64OutputStream(OutputStream os) {
        this(os, CHUNK_SIZE, CHUNK_SEPARATOR);
    }

    /**
     * <p>
     * Consumer can use this constructor to choose a different lineLength
     * when encoding (lineSeparator is still CRLF).  All forms of data can
     * be decoded.
     * </p><p>
     * Note:  lineLengths that aren't multiples of 4 will still essentially
     * end up being multiples of 4 in the encoded data.
     * </p>
     *
     * @param lineLength each line of encoded data will be at most this long
     * (rounded up to nearest multiple of 4). 
     * If lineLength <= 0, then the output will not be divided into lines (chunks).  
     * Ignored when decoding.
     */
    public Base64OutputStream(OutputStream os, int lineLength) {
        this(os, lineLength, CHUNK_SEPARATOR);
    }

    /**
     * <p>
     * Consumer can use this constructor to choose a different lineLength
     * and lineSeparator when encoding.  All forms of data can
     * be decoded.
     * </p><p>
     * Note:  lineLengths that aren't multiples of 4 will still essentially
     * end up being multiples of 4 in the encoded data.
     * </p>
     * @param lineLength    Each line of encoded data will be at most this long
     *                      (rounded up to nearest multiple of 4).  Ignored when decoding.
     *                      If <= 0, then output will not be divided into lines (chunks).
     * @param lineSeparator Each line of encoded data will end with this
     *                      sequence of bytes.
     *                      If lineLength <= 0, then the lineSeparator is not used.
     * @throws IllegalArgumentException The provided lineSeparator included
     *                                  some base64 characters.  That's not going to work!
     */
    public Base64OutputStream(OutputStream os, int lineLength, byte[] lineSeparator) {
        super(os);
        this.lineLength = lineLength;
        this.lineSeparator = new byte[lineSeparator.length];
        System.arraycopy(lineSeparator, 0, this.lineSeparator, 0, lineSeparator.length);
        if (lineLength > 0) {
            this.encodeSize = 4 + lineSeparator.length;
        } else {
            this.encodeSize = 4;
        }
        if (containsBase64Byte(lineSeparator)) {
            String sep;
            try {
                sep = new String(lineSeparator, "UTF-8");
            } catch (UnsupportedEncodingException uee) {
                sep = new String(lineSeparator);
            }
            throw new IllegalArgumentException("lineSeperator must not contain base64 characters: [" + sep + "]");
        }
    }

    /** Doubles our buffer. */
    private void resizeBuf() {
        byte[] b = new byte[buf.length * 2];
        System.arraycopy(buf, 0, b, 0, buf.length);
        buf = b;
    }

    /**
     * Returns whether or not the <code>octet</code> is in the base 64 alphabet.
     * 
     * @param octet
     *            The value to test
     * @return <code>true</code> if the value is defined in the the base 64 alphabet, <code>false</code> otherwise.
     */
    public static boolean isBase64(byte octet) {
        return octet == PAD || (octet >= 0 && octet < base64ToInt.length && base64ToInt[octet] != -1);
    }

    /*
     * Tests a given byte array to see if it contains only valid characters within the Base64 alphabet.
     * 
     * @param arrayOctet
     *            byte array to test
     * @return <code>true</code> if any byte is a valid character in the Base64 alphabet; false herwise
     */
    private static boolean containsBase64Byte(byte[] arrayOctet) {
        for (int i = 0; i < arrayOctet.length; i++) {
            if (isBase64(arrayOctet[i])) {
                return true;
            }
        }
        return false;
    }

    // Implementation of the Encoder Interface

    private final byte[] singleByte = new byte[1];

    /**
     * Writes the specified <code>byte</code> to this output stream.
     */
    public void write(int i) throws IOException {
        singleByte[0] = (byte) i;
        write(singleByte, 0, 1);
    }

    
    /**
     * Writes <code>len</code> bytes from the specified
     * <code>b</code> array starting at <code>offset</code> to
     * this output stream.
     *
     * @param b source byte array
     * @param offset where to start reading the bytes
     * @param len maximum number of bytes to write
     * 
     * @throws IOException if an I/O error occurs.
     * @throws NullPointerException if the byte array parameter is null
     * @throws IndexOutOfBoundsException if offset, len or buffer size are invalid
     */
    public void write(byte b[], int offset, int len) throws IOException {
        if (closed) {
        	throw new IOException("Base64OutputStream has been closed");
        }
        if (b == null) {
            throw new NullPointerException();
        } else if (len < 0) {
            // len < 0 is how we're informed of EOF in the underlying data we're
            // encoding.
            closed = true;
            if (buf.length - pos < encodeSize) {
                resizeBuf();
            }
            switch (modulus) {
                case 1:
                    buf[pos++] = intToBase64[(x >> 2) & MASK_6BITS];
                    buf[pos++] = intToBase64[(x << 4) & MASK_6BITS];
                    buf[pos++] = PAD;
                    buf[pos++] = PAD;
                    break;

                case 2:
                    buf[pos++] = intToBase64[(x >> 10) & MASK_6BITS];
                    buf[pos++] = intToBase64[(x >> 4) & MASK_6BITS];
                    buf[pos++] = intToBase64[(x << 2) & MASK_6BITS];
                    buf[pos++] = PAD;
                    break;
            }
            if (lineLength > 0) {
                System.arraycopy(lineSeparator, 0, buf, pos, lineSeparator.length);
                pos += lineSeparator.length;
                // TODO I had to add this to make it work as the quoted printable encoder.
                // not sure this is generally speaking ok.
                System.arraycopy(lineSeparator, 0, buf, pos, lineSeparator.length);
                pos += lineSeparator.length;
            }
        } else if (offset < 0 || len < 0 || offset + len < 0) {
            throw new IndexOutOfBoundsException();
        } else if (offset > b.length || offset + len > b.length) {
            throw new IndexOutOfBoundsException();
        } else if (len > 0) {
            for (int i = 0; i < len; i++) {
                if (buf.length - pos < encodeSize) {
                    resizeBuf();
                }
                modulus = (++modulus) % 3;
                int bc = b[offset++];
                if (bc < 0) { bc += 256; }
                x = (x << 8) + bc;
                if (0 == modulus) {
                    buf[pos++] = intToBase64[(x >> 18) & MASK_6BITS];
                    buf[pos++] = intToBase64[(x >> 12) & MASK_6BITS];
                    buf[pos++] = intToBase64[(x >> 6) & MASK_6BITS];
                    buf[pos++] = intToBase64[x & MASK_6BITS];
                    currentLinePos += 4;
                    if (lineLength > 0 && lineLength <= currentLinePos) {
                        System.arraycopy(lineSeparator, 0, buf, pos, lineSeparator.length);
                        pos += lineSeparator.length;
                        currentLinePos = 0;
                    }
                }
            }
        }
        flushBuffer();
    }
    
    /**
     * Flushes this output stream and forces any buffered output bytes
     * to be written out to the stream.  If propogate is true, the wrapped
     * stream will also be flushed.
     *
     * @param propogate boolean flag to indicate whether the wrapped
     *                  OutputStream should also be flushed.
     * @throws IOException if an I/O error occurs.
     */
    private void flushBuffer() throws IOException {
        if (pos > 0) {
            out.write(buf, 0, pos);
            // buf = null;
            pos = 0;
        }
    }

    /**
     * Flushes this output stream and forces any buffered output bytes
     * to be written out to the stream.
     *
     * @throws IOException if an I/O error occurs.
     */
    public void flush() throws IOException {
        flushBuffer();
        out.flush();
    }
    
    /**
     * Terminates the BASE64 coded content and flushes the internal buffers. This method does
     * NOT close the underlying output stream.
     */
    public void close() throws IOException {
        if (closed) {
            return;
        }

        try {
            // Notify encoder of EOF (-1).
            write(singleByte, 0, -1);
            flush();
        } finally {
            closed = true;
        }
    }

}

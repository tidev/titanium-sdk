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

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

final class Base64Encoder {
    private static final int MASK = 0x3F;
    private static final int FIRST_MASK = MASK << 18; 
    private static final int SECOND_MASK = MASK << 12; 
    private static final int THIRD_MASK = MASK << 6; 
    private static final int FORTH_MASK = MASK; 
    
    private static final byte[] ENCODING = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
        'O', 'P' ,'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
        'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3',
        '4', '5', '6', '7', '8', '9', '+', '/'};
    
    private final byte[] in;
    private final byte[] out;
    
    public Base64Encoder(final int inputBufferSize) {
        in = new byte[inputBufferSize];
        int outputBufferSize = ((int) Math.floor((4*inputBufferSize) / 3f) + 3);
        outputBufferSize = outputBufferSize + 2 * (int) Math.floor(outputBufferSize / 76f);
        out = new byte[outputBufferSize];            
    }
    
    public void encode(final InputStream inStream, final OutputStream outStream) throws IOException {
        int inputLength;
        while ((inputLength = inStream.read(in)) > -1) {
            int outputLength = encodeInputBuffer(in, 0, inputLength);
            if (outputLength > 0) {
                outStream.write(out, 0, outputLength);
            }
        }
    }
    
    private int encodeInputBuffer(byte[] in, final int pos, final int inputLength) {
        if (inputLength == 0) {
            return 0;
        }
        int inputEnd = pos + inputLength;
        int inputIndex = pos;
        int outputIndex = 0;
        while (inputEnd - inputIndex > 2) {
            int one = (toInt(in[inputIndex++]) << 16);
            int two = (toInt(in[inputIndex++]) << 8);
            int three = toInt(in[inputIndex++]);
            int quantum = one | two | three;
            int index = (quantum & FIRST_MASK) >> 18;
            outputIndex = setResult(out, outputIndex, ENCODING[index]);
            index = (quantum & SECOND_MASK) >> 12;
            outputIndex = setResult(out, outputIndex, ENCODING[index]);
            index = (quantum & THIRD_MASK) >> 6;
            outputIndex = setResult(out, outputIndex, ENCODING[index]);
            index = (quantum & FORTH_MASK);
            outputIndex = setResult(out, outputIndex, ENCODING[index]);
        }
        
        switch (inputEnd - inputIndex) {
            case 1:
                int quantum = in[inputIndex++] << 16;
                int index = (quantum & FIRST_MASK) >> 18;
                outputIndex = setResult(out, outputIndex, ENCODING[index]);
                index = (quantum & SECOND_MASK) >> 12;
                outputIndex = setResult(out, outputIndex, ENCODING[index]);
                outputIndex = setResult(out, outputIndex, (byte) '=');
                outputIndex = setResult(out, outputIndex, (byte) '=');
                break;
                
            case 2:
                quantum = (in[inputIndex++] << 16) + (in[inputIndex++] << 8);
                index = (quantum & FIRST_MASK) >> 18;
                outputIndex = setResult(out, outputIndex, ENCODING[index]);
                index = (quantum & SECOND_MASK) >> 12;
                outputIndex = setResult(out, outputIndex, ENCODING[index]);
                index = (quantum & THIRD_MASK) >> 6;
                outputIndex = setResult(out, outputIndex, ENCODING[index]);
                outputIndex = setResult(out, outputIndex, (byte) '=');
                break;
        }
        
        return outputIndex;
    }
    
    private int toInt(byte b) {
        return 255 & b;
    }

    private int setResult(byte[] results, int outputIndex, byte value) {
        results[outputIndex++] = value;
        outputIndex = checkLineLength(results, outputIndex);
        return outputIndex;
    }

    private int checkLineLength(byte[] results, int outputIndex) {
        if (outputIndex == 76 || outputIndex > 76 && (outputIndex - 2*Math.floor(outputIndex/76f - 1)) % 76 == 0) {
            results[outputIndex++] = '\r';
            results[outputIndex++] = '\n';
        }
        return outputIndex;
    }
}
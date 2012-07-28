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
import java.io.InputStream;
import java.io.OutputStream;

import org.apache.james.mime4j.decoder.CodecUtil;
import org.apache.james.mime4j.message.storage.TempFile;
import org.apache.james.mime4j.message.storage.TempPath;
import org.apache.james.mime4j.message.storage.TempStorage;


/**
 * Binary body backed by a {@link org.apache.james.mime4j.message.storage.TempFile}.
 *
 * 
 * @version $Id: TempFileBinaryBody.java,v 1.2 2004/10/02 12:41:11 ntherning Exp $
 */
class TempFileBinaryBody extends AbstractBody implements BinaryBody {
    
    private TempFile tempFile = null;

    /**
     * Use the given InputStream to build the TemporyFileBinaryBody
     * 
     * @param is the InputStream to use as source
     * @throws IOException
     */
    public TempFileBinaryBody(final InputStream is) throws IOException {
        
        TempPath tempPath = TempStorage.getInstance().getRootTempPath();
        tempFile = tempPath.createTempFile("attachment", ".bin");
        
        OutputStream out = tempFile.getOutputStream();
        CodecUtil.copy(is, out);
        out.close();
    }
    
    /**
     * @see org.apache.james.mime4j.message.BinaryBody#getInputStream()
     */
    public InputStream getInputStream() throws IOException {
        return tempFile.getInputStream();
    }
    
    /**
     * @see org.apache.james.mime4j.message.Body#writeTo(java.io.OutputStream, int)
     */
    public void writeTo(OutputStream out, int mode) throws IOException {
        final InputStream inputStream = getInputStream();
        CodecUtil.copy(inputStream,out);
    }

    /**
     * Deletes the temporary file that stores the content of this binary body.
     * 
     * @see org.apache.james.mime4j.message.Disposable#dispose()
     */
    public void dispose() {
        if (tempFile != null) {
            tempFile.delete();
            tempFile = null;
        }
    }

}

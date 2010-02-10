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

package org.apache.james.mime4j.message.storage;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Random;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * 
 * @version $Id: SimpleTempStorage.java,v 1.2 2004/10/02 12:41:11 ntherning Exp $
 */
public class SimpleTempStorage extends TempStorage {
    private static Log log = LogFactory.getLog(SimpleTempStorage.class);
    
    private TempPath rootPath = null;
    private Random random = new Random();
    
    /**
     * Creates a new <code>SimpleTempStorageManager</code> instance.
     */
    public SimpleTempStorage() {
        rootPath = new SimpleTempPath(System.getProperty("java.io.tmpdir"));
    }
    
    private TempPath createTempPath(TempPath parent, String prefix) 
            throws IOException {
        
        if (prefix == null) {
            prefix = "";
        }
        
        File p = null;
        int count = 1000;
        do {
            long n = Math.abs(random.nextLong());
            p = new File(parent.getAbsolutePath(), prefix + n);
            count--;
        } while (p.exists() && count > 0);
        
        if (p.exists() || !p.mkdirs()) {
            log.error("Unable to mkdirs on " + p.getAbsolutePath());
            throw new IOException("Creating dir '" 
                                    + p.getAbsolutePath() + "' failed."); 
        }
        
        return new SimpleTempPath(p);
    }
    
    private TempFile createTempFile(TempPath parent, String prefix, 
                                    String suffix) throws IOException {
        
        if (prefix == null) {
            prefix = "";
        }
        if (suffix == null) {
            suffix = ".tmp";
        }
        
        File f = null;
        
        int count = 1000;
        synchronized (this) {
            do {
                long n = Math.abs(random.nextLong());
                f = new File(parent.getAbsolutePath(), prefix + n + suffix);
                count--;
            } while (f.exists() && count > 0);
            
            if (f.exists()) {
                throw new IOException("Creating temp file failed: "
                                         + "Unable to find unique file name");
            }
            
            try {
                f.createNewFile();
            } catch (IOException e) {
                throw new IOException("Creating dir '" 
                                        + f.getAbsolutePath() + "' failed."); 
            }
        }
        
        return new SimpleTempFile(f);
    }
    
    /**
     * @see org.apache.james.mime4j.message.storage.TempStorage#getRootTempPath()
     */
    public TempPath getRootTempPath() {
        return rootPath;
    }

    private class SimpleTempPath implements TempPath {
        private File path = null;
        
        private SimpleTempPath(String path) {
            this.path = new File(path);
        }
        
        private SimpleTempPath(File path) {
            this.path = path;
        }
        
        /**
         * @see org.apache.james.mime4j.message.storage.TempPath#createTempFile()
         */
        public TempFile createTempFile() throws IOException {
            return SimpleTempStorage.this.createTempFile(this, null, null);
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempPath#createTempFile(java.lang.String, java.lang.String)
         */
        public TempFile createTempFile(String prefix, String suffix) 
                throws IOException {
            
            return SimpleTempStorage.this.createTempFile(this, prefix, suffix);
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempPath#createTempFile(java.lang.String, java.lang.String, boolean)
         */
        public TempFile createTempFile(String prefix, String suffix, 
                                       boolean allowInMemory) 
            throws IOException {
            
            return SimpleTempStorage.this.createTempFile(this, prefix, suffix);
        }
        
        /**
         * @see org.apache.james.mime4j.message.storage.TempPath#getAbsolutePath()
         */
        public String getAbsolutePath() {
            return path.getAbsolutePath();
        }

        /**
         * Do nothing
         */
        public void delete() {
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempPath#createTempPath()
         */
        public TempPath createTempPath() throws IOException {
            return SimpleTempStorage.this.createTempPath(this, null);
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempPath#createTempPath(java.lang.String)
         */
        public TempPath createTempPath(String prefix) throws IOException {
            return SimpleTempStorage.this.createTempPath(this, prefix);
        }
        
    }
    
    private static class SimpleTempFile implements TempFile {
        private File file = null;

        private static final Set filesToDelete = new HashSet();

        private SimpleTempFile(File file) {
            this.file = file;
            this.file.deleteOnExit();
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempFile#getInputStream()
         */
        public InputStream getInputStream() throws IOException {
            return new BufferedInputStream(new FileInputStream(file));
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempFile#getOutputStream()
         */
        public OutputStream getOutputStream() throws IOException {
            return new BufferedOutputStream(new FileOutputStream(file));
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempFile#getAbsolutePath()
         */
        public String getAbsolutePath() {
            return file.getAbsolutePath();
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempFile#delete()
         */
        public void delete() {
            // deleting a file might not immediately succeed if there are still
            // streams left open (especially under Windows). so we keep track of
            // the files that have to be deleted and try to delete all these
            // files each time this method gets invoked.

            // a better but more complicated solution would be to start a
            // separate thread that tries to delete the files periodically.

            synchronized (filesToDelete) {
                if (file != null) {
                    filesToDelete.add(file);
                    file = null;
                }

                for (Iterator iterator = filesToDelete.iterator(); iterator
                        .hasNext();) {
                    File file = (File) iterator.next();
                    if (file.delete())
                        iterator.remove();
                }
            }
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempFile#isInMemory()
         */
        public boolean isInMemory() {
            return false;
        }

        /**
         * @see org.apache.james.mime4j.message.storage.TempFile#length()
         */
        public long length() {
            return file.length();
        }
        
    }
}

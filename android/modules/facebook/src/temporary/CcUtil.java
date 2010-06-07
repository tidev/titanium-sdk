/*
 * Copyright 2009 Codecarpet
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package temporary;

import java.io.BufferedReader;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.List;

import android.graphics.Picture;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;

public class CcUtil {

    public static String componentsJoinedByString(List<String> list, String separator) {
        StringBuilder sb = new StringBuilder();
        sb.append(list.get(0));
        int length = list.size();
        for (int i = 1; i < length; i++) {
            sb.append(separator).append(list.get(i));
        }
        return sb.toString();
    }

    public static final Comparator<String> CASE_INSENSITIVE_COMPARATOR = new Comparator<String>() {
        public int compare(String s1, String s2) {
            return s1.compareToIgnoreCase(s2);
        }
    };

    public static void disconnect(HttpURLConnection conn) {
        if (conn != null) {
            conn.disconnect();
        }
    }

    public static void close(Closeable c) {
        if (c != null) {
            try {
                c.close();
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
    }

    public static StringBuilder getResponse(InputStream data) throws IOException {
        Reader in = new BufferedReader(new InputStreamReader(data, "UTF-8"), 2048);
        StringBuilder buffer = new StringBuilder();
        char[] buf = new char[2048];
        int l = 0;
        while (l >= 0) {
            buffer.append(buf, 0, l);
            l = in.read(buf);
        }
        return buffer;
    }

    public static int rgbFloatToInt(float red, float green, float blue, float alpha) {
        int r = (int) (red * 255 + 0.5);
        int g = (int) (green * 255 + 0.5);
        int b = (int) (blue * 255 + 0.5);
        int a = (int) (alpha * 255 + 0.5);
        int value = ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | ((b & 0xFF) << 0);
        return value;
    }

    public static String encode(CharSequence target) {
        if (target == null) {
            return "";
        }
        String result = target.toString();
        try {
            result = URLEncoder.encode(result, "UTF8");
        } catch (UnsupportedEncodingException ex) {
            ex.printStackTrace();
        }
        return result;
    }

    public static Drawable getDrawable(final Class<? extends Object> clazz, String path) {
        InputStream is = clazz.getClassLoader().getResourceAsStream(path);
        return Drawable.createFromStream(is, path);
    }
    
    public static BitmapDrawable getBitmapDrawable(final Class<? extends Object> clazz, String path) {
        InputStream is = clazz.getClassLoader().getResourceAsStream(path);
        return (BitmapDrawable) BitmapDrawable.createFromStream(is, path);
    }
    
    public static Picture getPicture(final Class<? extends Object> clazz, String path) {
        InputStream is = clazz.getClassLoader().getResourceAsStream(path);
        return Picture.createFromStream(is);
    }

    public static String generateMD5(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] bytes;
            try {
                bytes = value.getBytes("UTF-8");
            } catch (UnsupportedEncodingException e1) {
                bytes = value.getBytes();
            }
            StringBuilder result = new StringBuilder();
            for (byte b : md.digest(bytes)) {
                result.append(Integer.toHexString((b & 0xf0) >>> 4));
                result.append(Integer.toHexString(b & 0x0f));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new RuntimeException(ex);
        }
    }
    
}

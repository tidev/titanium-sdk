/** This is generated, do not edit by hand. **/
package org.appcelerator.kroll.common;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class APIMap {

    private static final Map<String, String> PROXY_MAP = createProxyMap();

    private static Map<String, String> createProxyMap() {
        Map<String, String> result = new HashMap<String, String>();
        return Collections.unmodifiableMap(result);
    }
    
    public static String getProxyClass(String apiName_) {
    	apiName_ = apiName_.replaceFirst("^(Titanium|Ti)\\.", "");
    	Log.d("test", PROXY_MAP.toString());
    	Log.d("APIMap", apiName_);
    	return PROXY_MAP.get(apiName_); 
    }
}
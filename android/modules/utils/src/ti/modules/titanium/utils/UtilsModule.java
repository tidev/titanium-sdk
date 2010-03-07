package ti.modules.titanium.utils;

import java.io.UnsupportedEncodingException;

import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;

import com.sun.org.apache.xml.internal.security.exceptions.Base64DecodingException;
import com.sun.org.apache.xml.internal.security.utils.Base64;

public class UtilsModule extends TiModule
{
	private static final String LCAT = "UtilsModule";

	public UtilsModule(TiContext tiContext) {
		super(tiContext);
	}

	public String base64encode(String data) {
		try {
			return Base64.encode(data.getBytes("UTF-8"));
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		}
		return null;
	}

	public String base64decode(String data)
	{
		try {
			return new String(Base64.decode(data), "UTF-8");
		} catch (UnsupportedEncodingException e) {
			Log.e(LCAT, "UTF-8 is not a supported encoding type");
		} catch (Base64DecodingException e) {
			Log.e(LCAT, "Unable to base64decode: " + e.getMessage());
		}

		return null;
	}

	public String md5HexDigest(String data) {
		return DigestUtils.md5Hex(data);
	}
}

package org.appcelerator.titanium.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.webkit.URLUtil;

public class TiDrawableHelper {
	private static String LCAT = "TiDrawableHelper";
	
	private TiContext context;
	
	public TiDrawableHelper(TiContext ctx) {
		context = ctx;
	}

	public Drawable getFromURL(URL url) throws IOException {
		InputStream lis = url.openStream();
		ByteArrayOutputStream bos = new ByteArrayOutputStream(8192);
		try {
			byte[] buf = new byte[8192];
			for (int c=0 ; (c = lis.read(buf)) != -1 ; )
				bos.write(buf, 0, c);

			Bitmap b = TiUIHelper.createBitmap(new ByteArrayInputStream(bos.toByteArray()));
			if (b == null) throw new OutOfMemoryError(); // TODO: What should I throw here?
			return new BitmapDrawable(b);
		} catch (IOException e) {
			Log.e(TiDrawableHelper.LCAT, "Problem pulling image data from " + url.toString(), e);
			throw e;
		} finally {
			try {
				lis.close();
			} catch (Exception e) {}
			try {
				bos.close();
			} catch (Exception e) {}
		}
	}
	
	public Drawable getFromResource(int resid) {
		return context.getActivity().getResources().getDrawable(resid);
	}
	
	public Drawable getFromPath(String path) throws ResourceNotFoundException {
		if (path.startsWith("/")) path = path.substring(1); // Remove leading slash
		try {
			byte hash[] = MessageDigest.getInstance("MD5").digest(path.getBytes("UTF-8"));
			String hexhash = String.format("%1$032x", new BigInteger(1, hash));
			// We prefix with 'ti' since fields must begin with a letter
			return getFromResource(TiRHelper.getResource("R.drawable.ti" + hexhash));
		}
		catch (NoSuchAlgorithmException e)     { assert false : e.getMessage(); }
		catch (UnsupportedEncodingException e) { assert false : e.getMessage(); }
		return null; // Never get here
	}
	
	public Drawable get(String spec) throws ResourceNotFoundException, IOException {
		// Try Resource string
		if (spec.startsWith("R."))
			return getFromResource(TiRHelper.getResource(spec));
		
		// Try URL
		if (URLUtil.isNetworkUrl(spec)) {
			try { return getFromURL(new URL(spec)); }
			catch (MalformedURLException e) { }
		}
		
		// TODO: NinePatch?
		
		// Fall back to path
		return getFromPath(spec);
	}
}
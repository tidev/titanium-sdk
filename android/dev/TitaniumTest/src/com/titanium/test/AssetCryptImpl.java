package com.titanium.test;

import java.util.Collections;
import java.util.Map;
import java.util.HashMap;
import java.nio.CharBuffer;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.lang.reflect.Method;
import java.lang.System;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import android.os.Debug;


public class AssetCryptImpl implements KrollAssetHelper.AssetCrypt
{

	private static class Range {
		int offset;
		int length;
		public Range(int offset, int length) {
			this.offset = offset;
			this.length = length;
		}
	}

		private static final byte[] assetsBytes = Charset.forName("ISO-8859-1").encode(initAssetsBytes()).array();
	private static CharBuffer initAssetsBytes() {
		CharBuffer buffer = CharBuffer.allocate(1312);
		buffer.append("k^\260L\274\242\210i\272\363\372\023\323\212\210\021\356\360\322\214\247\014\275\215_\030\247d\022:\320\3558K\307/\361\227n\235i\011\3452c\256\267\037\360\374\243\317U8\012\336Z\216\262\271\333\350T\340\260?jd\353\223\344\250\205\246\016\336\244<\203\364\252\273\346\3214 \252\301\327<\210\263{sTyKv\343%\023\366\325\356%\337ix\371\0137C\265\377\212\327=y\354^\321\312\011\220arU)\3739\353\023|+\261\356\231K\274\362\227\225\3352c\274=G\253\317\317\346\253FXw\306\210\0101c\202\331/\274O\024\265\300*zY\236c\330\333\376\300\354|\036l\323@\362\201\351\224\316\261\374\207\351'\017\227\246\227\273\363\242\266a\013wf\257\346\277\015\215\246\210\232d\205~\342UCu \232\234\024q\0153\272\200y\377T^7.N\361\251\217\326,\315\016&\010\323M\016s\345\250DT\235yQ\2144\202\350\334\037\276\364\315\267\030\243K\361\356\357\246\265\016;\232a,\217Z\243\257S6\257\303\0167\012\206k\265\037\355\336\017\341~\271\036'M\342\306\234\201k5G\\\034\234\011\023ch\033\206Z\314\002\306\177s\026Fx\365@\370\312.\246a\325p0\365G\260\361^\011\267\036>\357\240\210w$\322\302{O2\241\013\033\022\206\333\255\360<9\350\"Qn\240\325C\342\230RX\263\323J\302\012\212\036\260\303lnZ\000\214\373\002S%\231`d\273\206s\347\306\324,4\216\222\356\270\230A\024\200\226\232\207\302j\357\232.\267?\207-\201\277\010M!|\237\023\221#\014\275\360\333\342`L\005/u+u\276\232_=\266t\341\204\000`\001kr\237XH@\371\013\330&\366\371y2\261\004\335\276\360\265}K\211\255\366o&\331\036\007k\343\200\210\374\034K\342t\005\2347\343\335\325\257dQp|\361X\034l\355\3000\222\240\260B2=j\276}\035\311\371\342\206\340 \250o:/\273&'\264\247\003d\012\220\374\323\377p\001g\2129\012K\022\177A\226\264\320%\371\344\241u\345\210\000\375)1\223\"=\320\302\345\222N\304\266\276|\021I,<\364Q\224\207\020\372|\236\232)\373\332\027\237\200n|\261\230\251\323\306\232X\377?,\316\376|\277\016bm\357G\306M\206D\272?-\220G\314\274\235\212AK\364\254\304g\356\313\325\034\314\305\347g\237\002\314\253D\022\315\335\313\3035\277b\331\320F\304\356n\307\264-`^\310\202\035\341\266\003z\333\316GO$\322\302{O2\241\013\033\022\206\333\255\360<9\304\320\255U?\265\361\217\0326!\365\000\026\303#T\027\230\000.\027\214\034\347K\237\34196\030\244\371\201c\316\337\251\364\224Q\030\231\230\252~[be\311P\324\313\243\356\300a\030\2250\373\332\3776@\216\241\373f\274\242/\316y\006\240\336\347v\213\032SA_\265x\350!L\354=z~\204\357\226\243\241\376\302\354\323\002m\363\002\376\357W\212\245\330\"\363\333\260j\204\365Y\344\232\367\021\222C\254W\275\015\\)\277\351\325s\353\036\027@\315\321\006\240\331\017\303\224\314%\255\200QE\317Q9+\333\202\356\307\331\267\015\232\205y<\2560O\241;\036\256\200\035\352e\237W\342\036\005,\244cq\231\360\370\373E*\012\273#Q-\206\303\374IZC\331\251(\202\031KVe^\033Og\310*,\276HZ\337G8u!\010\213O$\343\375:\326\365\372\355s\320\015\335\222@q\031\350Jj\030\036\003\222\200k9\3252\306\201Zy\264\256?\246\026\363\353\177S9\307q$\214\006G1$\320T\254\201\235j]\226\342t\226\344\037\377\317\235\374\316\213\267\376\037\261~\0154\357\346\263\267{\275\026#\356\341r\024+q\250\276R*\305J\326C\344-yl\015\331\0364S\336\345\367\320\023q\3333\307\325L\241?\247\004K\0230\306h\347\272\220\252\207\307i\005.\215\304\357! 7\320=\331a\177\037\341y\325,\254\271\346*\346\211\303\031\354\264\017 |\313R\017'\372l\267A\377+4+\350\240&U\315\272\307\355\215\272E\016\030]\310{\302\215\305\212\221%H\007j\272t\002:\372\012f\305NA\332\307\302\254uce \\b\246\220\026k\306']D\037\366\231;\033\356<I\214t{!\370\033&U\357\001zj\032\315\214\332$\313\347\372\307P<@\\\205\003\321\267\317\367p!\024f\255{\346]R\304\246\356g:\232|\315{s\340N\256\005v^!\345\221yo\003\220\310\006\355\2140\214\323\205\232\220\004v\0205h\220\016\037\354\376\240B\214!\362\334T\256\244\341\373\335O\013]\340wMt\350b\234R\266\257x\317uM\3541G`\336\021\351\356\277K\201N\211\306\266\257x\317uM\3541G`\336\021");
		buffer.rewind();
		return buffer;
	}
	private static final Map<String, Range> assets = initAssets();
	private static Map<String, Range> initAssets() {
		Map<String, Range> assets = new HashMap<String, Range>();
		assets.put("app.js", new Range(0, 1168));
		assets.put("_app_props_.json", new Range(1168, 112));
		return Collections.unmodifiableMap(assets);
	}


	public String readAsset(String path)
	{
		TiApplication application = TiApplication.getInstance();
		boolean isProduction = false;
		if (application != null) {
			isProduction = TiApplication.DEPLOY_TYPE_PRODUCTION.equals(application.getAppInfo().getDeployType());
		}

		if (isProduction && Debug.isDebuggerConnected()) {
			Log.e("AssetCryptImpl", "Illegal State. Exit.");
			System.exit(1);
		}

		Range range = assets.get(path);
		if (range == null) {
			return null;
		}
		return new String(filterDataInRange(assetsBytes, range.offset, range.length));
	}

	private static byte[] filterDataInRange(byte[] data, int offset, int length)
	{
		try {
			Class clazz = Class.forName("org.appcelerator.titanium.TiVerify");
			Method method = clazz.getMethod("filterDataInRange", new Class[] {data.getClass(), int.class, int.class});
			return (byte[])method.invoke(clazz, new Object[] { data, offset, length });
		} catch (Exception e) {
			Log.e("AssetCryptImpl", "Unable to load asset data.", e);
		}
		return new byte[0];
	}
}

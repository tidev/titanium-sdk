package ti.harness;

import android.app.Activity;
import android.graphics.Typeface;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.widget.ScrollView;
import android.widget.TextView;

import com.facebook.soloader.nativeloader.NativeLoader;
import com.facebook.soloader.nativeloader.SystemDelegate;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.runtime.hermes.HermesObject;
import org.appcelerator.kroll.runtime.hermes.HermesPromise;
import org.appcelerator.kroll.runtime.hermes.HermesRuntime;
import org.appcelerator.kroll.runtime.hermes.ReferenceTable;

/**
 * Runs the Hermes runtime of the SDK against stand-in Java classes and prints one line per test.
 */
public class MainActivity extends Activity
{
	private static final String TAG = "HermesHarness";

	static {
		NativeLoader.initIfUninitialized(new SystemDelegate());
		System.loadLibrary("fbjni");
		System.loadLibrary("kroll-hermes");
	}

	private final HermesRuntime runtime = new HermesRuntime();
	private final StringBuilder report = new StringBuilder();

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
		try {
			runTests();
		} catch (Throwable t) {
			line("FAIL harness crashed: " + Log.getStackTraceString(t));
		}
		Log.i(TAG, "HARNESS DONE");

		TextView textView = new TextView(this);
		textView.setTypeface(Typeface.MONOSPACE);
		textView.setTextSize(11);
		textView.setPadding(24, 96, 24, 24);
		textView.setText(report);
		ScrollView scrollView = new ScrollView(this);
		scrollView.addView(textView);
		setContentView(scrollView);
	}

	private void line(String text)
	{
		for (String part : text.split("\n")) {
			Log.i(TAG, part);
		}
		report.append(text).append('\n');
	}

	private void check(String name, boolean ok, String detail)
	{
		line((ok ? "PASS " : "FAIL ") + name + (detail == null ? "" : ": " + detail));
	}

	private Object eval(String source)
	{
		return runtime.nativeEvalString(source, "harness.js");
	}

	/** One round of both garbage collectors, with time for the Java finalizer thread. */
	private void collect(int rounds)
	{
		for (int i = 0; i < rounds; i++) {
			Runtime.getRuntime().gc();
			System.runFinalization();
			SystemClock.sleep(50);
			runtime.nativeIdle();
			SystemClock.sleep(50);
			runtime.nativeIdle();
		}
	}

	private void runTests() throws IOException
	{
		long start = SystemClock.elapsedRealtime();
		runtime.nativeInit(null, false, false);
		line("INFO nativeInit took " + (SystemClock.elapsedRealtime() - start) + " ms");

		// --- Functional tests in JS ---
		Object jsReport = eval(readAsset("tests.js"));
		line(jsReport instanceof String ? (String) jsReport : "FAIL tests.js returned " + jsReport);
		check("promise jobs run when the call from Java ends", "resolved:5".equals(eval("promiseResult")), null);

		// --- Calls from Java ---
		runtime.nativeRunModule("globalThis.fromModule = 6 * 7;", "app://mod.js", null);
		check("nativeRunModule", Integer.valueOf(42).equals(eval("fromModule")) && "app://mod.js".equals(eval("lastModule")),
			null);

		KrollRuntime.lastException = null;
		Object failed = eval("(function () { throw new Error('uncaught'); }())");
		check("uncaught JS error reaches dispatchException", failed == null && KrollRuntime.lastException != null
			&& KrollRuntime.lastException.startsWith("uncaught @ harness.js:1:"), KrollRuntime.lastException);

		eval("globalThis.settled = 'no'; globalThis.attach = function (p) { p.then(v => { settled = 'yes:' + v; }); };");
		HermesPromise promise = new HermesPromise();
		eval("globalThis.takePromise = function () { return 1; };");
		// Java settles a promise that Java created. JS reads it through a proxy method result.
		TestProxy.kept = null;
		eval("globalThis.holder = new TestProxy();");
		promise.resolve("done");
		check("Java creates and resolves a promise", promise.getPointer() != 0, null);

		// --- Lifetime tests ---
		// Collect the proxies of the tests above first. Only the module instance and "holder" stay.
		collect(5);
		int before = TestProxy.liveCount();
		line("INFO live proxies before the lifetime tests: " + before + ", table size " + ReferenceTable.size());
		int tableBefore = ReferenceTable.size();

		// 1. A proxy that only JS used, with a listener that refers to the proxy itself.
		eval("(function () { var p = new TestProxy(); p.self = p; p.addEventListener('x', function () { return p; }); }())");
		check("cycle test created one proxy", TestProxy.liveCount() == before + 1, null);
		collect(4);
		check("JS-only proxy with a self-referencing listener is collected",
			TestProxy.liveCount() == before && ReferenceTable.size() == tableBefore,
			"live " + TestProxy.liveCount() + " (expected " + before + "), table " + ReferenceTable.size()
				+ " (expected " + tableBefore + ")");

		// 2. Java holds the proxy, JS drops it. The JS state must survive.
		eval("(function () { var p = new TestProxy(); p.custom = 42;"
			+ " p.addEventListener('ping', function (e) { globalThis.got = [this.custom, e.n, this === e.source]; });"
			+ " p.keepInJava(); }())");
		collect(4);
		check("Java-held proxy survives", TestProxy.kept != null && TestProxy.liveCount() == before + 1, null);
		java.util.HashMap<String, Object> data = new java.util.HashMap<>();
		data.put("n", 8);
		boolean handled = ((HermesObject) TestProxy.kept.getKrollObject()).fireEvent("ping", data);
		check("JS state of a Java-held proxy survives after JS dropped it",
			handled && "[42,8,true]".equals(eval("JSON.stringify(got)")), String.valueOf(eval("JSON.stringify(got)")));

		// 3. Java drops it too.
		TestProxy.kept = null;
		eval("globalThis.got = undefined;");
		collect(4);
		check("proxy is collected after Java dropped it too", TestProxy.liveCount() == before,
			"live " + TestProxy.liveCount() + " (expected " + before + ")");

		// 4. JS holds the proxy, Java does not. Use it across collections.
		eval("globalThis.h = new TestProxy(); h.text = 'kept by JS'; h.extra = 1;");
		collect(3);
		check("JS-held proxy keeps its Java object", "kept by JS".equals(eval("h.text")), String.valueOf(eval("h.text")));
		collect(3);
		check("JS-held proxy still works after more collections",
			Integer.valueOf(2).equals(eval("h.extra + h.echo(1)")), null);
		eval("globalThis.h = undefined;");
		collect(4);
		check("JS-held proxy is collected after JS dropped it", TestProxy.liveCount() == before,
			"live " + TestProxy.liveCount() + " (expected " + before + ")");

		// 5. Two proxies that refer to each other, one of them held by Java for a while.
		eval("(function () { var a = new TestProxy(); var b = new TestProxy(); a.other = b; b.other = a; a.keepInJava(); }())");
		collect(4);
		check("a proxy pair with a cycle survives while Java holds one of them", TestProxy.liveCount() == before + 2,
			"live " + TestProxy.liveCount() + " (expected " + (before + 2) + ")");
		TestProxy.kept = null;
		collect(5);
		check("the pair is collected after Java dropped it", TestProxy.liveCount() == before,
			"live " + TestProxy.liveCount() + " (expected " + before + ")");

		// 6. Many proxies, to measure the cost and to find leaks.
		start = SystemClock.elapsedRealtime();
		eval("(function () { for (var i = 0; i < 5000; i++) { var p = new TestProxy({ title: 't' + i }); p.text = 'x'; } }())");
		long createMs = SystemClock.elapsedRealtime() - start;
		collect(5);
		check("5000 dropped proxies are collected", TestProxy.liveCount() == before,
			"created in " + createMs + " ms, live " + TestProxy.liveCount() + " (expected " + before + ")");

		// 7. Proxies that JS code holds through an ES Proxy object.
		eval("(function () { for (var i = 0; i < 200; i++) { var a = new IndexedProxy(); a[1] = i; a.self = a;"
			+ " var b = new InterceptProxy(); b.text = b.xyz; } }())");
		collect(5);
		check("dropped proxies with indexed properties or an interceptor are collected",
			TestProxy.liveCount() == before, "live " + TestProxy.liveCount() + " (expected " + before + ")");

		// 8. Proxies that Java created first, and proxies of a class made with inherit().
		eval("(function () { var p = new TestProxy(); var Child = TestProxy.inherit(function Child() {});"
			+ " for (var i = 0; i < 200; i++) { p.makeChild().text = 'c'; new Child().text = 'd'; } }())");
		collect(5);
		check("dropped proxies that Java created first or that use inherit() are collected",
			TestProxy.liveCount() == before, "live " + TestProxy.liveCount() + " (expected " + before + ")");

		line("INFO proxies that JS still holds: " + eval("Object.keys(globalThis).filter(function (k) {"
			+ " return globalThis[k] instanceof Ti.Proxy; }).join()"));

		runtime.nativeDispose();
		check("nativeDispose", ReferenceTable.size() == 0, "table " + ReferenceTable.size());
	}

	private String readAsset(String name) throws IOException
	{
		try (InputStream stream = getAssets().open(name)) {
			ByteArrayOutputStream bytes = new ByteArrayOutputStream();
			byte[] buffer = new byte[8192];
			int count;
			while ((count = stream.read(buffer)) > 0) {
				bytes.write(buffer, 0, count);
			}
			return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
		}
	}
}

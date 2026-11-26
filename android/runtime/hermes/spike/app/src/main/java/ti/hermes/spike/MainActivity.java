package ti.hermes.spike;

import android.app.Activity;
import android.graphics.Typeface;
import android.os.Bundle;
import android.util.Log;
import android.widget.ScrollView;
import android.widget.TextView;

import com.facebook.soloader.nativeloader.NativeLoader;
import com.facebook.soloader.nativeloader.SystemDelegate;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity
{
	private static final String TAG = "HermesSpike";

	static {
		// "libhermesvm.so" calls Java through fbjni. fbjni loads its library through NativeLoader,
		// and it aborts the process if nobody initialized NativeLoader first.
		NativeLoader.initIfUninitialized(new SystemDelegate());
		System.loadLibrary("fbjni");
		System.loadLibrary("spike");
	}

	private static native String nativeRun(String script, String scriptName);

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		String report;
		try {
			report = nativeRun(readAsset("test.js"), "test.js");
		} catch (Throwable t) {
			report = "FAIL spike crashed: " + Log.getStackTraceString(t);
		}
		for (String line : report.split("\n")) {
			Log.i(TAG, line);
		}
		Log.i(TAG, "SPIKE DONE");

		TextView textView = new TextView(this);
		textView.setTypeface(Typeface.MONOSPACE);
		textView.setTextSize(11);
		textView.setPadding(24, 96, 24, 24);
		textView.setText(report);
		ScrollView scrollView = new ScrollView(this);
		scrollView.addView(textView);
		setContentView(scrollView);
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

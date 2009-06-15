package org.appcelerator.tidev;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;
import org.appcelerator.titanium.TitaniumActivityGroup;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.DialogInterface.OnClickListener;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.widget.ProgressBar;
import android.widget.TextView;

public class TiDevAppLauncherActivity extends Activity
{
	private static final String LCAT = "TiDevAppLaunchAct";

	private static final Integer TIMEOUT = 5000;

	private ProgressBar pbar;
	private TextView progressMessage;
	private Handler handler;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		handler = new Handler();
		setContentView(R.layout.launch);

		pbar = (ProgressBar) findViewById(R.id.launch_progress);
		progressMessage = (TextView) findViewById(R.id.progress_message);
		progressMessage.setText("Loaded");

	}

	@Override
	protected void onResume() {
		super.onResume();

		pbar.refreshDrawableState();

		new Thread(new Runnable() {
			public void run() {
				doTitaniumApp();
			}}).start();
	}

	private void doTitaniumApp( )
	{

		postMessage("Initializing...");
		postProgress(10);
		TitaniumIntentWrapper ti = new TitaniumIntentWrapper(getIntent());
		String url = ti.getIntent().getData().toString();

   		HttpGet httpGet = new HttpGet(url);

   		HttpClient client = new DefaultHttpClient();
   		client.getParams().setIntParameter("http.socket.timeout", TIMEOUT);
   		client.getParams().setIntParameter("http.connection.timeout", TIMEOUT);
   		client.getParams().setIntParameter("http.connection-manager.timeout", TIMEOUT);

   		ResponseHandler<byte[]> responseHandler = new ResponseHandler<byte[]>(){

			public byte[] handleResponse(HttpResponse response)
				throws ClientProtocolException, IOException
			{
		         StatusLine statusLine = response.getStatusLine();
		         if (statusLine.getStatusCode() >= 300) {
		        	 throw new HttpResponseException(statusLine.getStatusCode(),
		        			 statusLine.getReasonPhrase());
		         }

		         HttpEntity entity = response.getEntity();
		         return entity == null ? null : EntityUtils.toByteArray(entity);
			}
   		};

   		try {
   			postMessage("Retrieving...");
   			postProgress(25);
   			byte[] data = client.execute(httpGet, responseHandler);
   			postProgress(50);
   			FileOutputStream fos = null;

   			postMessage("Storing to sdcard...");
   			fos = new FileOutputStream("/sdcard/tiapp.zip");
   			fos.write(data);
   			fos.close();
   			postProgress(65);

   			client.getConnectionManager().shutdown();
   		} catch (Throwable t) {
   			Log.e(LCAT, "Error retrieving app from " + url, t);
   			handleError("Error retrieving app from " + url, t);
   			return;
   		}

   		postMessage("Installing...");
   		postProgress(75);
		TitaniumFileHelper tfh = new TitaniumFileHelper(this);
		try {
			File dest = getDir(TitaniumFileHelper.TI_DIR, Context.MODE_PRIVATE);
			tfh.deployFromZip(new File("/sdcard/tiapp.zip"), dest);

			postMessage("Preparing to Launch");
			postProgress(95);
			Intent intent = new Intent(this,TitaniumActivityGroup.class);
			ti = new TitaniumIntentWrapper(intent);
			ti.setIsContent(true);

			postProgress(99);
			launchAndFinish(ti.getIntent());
		} catch (IOException e) {
			Log.e("TiDevLauncher", "Error installing zip", e);
			handleError("Error installing from zip: ", e);
			return;
		}
	}

	private void postMessage(final String message) {
		runOnUiThread(new Runnable() {
			public void run() {
				progressMessage.setText(message);
			}});
	}

	private void postProgress(final int progress) {
		runOnUiThread(new Runnable() {
			public void run() {
				pbar.setProgress(progress);
				pbar.setSecondaryProgress(progress);
			}});

	}

	private void launchAndFinish(final Intent intent) {
		handler.postDelayed(new Runnable() {
			public void run() {
				startActivity(intent);
				finish();
			}
		}, 1000);
	}

	private void handleError(final String message, final Throwable e) {
		final TiDevAppLauncherActivity me = this;

		runOnUiThread(new Runnable() {
			public void run() {
				pbar.setProgress(0);
				progressMessage.setText("Error");

		        new AlertDialog.Builder(me)
		        .setTitle("Unable to Launch")
		        .setMessage(message +"\n" + e.getMessage())
		        .setPositiveButton(android.R.string.ok, new OnClickListener(){

					public void onClick(DialogInterface arg0, int arg1) {
						me.finish();
					}})
		        .setCancelable(false)
		        .create()
		        .show();
			}
		});
	}
}

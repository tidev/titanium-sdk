/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.ServerSocket;
import java.net.Socket;

import org.appcelerator.kroll.KrollApplication;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.util.KrollStreamHelper;
import org.appcelerator.kroll.util.TiTempFileHelper;

import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.os.Looper;
import android.os.Process;
import android.widget.Toast;

/**
 * This class is primarily responsible for communicating
 * with the Android FastDev server, and providing
 * APIs to tell whether or not FastDev is currently enabled
 */
public class TiFastDev
{
	private static final String TAG = "TiFastDev";

	// To enable trace debugging for fastdev, connect via adb shell and issue this command:
	// setprop log.tag.TiFastDev ASSERT
	private static final boolean TRACE = android.util.Log.isLoggable(TAG, android.util.Log.ASSERT);

	private static TiFastDev _instance;
	private static final String EMULATOR_HOST = "10.0.2.2";
	private static final int FASTDEV_PORT = 7999;
	private static final String TEMP_FILE_PREFIX = "tifastdev";
	private static final String TEMP_FILE_SUFFIX = "tmp";

	public static final String COMMAND_LENGTH = "length";
	public static final String COMMAND_EXISTS = "exists";
	public static final String COMMAND_GET = "get";
	public static final String COMMAND_HANDSHAKE = "handshake";
	public static final String COMMAND_KILL = "kill";
	public static final String COMMAND_RESTART = "restart";
	public static final String COMMAND_SHUTDOWN = "shutdown";

	public static final String UTF8_CHARSET = "UTF-8";
	public static final String RESULT_OK = "OK";
	public static final int MAX_TOKEN_COUNT = 16;

	protected boolean enabled = false, listen = false;
	protected int port = -1;
	protected String appGuid, urlPrefix;
	protected Socket fastDevSocket;
	protected Session session;
	protected boolean restarting = false;
	protected TiTempFileHelper tempHelper;

	public static void initFastDev(KrollApplication app)
	{
		_instance = new TiFastDev(app);
	}

	public static TiFastDev getInstance()
	{
		return _instance;
	}

	public TiFastDev(KrollApplication app)
	{
		if (app == null) {
			return;
		}

		appGuid = app.getAppGUID();
		tempHelper = app.getTempFileHelper();
		if (!app.isFastDevMode()) {
			return;
		}

		TiDeployData deployData = app.getDeployData();
		if (deployData == null) {
			return;
		}

		enabled = true;
		readDeployData(deployData);

		if (enabled && fastDevSocket != null) {
			session = new Session();
			session.executeHandshake();
			session.start();
		}
	}

	protected void readDeployData(TiDeployData deployData)
	{
		port = deployData.getFastDevPort();
		listen = deployData.getFastDevListen();

		if (listen) {
			Log.d(TAG, "Enabling Fastdev in listening mode...");
			acceptConnection();

		} else if (port != -1) {
			Log.d(TAG, "Enabling Fastdev on port " + port);
			connect();

		} else {
			enabled = false;
		}
	}

	protected void acceptConnection()
	{
		try {
			ServerSocket server = new ServerSocket(FASTDEV_PORT);
			fastDevSocket = server.accept();

		} catch (IOException e) {
			Log.w(TAG, e.getMessage(), e);
			enabled = false;
			showDisabledWarning(e);
		}
	}

	protected void connect()
	{
		try {
			fastDevSocket = new Socket(EMULATOR_HOST, port);

		} catch (Exception e) {
			Log.w(TAG, e.getMessage(), e);
			enabled = false;
			showDisabledWarning(e);
		}
	}

	protected void showToast(String message)
	{
		if (Looper.myLooper() == null) {
			Looper.prepare();
		}

		Context ctx = KrollRuntime.getInstance().getKrollApplication().getCurrentActivity();
		Toast toast = Toast.makeText(ctx, message, Toast.LENGTH_LONG);
		toast.show();
	}

	protected void showDisabledWarning(Exception e)
	{
		showToast("Warning: FastDev mode is disabled. Error Message: " + e.getMessage());
	}

	public String toURL(String relativePath)
	{
		return urlPrefix + "/" + relativePath;
	}

	public int getLength(String relativePath)
	{
		byte result[][] = session.sendMessage(COMMAND_LENGTH, relativePath);
		if (result != null && result.length > 0) {
			return session.toInt(result[0]);
		}

		return -1;
	}
	
	public boolean fileExists(String path)
	{
		byte result[][] = session.sendMessage(COMMAND_EXISTS, path);
		if (result != null && result.length > 0) {
			return (session.toInt(result[0]) > 0);
		}

		return false;
	}

	public InputStream openInputStream(String relativePath)
	{
		synchronized (session) {
			session.checkingForMessage = false;
			session.sendTokens(COMMAND_GET, relativePath);

			int tokenCount = session.readTokenCount();
			if (tokenCount < 1) {
				return null;
			}
	
			int length = session.readInt();
			if (length <= 0) {
				return null;
			}

			try {
				// Pull immediately to a temporary file so we avoid tying up
				// the connection if the app is doing a long-running task with the file.
				File tempFile = tempHelper.createTempFile(TEMP_FILE_PREFIX, TEMP_FILE_SUFFIX);
				FileOutputStream tempOut = new FileOutputStream(tempFile);
				KrollStreamHelper.pumpCount(session.getInputStream(), tempOut, length);
				tempOut.close();

				session.checkingForMessage = true;
				return new FileInputStream(tempFile);

			} catch (FileNotFoundException e) {
				Log.e(TAG, e.getMessage(), e);

			} catch (IOException e) {
				Log.e(TAG, e.getMessage(), e);
			}
		}
		return null;
	}

	public static boolean isFastDevEnabled()
	{
		if (_instance == null) {
			_instance = new TiFastDev(KrollRuntime.getInstance().getKrollApplication());
		}

		return _instance.isEnabled();
	}

	public static void onDestroy()
	{
		// onDestroy will be called after the new activity is launched
		// so protect the new instance here
		if (_instance != null && _instance.restarting) {
			_instance.restarting = false;
			return;
		}

		if (_instance != null && _instance.session != null) {
			_instance.session.close();
			_instance.session = null;
		}

		_instance = null;
	}

	public boolean isEnabled()
	{
		return enabled;
	}

	protected class Session extends Thread
	{
		// binary protocol:
		// message := tokenCount token+
		// token   := length data
		// tokenCount, length are 4 byte integers
		// All messages require a response

		protected InputStream in;
		protected OutputStream out;
		protected boolean connected = true, checkingForMessage = false;

		public Session()
		{
			try {
				in = fastDevSocket.getInputStream();
				out = fastDevSocket.getOutputStream();

			} catch (IOException e) {
				Log.e(TAG, e.getMessage(), e);
			}
		}

		public InputStream getInputStream()
		{
			return in;
		}

		protected boolean blockRead(byte[] buffer)
		{
			try {
				int bytesRead = 0;
				while (bytesRead < buffer.length)
				{
					int read = in.read(buffer, bytesRead, buffer.length - bytesRead);
					if (read < 0) {
						return false;
					}

					bytesRead += read;
					if (bytesRead == buffer.length) {
						return true;
					}
				}
			} catch (IOException e) {
				Log.e(TAG, e.getMessage(), e);
			}

			return false;
		}

		protected int toInt(byte data[])
		{
			return (data[0] << 24) +
				((data[1] & 0xFF) << 16) +
				((data[2] & 0xFF) << 8) + 
				(data[3] & 0xFF);
		}

		protected byte[] toBytes(int data)
		{
			byte bytes[] = new byte[4];
			bytes[0] = (byte) (data >>> 24);
			bytes[1] = (byte) (data >>> 16);
			bytes[2] = (byte) (data >>> 8);
			bytes[3] = (byte) data;

			return bytes;
		}

		protected int readInt()
		{
			byte buffer[] = new byte[4];
			if (blockRead(buffer)) {
				return toInt(buffer);
			}

			return -1;
		}

		protected byte[] readToken()
		{
			int length = readInt();
			if (length > 0) {
				byte tokenData[] = new byte[length];
				if (blockRead(tokenData)) {
					return tokenData;
				}
			}
			return null;
		}

		public void run()
		{
			while (connected) {
				try {
					if (checkingForMessage) {
						if (in.available() > 0) {
							byte message[][] = readMessage();
							if (message == null) break;
							execute(message);
						}
					}
					Thread.sleep(300L);
				} catch (Exception e) {
					Log.e(TAG, e.getMessage(), e);
				}
			}
		}

		protected void handshakeError(String guid, String result)
		{
			Log.e(TAG, "Fastdev session didn't receive the correct handshake (sent: "+guid+", result: "+result+"), aborting.");
			connected = false;
			enabled = false;
		}

		protected void executeHandshake()
		{
			byte resultData[][] = sendMessage(COMMAND_HANDSHAKE, appGuid);
			if (resultData == null) {
				handshakeError(appGuid, null);
				return;
			}

			String result = new String(resultData[0]);
			if (!result.equals(RESULT_OK)) {
				handshakeError(appGuid, result);

			} else {
				Log.d(TAG, "Fastdev session handshake succesful.");
			}
		}

		protected int readTokenCount()
		{
			int tokenCount = readInt();
			if (tokenCount > 0) {
				if (tokenCount > MAX_TOKEN_COUNT) return -1;
				return tokenCount;
			}

			return -1;
		}

		protected byte[][] readMessage()
		{
			int tokenCount = readTokenCount();
			if (tokenCount > 0) {
				byte tokens[][] = new byte[tokenCount][];
				for (int i = 0; i < tokenCount; i++) {
					tokens[i] = readToken();
				}

				return tokens;
			}

			return null;
		}

		protected void execute(byte message[][])
		{
			try {
				String command = new String(message[0], UTF8_CHARSET);
				if (TRACE) {
					Log.d(TAG, "Execute command: " + command);
				}

				if (COMMAND_KILL.equals(command)) {
					executeKill();

				} else if (COMMAND_RESTART.equals(command)) {
					executeRestart();
				}
			} catch (UnsupportedEncodingException e) {
				Log.e(TAG, e.getMessage(), e);
			}
		}

		protected void executeKill()
		{
			String message ="Killing app from Fastdev server request";
			Log.w(TAG, message);
			showToast(message);

			sendTokens(RESULT_OK);
			Process.killProcess(Process.myPid());
		}

		protected void executeRestart()
		{
			String message = "Restarting app from Fastdev server request";
			Log.w(TAG, message);
			showToast(message);
			restarting = true;

			sendTokens(RESULT_OK);
			Application app = (Application) KrollRuntime.getInstance().getKrollApplication();
			Intent i = app.getPackageManager().getLaunchIntentForPackage(app.getPackageName());
			i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
			i.addCategory(Intent.CATEGORY_LAUNCHER);
			app.startActivity(i);
		}

		protected boolean sendTokens(String... tokens)
		{
			try {
				byte tokenLen[] = toBytes(tokens.length);
				out.write(tokenLen);
				for (String token : tokens) {
					byte data[] = token.getBytes(UTF8_CHARSET);
					byte len[] = toBytes(data.length);
					out.write(len);
					out.write(data);
				}
				return true;
			} catch (IOException e) {
				Log.e(TAG, e.getMessage(), e);
				return false;
			}
		}

		public synchronized byte[][] sendMessage(String... tokens)
		{
			checkingForMessage = false;
			if (sendTokens(tokens)) {
				byte message[][] = readMessage();
				if (TRACE) {
					Log.d(TAG, "sent tokens successfully");
				}

				checkingForMessage = true;
				return message;
			}

			if (TRACE) {
				Log.d(TAG, "error sending tokens");
			}

			checkingForMessage = true;
			return null;
		}

		public void close()
		{
			connected = false;
			if (fastDevSocket != null) {
				try {
					fastDevSocket.close();
					fastDevSocket = null;

				} catch (IOException e) {
					Log.e(TAG, e.getMessage(), e);
				}
			}
		}

	}
}

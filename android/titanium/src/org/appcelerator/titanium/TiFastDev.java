/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.ServerSocket;
import java.net.Socket;

import org.appcelerator.titanium.util.Log;

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
	private static TiFastDev _instance;
	private static final int FASTDEV_PORT = 7999;

	public static final String COMMAND_GET = "get";
	public static final String COMMAND_HANDSHAKE = "handshake";
	public static final String COMMAND_KILL = "kill";
	public static final String COMMAND_RESTART = "restart";
	public static final String COMMAND_SHUTDOWN = "shutdown";

	public static final String UTF8_CHARSET = "UTF-8";
	public static final String RESULT_OK = "OK";
	public static final int MAX_TOKEN_COUNT = 16;

	public static TiFastDev getInstance()
	{
		if (_instance == null) {
			_instance = new TiFastDev();
		}
		return _instance;
	}

	protected boolean enabled = false, listen = false;
	protected int port = -1;
	protected String urlPrefix;
	protected Socket fastDevSocket;
	protected Session session;
	protected boolean restarting = false;

	public TiFastDev()
	{
		TiApplication app = TiApplication.getInstance();
		if (app.isFastDevMode()) {
			TiDeployData deployData = app.getDeployData();
			if (deployData != null) {
				enabled = true;
				readDeployData(deployData);

				if (enabled && fastDevSocket != null)
				{
					session = new Session();
					session.executeHandshake();
					session.start();
				}
			}
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
			fastDevSocket = new Socket("10.0.2.2", port);
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
		Context ctx = TiApplication.getInstance().getRootActivity();
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

	public InputStream openInputStream(String relativePath)
	{
		byte tokens[][] = session.sendMessage(COMMAND_GET, relativePath);
		if (tokens == null) {
			return null;
		}

		ByteArrayInputStream dataStream = new ByteArrayInputStream(tokens[0]);
		return dataStream;
	}

	public static boolean isFastDevEnabled()
	{
		return getInstance().isEnabled();
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

		protected byte[] readToken()
		{
			byte lenBuffer[] = new byte[4];
			if (blockRead(lenBuffer)) {
				int length = toInt(lenBuffer);
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
			String guid = TiApplication.getInstance().getAppInfo().getGUID();
			byte resultData[][] = sendMessage(COMMAND_HANDSHAKE, guid);
			if (resultData == null) {
				handshakeError(guid, null);
				return;
			}
			String result = new String(resultData[0]);
			if (!result.equals(RESULT_OK)) {
				handshakeError(guid, result);
			} else {
				Log.d(TAG, "Fastdev session handshake succesful.");
			}
		}

		protected byte[][] readMessage()
		{
			byte tokenBuffer[] = new byte[4];
			if (blockRead(tokenBuffer)) {
				int tokenCount = toInt(tokenBuffer);

				if (tokenCount > MAX_TOKEN_COUNT) return null;
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
				if (COMMAND_KILL.equals(command)) {
					executeKill();
				}
				else if (COMMAND_RESTART.equals(command)) {
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
			TiApplication app = TiApplication.getInstance();
			Intent i = app.getPackageManager().getLaunchIntentForPackage(app.getPackageName());
			i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
			i.addCategory(Intent.CATEGORY_LAUNCHER);
			app.getRootActivity().startActivity(i);
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
				Log.d(TAG, "sent tokens successfully");
				checkingForMessage = true;
				return message;
			}
			Log.d(TAG, "error sending tokens");
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

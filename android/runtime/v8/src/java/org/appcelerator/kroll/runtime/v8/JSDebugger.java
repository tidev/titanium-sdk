/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Scanner;
import java.util.concurrent.LinkedBlockingQueue;

import android.net.LocalSocket;
import android.os.Handler;
import android.os.Looper;

import org.appcelerator.kroll.common.Log;

public final class JSDebugger
{
	private static final String TAG = "JSDebugger";

	// The line endings assumed by the debug protocol
	private static final String LINE_ENDING = "\r\n";

	// Line ending as bytes for writing out to V8MessageHandler
	private static final byte[] LINE_END_BYTES = LINE_ENDING.getBytes();

	// The message used to disconnect the debugger from V8
	private static final String DISCONNECT_MESSAGE = "{\"seq\":0,\"type\":\"request\",\"command\":\"disconnect\"}";

	// The handshake message
	// FIXME Grab the v8 version from the system!
	private static final String HANDSHAKE_MESSAGE = "Type: connect\r\nV8-Version: 5.1.281.59\r\nProtocol-Version: 1\r\nEmbedding-Host: Titanium v%s\r\nContent-Length: 0\r\n\r\n";

	// The port to listen to for debugger connections
	private final int port;

	// The sdk version we report in embedding host header for handshake message to debugger.
	private final String sdkVersion;

	// Holding place for messages received from V8 intended for debugger
	private LinkedBlockingQueue<String> v8Messages = new LinkedBlockingQueue<String>();

	// The thread which acts as the main agent for listening to debugger and V8 messages
	private DebugAgentThread agentThread;

	// The Handler used to post runnables to the main thread
	private final Handler mainHandler;

	// The runnable used to tell V8 to process the debug messages on the main thread.
	private final Runnable processDebugMessagesRunnable = new Runnable() {
		@Override
		public void run() {
			nativeProcessDebugMessages();
		}
	};

	public JSDebugger(int port, Handler mainHandler, String sdkVersion) {
		this.port = port;
		this.mainHandler = mainHandler;
		this.sdkVersion = sdkVersion;
	}

	/**
	 * This receives messages from V8's Debug API to be forwarded on to the attached debugger.
	 * @param message The actual JSON message received.
	 */
	public void handleMessage(String message)
	{
		Log.v(TAG, "Received message from V8: " + message);
		v8Messages.add(message);
	}

	public void sendMessage(String message)
	{
		byte[] cmdBytes = null;
		try
		{
			cmdBytes = message.getBytes("UTF-16LE");
		}
		catch (UnsupportedEncodingException e)
		{
			// ignore, should never happen
		}

		Log.v(TAG, "Sending message to V8: " + message);

		// Send the command to V8 via C++
		nativeSendCommand(cmdBytes, cmdBytes.length);

		// Tell V8 to process the message (on the main thread)
		Log.v(TAG, "Asking V8 to process debug messages...");
		mainHandler.post(processDebugMessagesRunnable);
	}

	public void start() {
		this.agentThread = new DebugAgentThread("titanium-debug");
		this.agentThread.start();

		// Tell C++ side to hook up the debug message handler
		Log.v(TAG, "Enabling debugging with V8 in C++...");
		nativeEnable();
	}

	/**
	 * Wipe the queued messages from V8
	 */
	private void clearMessages() {
		v8Messages.clear();
	}

	// JNI method prototypes
	private native void nativeProcessDebugMessages();
	private native void nativeEnable();
	private native void nativeDisable();
	private native void nativeDebugBreak();
	private native boolean nativeIsDebuggerActive();
	private native void nativeSendCommand(byte[] command, int length);

	/**
	 * This replaces what used to be built into V8 before. We listen on a port
	 * for debugger connections and act as a go-between to shuttle messages back
	 * and forth between the debugger and V8.
	 */
	private class DebugAgentThread extends Thread {

		private ServerSocket serverSocket;
		private V8MessageHandler v8MessageHandler;
		private DebuggerMessageHandler debuggerMessageHandler;

		private DebugAgentThread(String name) {
			super(name);
		}

		public void run() {
			try {
				serverSocket = new ServerSocket();
				serverSocket.setReuseAddress(true);
				serverSocket.bind(new InetSocketAddress(port));
				while (true) {
					Socket socket = null;
					try {
						socket = serverSocket.accept();

						Log.v(TAG, "Received debugger connection!");

						// handle messages coming from V8 -> Debugger
						this.v8MessageHandler = new V8MessageHandler(socket);
						Thread v8MessageThread = new Thread(this.v8MessageHandler);
						v8MessageThread.start();

						// handle messages coming from Debugger -> V8
						this.debuggerMessageHandler = new DebuggerMessageHandler(socket);
						Thread debuggerMessageThread = new Thread(this.debuggerMessageHandler);
						debuggerMessageThread.start();

						// Wait until the debugger thread dies (because debugger says it's done)
						debuggerMessageThread.join();

						// Stop listening to V8
						this.v8MessageHandler.stop();
					} catch (Throwable t) {
						// TODO We should at least log this...
					} finally {
						try {
							// Close our connection to the debugger
							if (socket != null) {
								socket.close();
							}
						} catch (Throwable t) {
							// ignore
						}

						// Wipe the messages from V8
						JSDebugger.this.clearMessages();
					}
				}
			} catch (Throwable t) {
				// TODO Log it? Do something?
			} finally {
				try {
					if (serverSocket != null) {
						serverSocket.close();
					}
				} catch (IOException e) {
					// ignore
				}
			}
		}
	}

	private class V8MessageHandler implements Runnable
	{
		private OutputStream output;
		private boolean stop;

		// Dummy message used to stop the sentinel loop if it was waiting on v8Messages.take() while stop() got called.
		private static final String STOP_MESSAGE = "STOP_MESSAGE";

		public V8MessageHandler(Socket socket) throws IOException
		{
			this.output = socket.getOutputStream();
		}

		public void stop()
		{
			this.stop = true;
			// put dummy message into queue to unlock on take() below.
			JSDebugger.this.v8Messages.add(STOP_MESSAGE);
		}

		@Override
		public void run()
		{
			this.sendHandshake();
			while (!stop)
			{
				try
				{
					Log.v("V8MessageHandler", "Waiting for next message from V8...");
					String message = JSDebugger.this.v8Messages.take();
					if (message.equals(STOP_MESSAGE))
					{
						break;
					}

					this.sendMessageToDebugger(message);
				}
				catch (Throwable t)
				{
					// ignore
					t.printStackTrace();
				}
			}

			try
			{
				this.output.close();
			}
			catch (IOException e)
			{
				// ignore
				e.printStackTrace();
			}
		}

		private void sendHandshake()
		{
			Log.v("V8MessageHandler", "Sending handshake message from V8 to Debugger");
			try
			{
				output.write(String.format(HANDSHAKE_MESSAGE, JSDebugger.this.sdkVersion).getBytes("UTF8"));
				output.flush();
			}
			catch (IOException e)
			{
				// FIXME Stop the DebuggerMessageHandler too!
				e.printStackTrace();
			}
		}

		private void sendMessageToDebugger(String msg)
		{
			byte[] utf8;
			try
			{
				utf8 = msg.getBytes("UTF8");
			}
			catch (UnsupportedEncodingException e)
			{
				// should never happen...
				return;
			}

			Log.v("V8MessageHandler", "Forwarding message from V8 to Debugger: " + msg);
			try
			{
				String s = "Content-Length: " + utf8.length;
				output.write(s.getBytes("UTF8"));
				output.write(LINE_END_BYTES);

				output.write(LINE_END_BYTES);

				output.write(utf8);
				output.flush();
			}
			catch (IOException e)
			{
				// FIXME Stop the DebuggerMessageHandler too!
				e.printStackTrace();
			}
		}
	}

	private enum State
	{
		Header, Message
	}

	private class DebuggerMessageHandler implements Runnable
	{
		private BufferedReader input;
		private Scanner scanner;
		private boolean stop;

		public DebuggerMessageHandler(Socket socket) throws IOException
		{
			this.input = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		}

		public void stop()
		{
			this.stop = true;
			this.scanner.close();
		}

		public void run()
		{
			scanner = new Scanner(this.input);
			scanner.useDelimiter(LINE_ENDING);

			List<String> headers = new ArrayList<String>();
			String line;
			State state = State.Header;
			int messageLength = -1;
			String leftOver = null;

			try
			{
				while (!stop && ((line = (leftOver != null) ? leftOver : scanner.nextLine()) != null))
				{
					Log.v("DebuggerMessageHandler", "Received line from Debugger: " + line);
					switch (state)
					{
					case Header:
						if (line.length() == 0)
						{
							state = State.Message;
						}
						else
						{
							headers.add(line);
							if (line.startsWith("Content-Length:"))
							{
								String strLen = line.substring(15).trim();
								messageLength = Integer.parseInt(strLen);
							}

							if (leftOver != null)
							{
								leftOver = null;
							}
						}
						break;

					case Message:
						if ((-1 < messageLength) && (messageLength <= line.length()))
						{
							String message = line.substring(0, messageLength);
							if (messageLength < line.length())
							{
								leftOver = line.substring(messageLength);
							}

							state = State.Header;
							headers.clear();

							JSDebugger.this.sendMessage(message);
						}
						else
						{
							if (leftOver == null)
							{
								leftOver = line;
							}
							else
							{
								leftOver += line;
							}
						}
						break;
					}
				}
			}
			catch (NoSuchElementException e)
			{
				e.printStackTrace();

				// TODO Stop the V8MessageHandler too!
				// try
				// {
				// 	responseHandlerCloseable.close();
				// }
				// catch (IOException e1)
				// {
				// 	e1.printStackTrace();
				// }
			}
			finally
			{
				this.stop = true;
				JSDebugger.this.sendMessage(DISCONNECT_MESSAGE);

				scanner.close();
			}
		}
	}

}

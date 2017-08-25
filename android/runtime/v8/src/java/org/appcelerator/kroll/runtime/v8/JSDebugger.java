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
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.LinkedBlockingQueue;

import android.net.LocalSocket;
import android.os.Handler;
import android.os.Looper;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;

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
	private static final String HANDSHAKE_MESSAGE = "Type: connect\r\nV8-Version: 5.7.492.71\r\nProtocol-Version: 1\r\nEmbedding-Host: Titanium v%s\r\nContent-Length: 0\r\n\r\n";

	// The port to listen to for debugger connections
	private final int port;

	// The sdk version we report in embedding host header for handshake message to debugger.
	private final String sdkVersion;

	// Holding place for messages received from V8 intended for debugger
	private LinkedBlockingQueue<String> v8Messages = new LinkedBlockingQueue<String>();

	// The thread which acts as the main agent for listening to debugger and V8 messages
	private DebugAgentThread agentThread;

	// The runnable used to tell V8 to process the debug messages on the main thread.
	private final Runnable processDebugMessagesRunnable = new Runnable() {
		@Override
		public void run() {
			nativeProcessDebugMessages();
		}
	};

	public JSDebugger(int port, String sdkVersion) {
		this.port = port;
		this.sdkVersion = sdkVersion;
	}

	/**
	 * This receives messages from V8's Debug API to be forwarded on to the attached debugger.
	 * @param message The actual JSON message received.
	 */
	public void handleMessage(String message)
	{
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

		// Send the command to V8 via C++
		nativeSendCommand(cmdBytes, cmdBytes.length);

		// Tell V8 to process the message (on the runtime thread)
		TiMessenger.postOnRuntime(processDebugMessagesRunnable);
	}

	public void start() {
		this.agentThread = new DebugAgentThread("titanium-debug");
		this.agentThread.start();

		// Tell C++ side to hook up the debug message handler
		nativeEnable();

		// Immediately break the debugger so we can set up our breakpoints and
		// options when we connect, before the app starts running.
		// This allows us to hit breakpoints as early as the first line in app.js
		nativeDebugBreak();
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
		private AtomicBoolean stop = new AtomicBoolean(false);

		// Dummy message used to stop the sentinel loop if it was waiting on v8Messages.take() while stop() got called.
		private static final String STOP_MESSAGE = "STOP_MESSAGE";

		public V8MessageHandler(Socket socket) throws IOException
		{
			this.output = socket.getOutputStream();
		}

		public void stop()
		{
			this.stop.set(true);
			// put dummy message into queue to unlock on take() below.
			JSDebugger.this.v8Messages.add(STOP_MESSAGE);
		}

		@Override
		public void run()
		{
			this.sendHandshake();
			while (!stop.get())
			{
				try
				{
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
				}
			}

			try
			{
				this.output.close();
			}
			catch (IOException e)
			{
				// ignore
			}
		}

		private void sendHandshake()
		{
			try
			{
				output.write(String.format(HANDSHAKE_MESSAGE, JSDebugger.this.sdkVersion).getBytes("UTF8"));
				output.flush();
			}
			catch (IOException e)
			{
				// FIXME Stop the DebuggerMessageHandler too!
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

	private class DebuggerMessageHandler implements Runnable
	{
		private BufferedReader input;
		private AtomicBoolean stop = new AtomicBoolean(false);

		public DebuggerMessageHandler(Socket socket) throws IOException
		{
			this.input = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		}

		public void stop()
		{
			this.stop.set(true);
			try
			{
				this.input.close();
			}
			catch (IOException e1)
			{
				// ignore
			}
		}

		public void run()
		{
			try
			{
				while (!stop.get()) {
					int length = readHeaders();
					if (length == -1) {
						break; // assume we hit EOF or got told to stop
					}
					//Log.w(TAG, "Message length: " + length);

					String message = readMessage(length);
					if (message == null) {
						// we return null if told to stop, or reading didn't give us the number of characters we expected
						break;
					}

					// send along the message to the debugger
					//Log.w(TAG, "Forwarding Message: " + message);
					JSDebugger.this.sendMessage(message);
				}
			}
			catch (IOException e)
			{
				//e.printStackTrace();

				// TODO Stop the V8MessageHandler too!
			}
			finally
			{
				this.stop.set(true);
				JSDebugger.this.sendMessage(DISCONNECT_MESSAGE);
				try
				{
					this.input.close();
				}
				catch (IOException e1)
				{
					// ignore
				}
			}
		}

		private int readHeaders() throws IOException
		{
			int messageLength = -1;
			String line;
			while (!stop.get() && ((line = this.input.readLine()) != null))
			{
				final int lineLength = line.length();
				// empty line means end of headers
				if (lineLength == 0)
				{
					return messageLength;
				}
				// if it's telling us the message length, record that
				if (line.startsWith("Content-Length:"))
				{
					String strLen = line.substring(15).trim();
					messageLength = Integer.parseInt(strLen);
				}
				// otherwise, ignore the other headers - BUT MAKE SURE TO CONSUME THEM!
			}
			return messageLength;
		}

		private String readMessage(int length) throws IOException
		{
			if (stop.get()) {
				return null;
			}
			char[] buf = new char[length];
			int result = this.input.read(buf, 0, length);
			if (result != length) {
				return null;
			}
			return new String(buf);
		}
	}
}

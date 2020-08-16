/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.LinkedBlockingQueue;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.UUID;

import org.java_websocket.WebSocket;
import org.java_websocket.framing.Framedata;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;

public final class JSDebugger
{
	private static final String TAG = "JSDebugger";

	// The port to listen to for debugger connections
	private final int port;

	// The sdk version we report in embedding host header for handshake message to debugger.
	private final String sdkVersion;

	// The lock used to wait for debugger to connect
	private final Object waitLock;

	// Are we ready to continue? Has the debugger been connected and we've processed the first set of messages?
	private AtomicBoolean ready = new AtomicBoolean(false);

	// Holding place for messages received from V8 intended for debugger
	private LinkedBlockingQueue<String> v8Messages = new LinkedBlockingQueue<String>();

	// The queue holding messages coming from debugger -> V8
	private LinkedBlockingQueue<String> inspectorMessages = new LinkedBlockingQueue<String>();
	// The initial queue of messages received after debugger connected to "initialize" (until we get
	// Runtime.runIfWaitingForDebugger)
	private LinkedBlockingQueue<String> initialMessages = new LinkedBlockingQueue<String>();

	// The thread which acts as the main agent for listening to debugger and V8 messages
	private InspectorAgent agentThread;

	// We had crashes due to empty debug context when we just sent messages through JNI off main thread.
	// So we must run on runtime/main thread when dispatching debugger/inspector messages
	private final Runnable processDebugMessagesRunnable = new Runnable() {
		@Override
		public void run()
		{
			String nextMessage = inspectorMessages.poll();
			while (nextMessage != null) {
				nativeSendCommand(nextMessage);
				nextMessage = inspectorMessages.poll();
			}
		}
	};

	public JSDebugger(int port, String sdkVersion)
	{
		this.port = port;
		this.sdkVersion = sdkVersion;
		this.waitLock = new Object();
	}

	/**
	 * This receives messages from V8's Debug API to be forwarded on to the attached debugger.
	 *
	 * @param message The actual JSON message received.
	 */
	public void handleMessage(String message)
	{
		v8Messages.offer(message);
	}

	public String waitForMessage()
	{
		try {
			return inspectorMessages.take(); // wait until we get a message!
		} catch (InterruptedException e) {
			Log.e(TAG, "Failed to retrieve next message from debugger", e);
		}

		return null;
	}

	public void start()
	{
		try {
			this.agentThread = new InspectorAgent(this.port);
			this.agentThread.start();
		} catch (Exception e) {
			Log.e(TAG, "Failed to start websocket server agent to handle debugger connection", e);
		}

		// Tell C++ side to hook up the debug message handler
		nativeEnable();

		// Now wait for the debugger to connect before we continue
		waitForDebugger();
	}

	// Sends the initial set of messages from debugger to V8.
	private void sendInitialMessages()
	{
		while (!initialMessages.isEmpty()) {
			String msg = initialMessages.poll();
			nativeSendCommand(msg);
		}
	}

	private void waitForDebugger()
	{
		synchronized (this.waitLock)
		{
			try {
				// FIXME Use this UUID to store sessions and enforce it's used when a client is connecting
				String id = UUID.randomUUID().toString();
				String url = "127.0.0.1:" + this.port + "/" + id;
				Log.w(TAG, "Debugger listening on ws://" + url);
				Log.w(
					TAG,
					"To connect Chrome DevTools, open Chrome to devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws="
						+ url);
				Log.w(TAG, "Waiting for debugger to connect for next 60 seconds...");
				this.waitLock.wait(60000); // wait up to 60 seconds for debugger
			} catch (InterruptedException e) {
				Log.w(TAG, "Debugger did not connect within 60 seconds");
			} finally {
				ready.getAndSet(true);
				sendInitialMessages();
				// We break at start of app.js in module.js' Module.prototype._runScript
			}
		}
	}

	// JNI method prototypes
	private native void nativeEnable();

	private native void nativeDisable(); // TODO Remove?

	private native void nativeDebugBreak();

	private native boolean nativeIsDebuggerActive(); // TODO Remove?

	private native void nativeSendCommand(String command);

	private class InspectorAgent extends WebSocketServer
	{
		private V8MessageHandler handler;

		public InspectorAgent(int port) throws UnknownHostException
		{
			super(new InetSocketAddress(port));
		}

		@Override
		public void onOpen(WebSocket conn, ClientHandshake handshake)
		{
			// Start up V8MessageHandler to process responses we get
			try {
				Log.w(TAG, "Debugger client connected");
				handler = new V8MessageHandler(conn);
				new Thread(handler).start();
			} catch (Exception e) {
			}
		}

		@Override
		public void onClose(WebSocket conn, int code, String reason, boolean remote)
		{
			// Kill the V8MessageHandler!
			if (handler != null) {
				handler.stop();
				handler = null;
				TiMessenger.postOnRuntime(new Runnable() {
					@Override
					public void run()
					{
						JSDebugger.this.nativeDisable();
					}
				});
			}
		}

		@Override
		public void onError(WebSocket conn, Exception ex)
		{
			Log.e(TAG, "Error with websocket server", ex);
		}

		@Override
		public void onStart()
		{
		}

		@Override
		public void onMessage(WebSocket conn, String message)
		{
			inspectorMessages.offer(message); // put message into queue

			// if we haven't initialied yet, sniff the incoming messages
			if (!JSDebugger.this.ready.get()) {
				// copy any waiting messages into our initial queue
				String nextMessage = inspectorMessages.poll();
				while (nextMessage != null) {
					initialMessages.offer(nextMessage);
					nextMessage = inspectorMessages.poll();
				}

				// Once we get the magic message saying we can continue, unlock the main thread
				if (message.contains("\"Runtime.runIfWaitingForDebugger\"")) {
					synchronized (JSDebugger.this.waitLock)
					{
						JSDebugger.this.waitLock.notify();
					}
				}
			} else {
				// schedule main thread to dispatch messages to v8
				TiMessenger.postOnRuntime(JSDebugger.this.processDebugMessagesRunnable);
			}
		}

		@Override
		public void onMessage(WebSocket conn, ByteBuffer blob)
		{
			// TODO How do we handle binary messages?
		}

		@Override
		public void onWebsocketMessageFragment(WebSocket conn, Framedata frame)
		{
		}
	}

	private class V8MessageHandler implements Runnable
	{
		private WebSocket conn;
		private AtomicBoolean stop = new AtomicBoolean(false);

		// Dummy message used to stop the sentinel loop if it was waiting on v8Messages.take() while stop() got called.
		private static final String STOP_MESSAGE = "STOP_MESSAGE";

		public V8MessageHandler(WebSocket conn) throws IOException
		{
			this.conn = conn;
		}

		public void stop()
		{
			this.stop.set(true);
			// put dummy message into queue to unlock on take() below.
			JSDebugger.this.v8Messages.offer(STOP_MESSAGE);
		}

		@Override
		public void run()
		{
			while (!stop.get()) {
				try {
					String message = JSDebugger.this.v8Messages.take(); // wait for next message
					if (message.equals(STOP_MESSAGE)) {
						break;
					}

					conn.send(message);
				} catch (Throwable t) {
					// ignore
				}
			}

			this.conn.close();
		}
	}
}

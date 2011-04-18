/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.network.socket;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.UnknownHostException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.proxy.BufferProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiStreamHelper;


@Kroll.proxy(creatableInModule=SocketModule.class)
public class TCPProxy extends KrollProxy implements TiStream
{
	@Kroll.constant public static final int SOCKET_INITIALIZED = 1;
	@Kroll.constant public static final int SOCKET_CONNECTED = 2;
	@Kroll.constant public static final int SOCKET_LISTENING = 3;
	@Kroll.constant public static final int SOCKET_CLOSED = 4;
	@Kroll.constant public static final int SOCKET_ERROR = 5;

	public int state = 0;


	private static final String LCAT = "TCPProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private boolean initialized = false;
	private Socket clientSocket;
	private ServerSocket serverSocket;
	private boolean accepting;
	private KrollDict acceptOptions;


	public TCPProxy(TiContext context)
	{
		super(context);
		state = SOCKET_INITIALIZED;
	}

	@Kroll.method
	public void connect() throws Exception
	{
		Object host = getProperty("host");
		Object port = getProperty("port");
		if((host != null) && (port != null)) {
			initialized = true;
			new ConnectedSocketThread().start();

		} else {
			throw new Exception("unable to call connect, socket must have a valid host and port");
		}
	}

	@Kroll.method
	public void listen() throws Exception
	{
		Object port = getProperty("port");
		Object listenQueueSize = getProperty("listenQueueSize");
		if((port != null) && (listenQueueSize != null)) {
			initialized = true;

			try {
				serverSocket = new ServerSocket(TiConvert.toInt(port), TiConvert.toInt(listenQueueSize));
				new ListeningSocketThread().start();
				state = SOCKET_LISTENING;

			} catch (IOException e) {
				e.printStackTrace();
				throw new Exception("Unable to listen, IO error");
			}

		} else {
			throw new Exception("unable to call listen, socket must have a valid port");
		}
	}

	@Kroll.method
	public void accept(KrollDict acceptOptions)
	{
		if(!initialized) {
			Log.e(LCAT, "Socket is not initialized, unable to call accept");
			return;
		}

		this.acceptOptions = acceptOptions;
		accepting = true;
	}

	@Kroll.method
	public void close()
	{
		if(!initialized) {
			Log.e(LCAT, "Socket is not initialized, unable to call close");
			return;
		}

		try {
			clientSocket.close();
			updateState(SOCKET_CLOSED, "closed", buildClosedCallbackArgs());

		} catch (IOException e) {
			e.printStackTrace();
			updateState(SOCKET_ERROR, "error", buildErrorCallbackArgs("Unable to close socket, IO error", 0));
		}
	}

	@Kroll.setProperty @Kroll.method
	public void setHost(String host)
	{
		setSocketProperty("host", host);
	}

	@Kroll.setProperty @Kroll.method
	public void setPort(int port)
	{
		setSocketProperty("port", port);
	}

	@Kroll.setProperty @Kroll.method
	public void setTimeout(int timeout)
	{
		setSocketProperty("timeout", timeout);
	}

	@Kroll.setProperty @Kroll.method
	public void setOptions()
	{
		// not implemented yet - reserved for future use
		Log.i(LCAT, "setting options on socket is not supported yet");
	}

	@Kroll.setProperty @Kroll.method
	public void setListenQueueSize(int listenQueueSize)
	{
		setSocketProperty("listenQueueSize", listenQueueSize);
	}

	@Kroll.setProperty @Kroll.method
	public void setConnected(KrollCallback connected)
	{
		setSocketProperty("connected", connected);
	}

	@Kroll.setProperty @Kroll.method
	public void setError(KrollCallback error)
	{
		setSocketProperty("error", error);
	}

	@Kroll.setProperty @Kroll.method
	public void setClosed(KrollCallback closed)
	{
		setSocketProperty("closed", closed);
	}

	@Kroll.setProperty @Kroll.method
	public void setAccepted(KrollCallback accepted)
	{
		setSocketProperty("accepted", accepted);
	}

	private void setSocketProperty(String propertyName, Object propertyValue)
	{
		if(!initialized) {
			setProperty(propertyName, propertyValue);

		} else {
			Log.e(LCAT, "Socket is already initialized, unable to set property <" + propertyName + ">");
		}
	}

	private class ConnectedSocketThread extends Thread
	{
		public ConnectedSocketThread()
		{
			super("ConnectedSocketThread");
		}

		public void run()
		{
			String host = TiConvert.toString(getProperty("host"));

			try {
				clientSocket = new Socket(host, TiConvert.toInt(getProperty("port")));
				updateState(SOCKET_CONNECTED, "connected", buildConnectedCallbackArgs());

			} catch (UnknownHostException e) {
				e.printStackTrace();
				updateState(SOCKET_ERROR, "error", buildErrorCallbackArgs("Unable to connect, unknown host <" + host + ">", 0));

			} catch (IOException e) {
				e.printStackTrace();
				updateState(SOCKET_ERROR, "error", buildErrorCallbackArgs("Unable to connect to , IO error", 0));
			}
		}
	}

	private class ListeningSocketThread extends Thread
	{
		public ListeningSocketThread()
		{
			super("ListeningSocketThread");
		}

		public void run()
		{
			while(true) {
				if(accepting) {
					try {
						Socket acceptedSocket = serverSocket.accept();

						TCPProxy acceptedTcpProxy = new TCPProxy(context);
						acceptedTcpProxy.clientSocket = acceptedSocket;

						Object optionValue;
						if((optionValue = acceptOptions.get("timeout")) != null) {
							acceptedTcpProxy.setProperty("timeout", TiConvert.toInt(optionValue));
						}
						if((optionValue = acceptOptions.get("error")) != null) {
							if(optionValue instanceof KrollCallback) {
								acceptedTcpProxy.setProperty("error", (KrollCallback) optionValue);
							}
						}
						if((optionValue = acceptOptions.get("closed")) != null) {
							if(optionValue instanceof KrollCallback) {
								acceptedTcpProxy.setProperty("closed", (KrollCallback) optionValue);
							}
						}

						updateState(SOCKET_CONNECTED, "accepted", buildAcceptedCallbackArgs(acceptedTcpProxy));
						accepting = false;

					} catch (IOException e) {
						e.printStackTrace();
						updateState(SOCKET_ERROR, "error", buildErrorCallbackArgs("Unable to accept new connection, IO error", 0));
					}

				} else {
					try {
						sleep(500);

					} catch (InterruptedException e) {
						e.printStackTrace();
						Log.e(LCAT, "listening thread interrupted");
					}
				}
			}
		}
	}

	private KrollDict buildConnectedCallbackArgs()
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("socket", this);

		return callbackArgs;
	}

	private KrollDict buildErrorCallbackArgs(String error, int errorCode)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("socket", this);
		callbackArgs.put("error", error);
		callbackArgs.put("errorCode", errorCode);

		return callbackArgs;
	}

	private KrollDict buildClosedCallbackArgs()
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("socket", this);

		return callbackArgs;
	}

	private KrollDict buildAcceptedCallbackArgs(TCPProxy acceptedTcpProxy)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("socket", this);
		callbackArgs.put("inbound", acceptedTcpProxy);

		return callbackArgs;
	}

	public void updateState(int state, String callbackName, KrollDict callbackArgs)
	{
		this.state = state;

		Object callback = getProperty(callbackName);
		if(callback instanceof KrollCallback) {
			((KrollCallback) callback).callAsync(callbackArgs);
		}
	}

	@Kroll.method
	public boolean isConnected()
	{
		if(state == SOCKET_CONNECTED)
		{
			return true;
		}
		return false;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(BufferProxy bufferProxy) throws IOException
	{
		try{
			return TiStreamHelper.read(clientSocket.getInputStream(), bufferProxy);

		} catch (IOException e) {
			e.printStackTrace();
			clientSocket.close();
			throw new IOException("Unable to read from socket, IO error");
		}
	}

	@Kroll.method
	public int read(BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		try {
			return TiStreamHelper.read(clientSocket.getInputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			clientSocket.close();
			throw new IOException("Unable to read from socket, IO error");
		}
	}

	@Kroll.method
	public int write(BufferProxy bufferProxy) throws IOException
	{
		try {
			return TiStreamHelper.write(clientSocket.getOutputStream(), bufferProxy);

		} catch (IOException e) {
			e.printStackTrace();
			clientSocket.close();
			throw new IOException("Unable to write to socket, IO error");
		}
	}

	@Kroll.method
	public int write(BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		try {
			return TiStreamHelper.write(clientSocket.getOutputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			clientSocket.close();
			throw new IOException("Unable to write to socket, IO error");
		}
	}

	@Kroll.method
	public boolean isWriteable()
	{
		return isConnected();
	}

	@Kroll.method
	public boolean isReadable()
	{
		return isConnected();
	}
}


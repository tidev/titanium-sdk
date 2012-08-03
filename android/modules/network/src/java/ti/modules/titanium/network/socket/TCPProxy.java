/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network.socket;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.UnknownHostException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiStreamHelper;

import ti.modules.titanium.BufferProxy;

@Kroll.proxy(creatableInModule=SocketModule.class)
public class TCPProxy extends KrollProxy implements TiStream
{
	private static final String TAG = "TCPProxy";

	//private boolean initialized = false;
	private Socket clientSocket = null;
	private ServerSocket serverSocket = null;
	private boolean accepting = false;
	private KrollDict acceptOptions = null;
	private int state = 0;
	private InputStream inputStream = null;


	public TCPProxy()
	{
		super();
		state = SocketModule.INITIALIZED;
	}

	public TCPProxy(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public void connect() throws Exception
	{
		if ((state != SocketModule.LISTENING) && (state != SocketModule.CONNECTED)) {
			Object host = getProperty("host");
			Object port = getProperty("port");
			if((host != null) && (port != null) && (TiConvert.toInt(port) > 0)) {
				new ConnectedSocketThread().start();

			} else {
				throw new IllegalArgumentException("Unable to call connect, socket must have a valid host and port");
			}

		} else {
			throw new Exception("Unable to call connect on socket in <" + state + "> state");
		}
	}

	@Kroll.method
	public void listen() throws Exception
	{
		if ((state != SocketModule.LISTENING) && (state != SocketModule.CONNECTED)) {
			Object port = getProperty("port");
			Object listenQueueSize = getProperty("listenQueueSize");

			try {
				if ((port != null) && (listenQueueSize != null)) {
					serverSocket = new ServerSocket(TiConvert.toInt(port), TiConvert.toInt(listenQueueSize));

				} else if (port != null) {
					serverSocket = new ServerSocket(TiConvert.toInt(port));

				} else {
					serverSocket = new ServerSocket();
				}

				new ListeningSocketThread().start();
				state = SocketModule.LISTENING;

			} catch (IOException e) {
				e.printStackTrace();
				state = SocketModule.ERROR;
				throw new Exception("Unable to listen, IO error");
			}

		} else {
			throw new Exception("Unable to call listen on socket in <" + state + "> state");
		}
	}

	@Kroll.method
	public void accept(KrollDict acceptOptions) throws Exception
	{
		if (state != SocketModule.LISTENING) {
			throw new Exception("Socket is not listening, unable to call accept");
		}

		this.acceptOptions = acceptOptions;
		accepting = true;
	}

	private void closeSocket() throws IOException {
		if (clientSocket != null) {
			clientSocket.close();
			clientSocket = null;
		}

		if (serverSocket != null) {
			serverSocket.close();
			serverSocket = null;
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
	public void setOptions(KrollDict options)
	{
		// not implemented yet - reserved for future use
		Log.i(TAG, "setting options on socket is not supported yet");
	}

	@Kroll.setProperty @Kroll.method
	public void setListenQueueSize(int listenQueueSize)
	{
		setSocketProperty("listenQueueSize", listenQueueSize);
	}

	@Kroll.setProperty @Kroll.method
	public void setConnected(KrollFunction connected)
	{
		setSocketProperty("connected", connected);
	}

	@Kroll.setProperty @Kroll.method
	public void setError(KrollFunction error)
	{
		setSocketProperty("error", error);
	}

	@Kroll.setProperty @Kroll.method
	public void setAccepted(KrollFunction accepted)
	{
		setSocketProperty("accepted", accepted);
	}

	private void setSocketProperty(String propertyName, Object propertyValue)
	{
		if ((state != SocketModule.LISTENING) && (state != SocketModule.CONNECTED)) {
			setProperty(propertyName, propertyValue);

		} else {
			Log.e(TAG, "Unable to set property <" + propertyName + "> on socket in <" + state + "> state");
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getState()
	{
		return state;
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
			Object timeoutProperty = getProperty("timeout");

			try {
				if (timeoutProperty != null) {
					int timeout = TiConvert.toInt(timeoutProperty, 0);

					clientSocket = new Socket();
					clientSocket.connect(new InetSocketAddress(host, TiConvert.toInt(getProperty("port"))), timeout);

				} else {
					clientSocket = new Socket(host, TiConvert.toInt(getProperty("port")));
				}
				updateState(SocketModule.CONNECTED, "connected", buildConnectedCallbackArgs());

			} catch (UnknownHostException e) {
				e.printStackTrace();
				updateState(SocketModule.ERROR, "error", buildErrorCallbackArgs("Unable to connect, unknown host <" + host + ">", 0));

			} catch (IOException e) {
				e.printStackTrace();
				updateState(SocketModule.ERROR, "error", buildErrorCallbackArgs("Unable to connect, IO error", 0));
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

						TCPProxy acceptedTcpProxy = new TCPProxy();
						acceptedTcpProxy.clientSocket = acceptedSocket;
						acceptedTcpProxy.setProperty("host", acceptedTcpProxy.clientSocket.getInetAddress().getHostAddress());
						acceptedTcpProxy.setProperty("port", acceptedTcpProxy.clientSocket.getPort());

						Object optionValue;
						if((optionValue = acceptOptions.get("timeout")) != null) {
							acceptedTcpProxy.setProperty("timeout", TiConvert.toInt(optionValue, 0));
						}
						if((optionValue = acceptOptions.get("error")) != null) {
							if(optionValue instanceof KrollFunction) {
								acceptedTcpProxy.setProperty("error", (KrollFunction) optionValue);
							}
						}

						acceptedTcpProxy.state = SocketModule.CONNECTED;

						Object callback = getProperty("accepted");
						if (callback instanceof KrollFunction) {
							((KrollFunction) callback).callAsync(getKrollObject(), buildAcceptedCallbackArgs(acceptedTcpProxy));
						}

						accepting = false;

					} catch (IOException e) {
						if (state == SocketModule.LISTENING) {
							e.printStackTrace();
							updateState(SocketModule.ERROR, "error", buildErrorCallbackArgs("Unable to accept new connection, IO error", 0));
						}

						break;
					}

				} else {
					try {
						sleep(500);

					} catch (InterruptedException e) {
						e.printStackTrace();
						Log.e(TAG, "Listening thread interrupted");
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

		if (state == SocketModule.ERROR) {
			try {
				if (clientSocket != null) {
					clientSocket.close();
				}

				if (serverSocket != null) {
					serverSocket.close();
				}

			} catch (IOException e) {
				Log.w(TAG, "Unable to close socket in error state", Log.DEBUG_MODE);
			}
		}

		Object callback = getProperty(callbackName);
		if (callback instanceof KrollFunction) {
			((KrollFunction) callback).callAsync(getKrollObject(), callbackArgs);
		}
	}

	@Kroll.method
	public boolean isConnected()
	{
		if (state == SocketModule.CONNECTED) {
			return true;
		}
		return false;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(Object args[]) throws IOException
	{
		if (!isConnected()) {
			throw new IOException("Unable to read from socket, not connected");
		}

		BufferProxy bufferProxy = null;
		int offset = 0;
		int length = 0;

		if(args.length == 1 || args.length == 3) {
			if(args.length > 0) {
				if(args[0] instanceof BufferProxy) {
					bufferProxy = (BufferProxy) args[0];
					length = bufferProxy.getLength();

				} else {
					throw new IllegalArgumentException("Invalid buffer argument");
				}
			}

			if(args.length == 3) {
				if(args[1] instanceof Integer) {
					offset = ((Integer)args[1]).intValue();

				} else if(args[1] instanceof Double) {
					offset = ((Double)args[1]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid offset argument");
				}

				if(args[2] instanceof Integer) {
					length = ((Integer)args[2]).intValue();

				} else if(args[2] instanceof Double) {
					length = ((Double)args[2]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid length argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (inputStream == null) {
			inputStream = clientSocket.getInputStream();
		}

		try {
			return TiStreamHelper.read(inputStream, bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			closeSocket();
			updateState(SocketModule.ERROR, "error", buildErrorCallbackArgs("Unable to read from socket, IO error", 0));
			throw new IOException("Unable to read from socket, IO error");
		}
	}

	@Kroll.method
	public int write(Object args[]) throws IOException
	{
		if(!isConnected())
		{
			throw new IOException("Unable to write to socket, not connected");
		}

		BufferProxy bufferProxy = null;
		int offset = 0;
		int length = 0;

		if(args.length == 1 || args.length == 3) {
			if(args.length > 0) {
				if(args[0] instanceof BufferProxy) {
					bufferProxy = (BufferProxy) args[0];
					length = bufferProxy.getLength();

				} else {
					throw new IllegalArgumentException("Invalid buffer argument");
				}
			}

			if(args.length == 3) {
				if(args[1] instanceof Integer) {
					offset = ((Integer)args[1]).intValue();

				} else if(args[1] instanceof Double) {
					offset = ((Double)args[1]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid offset argument");
				}

				if(args[2] instanceof Integer) {
					length = ((Integer)args[2]).intValue();

				} else if(args[2] instanceof Double) {
					length = ((Double)args[2]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid length argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		try {
			return TiStreamHelper.write(clientSocket.getOutputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			closeSocket();
			updateState(SocketModule.ERROR, "error", buildErrorCallbackArgs("Unable to write to socket, IO error", 0));
			throw new IOException("Unable to write to socket, IO error");
		}
	}

	@Kroll.method
	public boolean isWritable()
	{
		return isConnected();
	}

	@Kroll.method
	public boolean isReadable()
	{
		return isConnected();
	}

	@Kroll.method
	public void close() throws IOException
	{
		if((state != SocketModule.CONNECTED) && (state != SocketModule.LISTENING)) {
			throw new IOException("Socket is not connected or listening, unable to call close on socket in <" + state + "> state");
		}

		try {
			state = 0; // set socket state to uninitialized to prevent use while closing
			closeSocket();
			state = SocketModule.CLOSED;

		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Error occured when closing socket");
		}
	}
}


package ti.modules.titanium.network;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.net.UnknownHostException;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLPeerUnverifiedException;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocket;

import org.apache.http.conn.ConnectTimeoutException;
import org.apache.http.conn.scheme.LayeredSocketFactory;
import org.apache.http.conn.ssl.StrictHostnameVerifier;
import org.apache.http.params.HttpParams;
import org.appcelerator.kroll.common.Log;

import android.net.SSLCertificateSocketFactory;
import android.os.Build;

public class TLSSNISocketFactory implements LayeredSocketFactory
{

	private static final HostnameVerifier hostnameVerifier = new StrictHostnameVerifier();
	private static final String TAG = "TLSSNISocketFactory";


	public Socket createSocket() throws IOException {
		return null;
	}


	@Override
	public boolean isSecure(Socket socket) throws IllegalArgumentException {
		if (socket instanceof SSLSocket) {
			return ((SSLSocket)socket).isConnected();
		}
		return false;
	}

	@Override
	public Socket createSocket(Socket plainSocket, String host, int port, boolean autoClose) throws IOException, UnknownHostException {
		if (autoClose) {
			// we don't need the plainSocket
			plainSocket.close();
		}

		// create and connect SSL socket
		SSLCertificateSocketFactory sslSocketFactory = (SSLCertificateSocketFactory) SSLCertificateSocketFactory.getDefault(0);
		SSLSocket sslSocket = (SSLSocket)sslSocketFactory.createSocket(InetAddress.getByName(host), port);

		// enable TLS if available
		sslSocket.setEnabledProtocols(sslSocket.getSupportedProtocols());

		// set up SNI before the handshake
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
			sslSocketFactory.setHostname(sslSocket, host);
		} else {
			Log.d(TAG, "No documented support for SNI on older APIs (<17), trying with reflection", Log.DEBUG_MODE);
			try {
				java.lang.reflect.Method setHostnameMethod = sslSocket.getClass().getMethod("setHostname", String.class);
				setHostnameMethod.invoke(sslSocket, host);
			} catch (Exception e) {
				Log.w(TAG, "SNI not useable", e);
			}
		}

		// verify hostname and certificate
		SSLSession session = sslSocket.getSession();
		if (!hostnameVerifier.verify(host, session)) {
			throw new SSLPeerUnverifiedException("Cannot verify hostname: " + host);
		}

		return sslSocket;
	}

	@Override
	public Socket connectSocket(Socket arg0, String arg1, int arg2, InetAddress arg3, int arg4, HttpParams arg5)
			throws IOException, UnknownHostException, ConnectTimeoutException
	{
		return null;
	}
}

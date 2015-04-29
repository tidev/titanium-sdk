package ti.modules.titanium.network;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableKeyException;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLPeerUnverifiedException;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocket;

import org.apache.http.conn.ssl.StrictHostnameVerifier;
import org.appcelerator.kroll.common.Log;

import android.net.SSLCertificateSocketFactory;
import android.os.Build;

public class TLSSNISocketFactory extends TiSocketFactory
{

	private static final HostnameVerifier hostnameVerifier = new StrictHostnameVerifier();
	private static final String TAG = "TLSSNISocketFactory";

	public TLSSNISocketFactory(int protocol) throws NoSuchAlgorithmException, KeyManagementException, KeyStoreException, UnrecoverableKeyException
	{
		super(null, null, protocol);
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
		setSupportedAndEnabledProtocolsInSocket(enabledProtocols, sslSocket);

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
}

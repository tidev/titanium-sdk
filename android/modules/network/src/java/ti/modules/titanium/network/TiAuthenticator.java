package ti.modules.titanium.network;

import java.net.Authenticator;
import java.net.PasswordAuthentication;

public class TiAuthenticator extends Authenticator {
    String domain;
    String user;
    String password;

    // MAX_RETRY_COUNT is set to 3 retries
    private final static int MAX_RETRY_COUNT = 3;
    private int retryCount = 0;

    public TiAuthenticator(String user, String password) {
        super();
        this.domain = null;
        this.user = user;
        this.password = password;
    }

    public TiAuthenticator(String domain, String user, String password) {
        super();
        this.domain = domain;
        this.user = user;
        this.password = password;
    }

    @Override
    public PasswordAuthentication getPasswordAuthentication() {
        if (domain != null && !domain.isEmpty()) {
            user = domain + "\\" + user;
        }
        // This is for TIMOB-20415 with the solution from Android's Issue Tracker,
        // https://code.google.com/p/android/issues/detail?id=7058
        // The Authenticator will do a retry when when it gets a response from the
        // server that the credentials provided is incorrect. When this happens,
        // getPasswordAuthentication() is called again for as long it is incorrect.
        // In order to stop the loop, the Authenticator needs to return a null
        // object to indicate that the retry needs to stop. Hence, we have a MAX_RETRY_COUNT.
        if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            if (password != null) {
                return new PasswordAuthentication(user, password.toCharArray());
            }
            return new PasswordAuthentication(user, null);
        }
        return null;
    }
}

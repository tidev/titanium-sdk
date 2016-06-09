package ti.modules.titanium.network;

import java.net.Authenticator;
import java.net.PasswordAuthentication;

public class TiAuthenticator extends Authenticator {
    String domain;
    String user;
    String password;
    private int retryCount = 0;
    private final static int MAX_RETRY_COUNT = 1;

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

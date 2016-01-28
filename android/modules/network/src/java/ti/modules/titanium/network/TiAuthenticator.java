package ti.modules.titanium.network;

import java.net.Authenticator;
import java.net.PasswordAuthentication;

public class TiAuthenticator extends Authenticator {
    String domain;
    String user;
    String password;

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
        if (password != null) {
            return new PasswordAuthentication(user, password.toCharArray());
        }
        return new PasswordAuthentication(user, null);
    }
}

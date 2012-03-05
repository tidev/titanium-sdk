import org.imgscalr.Scalr;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;

public class resize {

	private static void help() {
		System.out.println("Titanium Image Resizer\n\nUsage:\n  java -cp .:imgscalr-lib-4.2.jar -Djava.awt.headless=true resize <source> <dest> <width> [<height>]");
		System.exit(1);
	}
	
	private static void error(String message) {
		System.out.println("[ERROR] " + message);
		System.exit(1);
	}
	
	public static void main(String[] args) {
		if (args.length < 4)
			help();
		
		if (!(new File(args[0])).exists())
			error("Source image \"" + args[0] + "\" does not exist");
		
		Boolean quiet = System.getProperty("quiet", "not set").equals("true");
		
		try {
			BufferedImage source = ImageIO.read(new File(args[0]));
			
			for (int i = 1; i < args.length; i += 3) {
				String dest = args[i];
				File destFile = new File(dest);
				int p = dest.lastIndexOf('.');
				if (p == -1) {
					error("Invalid destination image \"" + dest + "\", image must have an extension");
				}
				
				if (destFile.exists()) {
					System.out.println("[INFO] Destination image \"" + dest + "\" already exists, skipping");
					continue;
				}
				
				String ext = dest.substring(p + 1, dest.length());
				
				int width = 16;
				try {
					width = Integer.parseInt(args[i + 1]);
				} catch (NumberFormatException nfe) {
					error("Invalid image width \"" + args[i + 1] + "\"");
				}
				
				int height = 16;
				try {
					height = Integer.parseInt(args[i + 2]);
				} catch (NumberFormatException nfe) {
					error("Invalid image height \"" + args[i + 2] + "\"");
				}
				
				try {
					if (!quiet) {
						System.out.println("[INFO] Creating " + dest);
					}
					ImageIO.write(Scalr.resize(source, Scalr.Method.ULTRA_QUALITY, Scalr.Mode.FIT_EXACT, width, height), ext, destFile);
				} catch (IOException ioe) {
					error("Unable to writing destination image \"" + dest + "\"");
				}
			}
		} catch (IOException ioe) {
			error("Unable to read source image \"" + args[0] + "\"");
		}
	}

}

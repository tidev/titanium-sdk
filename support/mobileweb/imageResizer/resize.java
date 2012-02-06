import org.imgscalr.Scalr;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;

public class resize {

	private static void help() {
		System.out.println("Titanium Image Resizer\n\nUsage:\n  java -jar resize.jar <source> <dest> <width> [<height>]");
		System.exit(1);
	}
	
	private static void error(String message) {
		System.out.println("Titanium Image Resizer\n\nError: " + message + "\n\nUsage:\n  java -jar resize.jar <source> <dest> <width> [<height>]");
		System.exit(1);
	}
	
	public static void main(String[] args) {
		if (args.length < 4)
			help();
		
		if (!(new File(args[0])).exists())
			error("Source image \"" + args[0] + "\" does not exist");
		
		try {
			BufferedImage source = ImageIO.read(new File(args[0]));
			
			for (int i = 1; i < args.length; i += 3) {
				String dest = args[i];
				int p = args[i].lastIndexOf('.');
				if (p == -1) {
					error("Invalid destination image \"" + args[i] + "\", image must have an extension");
				}
				String ext = args[i].substring(p + 1, args[i].length());
				
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
					ImageIO.write(Scalr.resize(source, Scalr.Method.ULTRA_QUALITY, Scalr.Mode.FIT_EXACT, width, height), ext, new File(dest));
				} catch (IOException ioe) {
					error("Unable to writing destination image \"" + dest + "\"");
				}
			}
		} catch (IOException ioe) {
			error("Unable to read source image \"" + args[0] + "\"");
		}
	}

}

import com.google.javascript.jscomp.CompilationLevel;
import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.JSSourceFile;
import com.google.javascript.jscomp.Result;
import java.io.*;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

public class minify {

	private static CompilerOptions options;

	private static void help() {
		System.out.println("Titanium Image Resizer\n\nUsage:\n  java -cp .:../closureCompiler/compiler.jar -Djava.awt.headless=true minify <directory>");
		System.exit(1);
	}
	
	private static void error(String message) {
		System.out.println("Titanium Image Resizer\n\nError: " + message + "\n\nUsage:\n  java -cp .:../closureCompiler/compiler.jar -Djava.awt.headless=true minify <directory>");
		System.exit(1);
	}
	
	public static void main(String[] args) {
		if (args.length < 1)
			help();
		
		File dir = new File(args[0]);
		
		if (!dir.exists())
			error("Directory \"" + args[0] + "\" does not exist");
		
		if (!dir.isDirectory())
			error("\"" + args[0] + "\" is not a directory");
		
		options = new CompilerOptions();
		CompilationLevel.SIMPLE_OPTIMIZATIONS.setOptionsForCompilationLevel(options);
		
		walk(dir);
	}
	
	private static void copy(File source, File dest) {
		try {
			InputStream in = new FileInputStream(source);
			OutputStream out = new FileOutputStream(dest);
			byte[] buf = new byte[4096];
			int len;
			while ((len = in.read(buf)) > 0){
				out.write(buf, 0, len);
			}
			in.close();
			out.close();
		} catch (FileNotFoundException fnfe) {
			System.out.println("[WARN] Source file not found! " + source.getName());
		} catch (IOException ioe) {
			System.out.println("[WARN] Unable to copy un-minified file " + source.getName());
		}
	}
	
	private static void walk(File dir) {
		File files[] = dir.listFiles();
		if (files != null) {
			Arrays.sort(files);
			for (int i = 0; i < files.length; i++) {
				String dest = files[i].getAbsolutePath();
				if (files[i].isDirectory()
					&& !files[i].getName().equals(".git")
					&& !files[i].getName().equals(".svn")
					&& !files[i].getName().equals("_svn")
					&& !files[i].getName().equals("CSV")
				) {
					walk(files[i]);
				} else if (!files[i].getName().startsWith("._") && files[i].getName().endsWith(".js")) {
					String source = dest + ".uncompressed.js";
					
					System.out.println("[INFO] Minifying " + dest);
					
					File destFile = files[i];
					File sourceFile = new File(source);
					
					if (sourceFile.exists())
						sourceFile.delete();
					
					destFile.renameTo(sourceFile);
					
					List<JSSourceFile> externs = new ArrayList<JSSourceFile>();
					List<JSSourceFile> inputs = new ArrayList<JSSourceFile>();
					
					inputs.add(JSSourceFile.fromFile(sourceFile));
					
					Compiler compiler = new Compiler();
					Result r = compiler.compile(externs, inputs, options);
					
					if (r.success) {
						try {
							FileWriter outputFile = new FileWriter(destFile);
							outputFile.write(compiler.toSource());
							outputFile.close();
						} catch (Exception ex) {
							System.out.println("[WARN] Unable to write minified file");
							System.out.println("[WARN] Leaving " + dest + " un-minified");
						}
					} else {
						for (int j = 0; j < r.warnings.length; j++) {
							System.out.println("[WARN] " + r.warnings[j].toString());
						}
						for (int j = 0; j < r.errors.length; j++) {
							System.out.println("[WARN] " + r.errors[j].toString());
						}
						System.out.println("[WARN] Leaving " + dest + " un-minified");
						copy(sourceFile, destFile);
					}
				}
			}
		}
	}

}

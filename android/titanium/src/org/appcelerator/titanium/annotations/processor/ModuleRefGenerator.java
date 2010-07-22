package org.appcelerator.titanium.annotations.processor;

import java.io.IOException;
import java.io.Writer;
import java.lang.annotation.Annotation;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.Messager;
import javax.annotation.processing.ProcessingEnvironment;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedOptions;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.AnnotationMirror;
import javax.lang.model.element.AnnotationValue;
import javax.lang.model.element.Element;
import javax.lang.model.element.ElementKind;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.TypeElement;
import javax.tools.Diagnostic;
import javax.tools.JavaFileObject;

import org.appcelerator.titanium.annotations.manifest.Ti;
import org.appcelerator.titanium.annotations.manifest.Ti.version;


/**
 * Processes the source and generates a module definition for the package.
 * This is expected to be run as a pre-processor to the actual compile of the module
 * Users can extend from the class that's generated to add their own attributes if needed
 *
 */
@SupportedAnnotationTypes({"org.appcelerator.titanium.annotations.manifest.Ti.module"})
@SupportedSourceVersion(SourceVersion.RELEASE_6)
@SupportedOptions({"projectName","destinationFolder"})
public class ModuleRefGenerator extends AbstractProcessor {

	/**
	 * Debugging enabled flag
	 */
	private boolean dbg = false;

	/**
	 * Placeholder for gathered annotations
	 */
	private HashMap<ExecutableElement, AnnotationValue> projectAttributes;
	/**
	 * The package name is derrived from the class that contains the annotation
	 */
	private String packageName;
	
	@Override
	public boolean process(final Set<? extends TypeElement> annotations, RoundEnvironment env) {
				
		if (!env.processingOver()) {
			
			projectAttributes = new HashMap<ExecutableElement, AnnotationValue>();
			Set<? extends Element> elements = env.getRootElements();
			
			if (dbg) {
				this.processingEnv.getMessager().printMessage(Diagnostic.Kind.NOTE, "Passed Annotations: "+annotations);
				this.processingEnv.getMessager().printMessage(Diagnostic.Kind.NOTE, "Passed Elements: "+elements);				
			}

			for (Element element : elements) {
				handleRootElementAnnotationMirrors(element);
			}			
		} else {
			if (projectAttributes.isEmpty()) {
				// Nothing to process
			} else {
				generateModuleDefClass();			
			}
			debugLog("Processing Complete");
		}
		return true;
	}
	
	@Override
	public synchronized void init(ProcessingEnvironment pe) {
		super.init(pe);
		Map<String, String> options = this.processingEnv.getOptions();
		if (options.containsKey("debug")) {
			this.dbg = Boolean.parseBoolean(options.get("debug").toString());
		}
	}

	/**
	 * Process the passed source files and extract the appropriate annotations for generating the moduleDef
	 * 
	 * @param aElement {@link Element}
	 */
	private void handleRootElementAnnotationMirrors(Element aElement) {
		
		if (dbg) {
			debugLog("Entered handleElementAnnotationMirrors("+ aElement.getSimpleName() + ") "+aElement.getKind().toString()+"...\n");
		}

		List<? extends AnnotationMirror> annotationMirrors = aElement.getAnnotationMirrors();
		
		for (AnnotationMirror mirror : annotationMirrors) {
			final String annotationType = mirror.getAnnotationType().toString();
			
			// We're only interested in one specific annotation
			if (annotationType.equals("org.appcelerator.titanium.annotations.manifest.Ti.module")) {
				
				if (dbg) {
					debugLog("Annotation: "+annotationType);
				}
				Map<? extends ExecutableElement, ? extends AnnotationValue> mirrorMap = this.processingEnv.getElementUtils().getElementValuesWithDefaults(mirror);

				if (dbg) {
					String entityName = aElement.getSimpleName().toString();
					debugLog("[Mirror:"+mirror.toString()+"][Element: "+entityName+"] has a map with size of "+mirrorMap.size());
					// Use the full messenger as none of the helpers handle Elements or AnnotationMirrors
					this.processingEnv.getMessager().printMessage(Diagnostic.Kind.NOTE, "\nEntity: "+entityName, aElement, mirror);
				}
				
				// Iterate through the annotations now - adding, when needed, to the projectAttributes
				for (Map.Entry<? extends ExecutableElement, ?extends AnnotationValue> mirrorEntry : mirrorMap.entrySet()) {
					projectAttributes.put(mirrorEntry.getKey(), mirrorEntry.getValue());
					
					packageName = this.processingEnv.getElementUtils().getPackageOf(aElement).toString();
										
					if (dbg) {
						String mirrorKey = mirrorEntry.getKey().toString();
						mirrorEntry.getValue().toString();

						debugLog("KeyType: "+mirrorEntry.getKey().asType().getClass().toString());
						debugLog("Iterating Key: "+mirrorKey+" Value: "+mirrorEntry.getValue().toString()+"");
					}					
				}
			} else {
				if (dbg) {
					debugLog("Not processing ["+annotationType+"]");				
				}
			}
		}
	}
	
	/**
	 * Run through the found annotations and generate the moduleDef class
	 */
	private void generateModuleDefClass() {
		
		// First work with any overrides that may have been passed
		Map<String, String> options = this.processingEnv.getOptions();
		String sourceName = "src.";
		String projectName = "";
		String moduleNameSuffix = "ModuleDef";
		
		if (options.containsKey("projectName")) {
			debugLog("Project Name is: "+options.get("projectName"));
			projectName = options.get("projectName");
		} else {
			throw new IllegalArgumentException("The project name is a required parameter to be passed from your build.xml or using -AprojectName=<projectName> as a parameter to javac");
		}
		
		if (options.containsKey("packageName")) {
			// Currently not implemented
			//sourceName += options.get("packageName");
		}
		
		sourceName += String.format("%s.%s%s",packageName,projectName,moduleNameSuffix);
		
		JavaFileObject jfo;
		Writer writer = null;
		try {
			jfo = this.processingEnv.getFiler().createSourceFile(sourceName);
			writer = jfo.openWriter();
			writer.write(String.format("/* Generated on %s */\n",new Date()));
			writer.write("/* by Titanium Appcelerator */\n");
			writer.write(String.format("\npackage %s;\n",packageName));
			writer.write(String.format("\nimport org.appcelerator.titanium.TiModuleInfo;\n\n"));
			writer.write(String.format("public class %s%s extends TiModuleInfo\n",projectName,moduleNameSuffix));
			writer.write("{\n\n");
			
			// By default - we can just iterate through the projectAttributes
			for (Map.Entry<? extends ExecutableElement, ?extends AnnotationValue> mirrorEntry : projectAttributes.entrySet()) {
				
				if (mirrorEntry.getValue().equals(mirrorEntry.getKey().getDefaultValue())) {
					if (dbg) {
						debugLog("Skipping ["+mirrorEntry.getKey()+"] as it matches the default");					
					}
				} else {
					Element returnType = this.processingEnv.getTypeUtils().asElement(mirrorEntry.getKey().getReturnType());
					Element versionType = this.processingEnv.getElementUtils().getTypeElement(Ti.version.class.getCanonicalName());
					if (returnType.getKind().isInterface()) {
						if (returnType.getKind().compareTo(ElementKind.ANNOTATION_TYPE)==0) {
							if (dbg) {
								debugLog(mirrorEntry.getKey().getSimpleName() + " is an annotation.");
							}
							
							if (returnType.toString().equals(versionType.toString())) {
								generateVersionMethod(writer, mirrorEntry.getKey(), mirrorEntry.getValue());								
							} else {
								if (dbg) {
									debugLog("Version NOT Matched!["+returnType.toString()+"]["+versionType.toString()+"]");
								}
							}
						} else {
							if (dbg) {
								debugLog(mirrorEntry.getKey().getSimpleName() + " is NOT an annotation.");
							}
						}
					} else {
						if (dbg) {
							debugLog(mirrorEntry.getKey().getSimpleName() + " is not an interface.");
						}
						writer.write(String.format("%4spublic String %s\n","",mirrorEntry.getKey().toString()));
						writer.write(String.format("%4s{\n",""));
						writer.write(String.format("%8sreturn %s;\n","",mirrorEntry.getValue().toString()));
						writer.write(String.format("%4s}\n\n",""));
					}
					
					if (dbg) {
						debugLog("Mirror Entry type: "+this.processingEnv.getTypeUtils().asElement(mirrorEntry.getKey().getReturnType()));
					}
				}
			}
			
			writer.write("\n}\n");			
			writer.flush();
			writer.close();
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			if (null != writer) {
				try {
					writer.flush();
					writer.close();
				} catch (IOException e) {
					// Swallow
				}
			}
		}
	}
	
	/**
	 * Generates a method in the class that handles the nested version annotation
	 * 
	 * @param writer The file writer to use
	 * @param key {@link ExecutableElement} The actual executable code element
	 * @param value {@link AnnotationValue} The Annotation Value itself
	 */
	protected void generateVersionMethod(Writer writer, ExecutableElement key, AnnotationValue value) {
		// Cast the value to an Annotation Mirror
		AnnotationMirror v  = (javax.lang.model.element.AnnotationMirror)value.getValue();
		// Convert from the std(unfriendly) Map to something we can easily query rather than iterate
		HashMap<String, Object> annotationMap = mapToHash(this.processingEnv.getElementUtils().getElementValuesWithDefaults(v));
		
		// Turn the annotationMap into an actual, real-live, annotation
		Ti.version version = versionMirrorToAnnotation(annotationMap);
			
		try {
			writer.write(String.format("%4spublic String %s\n", "", key.toString()));
			writer.write(String.format("%4s{\n", ""));
			writer.write(String.format("%8sreturn \"%s.%s.%s\";\n", "", version.majorVersion(), version.minorVersion(), version.buildVersion()));
			writer.write(String.format("%4s}\n\n", ""));
		} catch (IOException e) {
			// Swallow
		}
	}
	
	/**
	 * Converts a MAP to a HashMap when you're not interested in iterating but want key/value pairs
	 * @param source The {@link Map} to process
	 * @return  {@link HashMap}
	 */
	protected HashMap<String, Object> mapToHash(Map<? extends ExecutableElement, ? extends AnnotationValue> source) {
		
		HashMap<String, Object> result = new HashMap<String, Object>();
		
		for (Map.Entry<? extends ExecutableElement, ?extends AnnotationValue> mirrorEntry : source.entrySet()) {
			String mirrorKey = mirrorEntry.getKey().getSimpleName().toString();
			result.put(mirrorKey, mirrorEntry.getValue());			

			if (dbg) {
				debugLog("mapToHash "+mirrorKey+":"+mirrorEntry.getValue());				
			}
		}
		
		return result; 
	}
	
	/**
	 * Converts a HashMap into a version Annotation
	 * @param args {@link HashMap}
	 * @return {@link version}
	 */
	protected Ti.version versionMirrorToAnnotation(final HashMap<String, Object> args) {
		
		if (null != args) {
			
			Ti.version v = new Ti.version() {
				
				@Override
				public Class<? extends Annotation> annotationType() {
					return Ti.version.class;
				}
				
				@Override
				public int minorVersion() {
					if (args.containsKey("minorVersion")) {
						return Integer.decode(args.get("minorVersion").toString());
					}
					// TODO Auto-generated method stub
					return 0;
				}
				
				@Override
				public int majorVersion() {
					if (args.containsKey("majorVersion")) {
						return Integer.decode(args.get("majorVersion").toString());
					}
					return 0;
				}
				
				@Override
				public int buildVersion() {
					if (args.containsKey("buildVersion")) {
						return Integer.decode(args.get("buildVersion").toString());
					}
					return 0;
				}
			};
			return v;			
		} else {
			throw new IllegalArgumentException("Version annotation specified but not passed");
		}

	}
	
	// General helpers - Debugging
	protected void debugLog(Diagnostic.Kind debugType, String message) {
		Messager msg = this.processingEnv.getMessager();
		msg.printMessage(Diagnostic.Kind.NOTE, message);		
	}
	
	protected void debugLog(String message) {
		debugLog(Diagnostic.Kind.NOTE, message);
	}
	
	// General helpers - Other

	public static TypeElement findEnclosingTypeElement(Element e) {
		while (e != null && !(e instanceof TypeElement)) {
			e = e.getEnclosingElement();
		}
		return TypeElement.class.cast(e);
	}

}

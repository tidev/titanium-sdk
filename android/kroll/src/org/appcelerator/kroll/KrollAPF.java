package org.appcelerator.kroll;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

import org.xml.sax.ext.DeclHandler;

import com.sun.mirror.apt.AnnotationProcessor;
import com.sun.mirror.apt.AnnotationProcessorEnvironment;
import com.sun.mirror.apt.AnnotationProcessorFactory;
import com.sun.mirror.declaration.AnnotationTypeDeclaration;
import com.sun.mirror.declaration.ClassDeclaration;
import com.sun.mirror.declaration.TypeDeclaration;
import com.sun.mirror.util.DeclarationVisitors;
import com.sun.mirror.util.SimpleDeclarationVisitor;

public class KrollAPF implements AnnotationProcessorFactory {

	private static final Collection<String> supportedAnnotations =
		Collections.unmodifiableCollection(Arrays.asList("org.appcelerator.kroll.annotations.*"));
	
	private static final Collection<String> supportedOptions = Collections.emptySet();
	
	public AnnotationProcessor getProcessorFor(Set<AnnotationTypeDeclaration> atds, AnnotationProcessorEnvironment env) {
		return new TestAnnotationProcessor(env);
	}

	public Collection<String> supportedAnnotationTypes() {
		return supportedAnnotations;
	}

	public Collection<String> supportedOptions() {
		return supportedOptions;
	}
	
	private static class TestAnnotationProcessor implements AnnotationProcessor
	{
		private final AnnotationProcessorEnvironment env;

		TestAnnotationProcessor(AnnotationProcessorEnvironment env) {
			this.env = env;
		}

		public void process() {
			for (TypeDeclaration typeDecl : env.getSpecifiedTypeDeclarations())
				typeDecl.accept(DeclarationVisitors.getDeclarationScanner(new Visitor(), DeclarationVisitors.NO_OP));
		}

		private static class Visitor extends SimpleDeclarationVisitor {
			public void visitClassDeclaration(ClassDeclaration d) {
				System.out.println(d.getQualifiedName());
			}
		}	
	}
}

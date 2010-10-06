This is the source code generating annotation processor for Kroll.

High level design
------------------
This processor generates code for any class annotated with @Kroll.proxy or @Kroll.module.

Code generation works in a two-phase process:

- Collect all annotations and properties from the Java compiler, and generate an updated JSON model of the binding graph
- Generate Java source from the binding graph.

This is split up into two phases to avoid problems using Eclipse's incremental compiler, which would end up generating only partial binding classes since the entire binding "state" was lost between annotation rounds. JSON files act as the intermediary model that fix this problem.

Running the Annotation processor
---------------------------------
There are two ways to use this annotation processor:

1. via javac, using the "-processor" and "-classpath" arguments
    - This process is a little tricky when building titanium itself, because there are circular class dependencies between the @Kroll annotation and certain classes that are annotated in the "titanium" project. See the top level build.xml to see how this is worked around with a two-stage compile.
2. via Eclipse's built in Annotation processing support, using the processor as an Eclipse plugin (see details below)

Using the annotation processor in Eclipse
------------------------------------------
__Details for building and installing the Eclipse plugin__

You will need to make sure you have the Eclipse PDE plugins installed. If you have the "Classic" Eclipse SDK, these should come pre-installed. If not, you can download them here (this is for Eclipse 3.6.x): [http://download.eclipse.org/eclipse/downloads/drops/R-3.6.1-201009090800/index.php#PDERuntime](http://download.eclipse.org/eclipse/downloads/drops/R-3.6.1-201009090800/index.php#PDERuntime)

- Import the kroll-apt project into your Eclipse workspace
- Expand the project, right-click on the "pde-build.xml" file and click Run As > Ant Build
- After the script runs, check kroll-apt/bin/plugins, you should see a file named org.appcelerator.kroll.apt_1.0.0.xxx.jar (where "xxx" is a timestamp)
- Copy this jar into your Eclipse installation's "plugins" folder
- Restart Eclipse
- Perform a "clean" build on your entire workspace
- At this point, if you disable the ".* resources" filter in the Package Explorer view, you should see .apt_generated folders under each titanium project with Generated bindings for each proxy / module. If you are getting compile errors, jump down to Common Problems

__Developing and debugging the annotation processor in Eclipse__

- Once you have the PDE plugins from above installed, you can also setup a 2nd instance of Eclipse to run from your workspace (it will automatically import the kroll-apt plugin and allows you to change it while the 2nd instance is running).
- To setup the 2nd instance, in the Eclipse top level menu, go to Run > Debug Configurations
- Double-click on "Eclipse application" in the left tree
- Give the configuration a memorable name
- Go to the "Arguments" tab, and make sure the -Xmx argument is something large, I have it set to -Xmx2048m
- In the "Plug-ins" tab, select "Launch with: all workspace and enabled target plug-ins"
- Hit "Apply", and then "Debug", and a 2nd instance of Eclipse should start with the annotation processor plugin installed.
- From now on you can just run this configuration to test and run the annotation processor (this is the best route for fixing bugs, etc)

__Enabling annotation processing for new module projects__

- After you've created a new Java project, right click on it and go into "Properties"
- In the left side tree, click on Java Compiler > Annotation Processing
- Enable these checkboxes: "Enable project specific settings", "Enable annotation processing", "Enable processing in editor"
- Under "Processor Options", add a new option by clicking the "New..." button
- The Key should be "kroll.jsonFile" (without quotes)
- The Value should be simply the name of the project, with a ".json" suffix. In the database module, for example, this value is "database.json" (without quotes)
- Click the "OK" button, and Eclipse should ask you to perform a full rebuild on the project, just click "Yes"

__Common Problems with the Annotation Processor in Eclipse__

- Sometimes the compiler will get confused and give errors in the @Kroll annotation, specifically around the use of DEFAULT_NAME in some of the annotation parameters. If you simple press backspace on the underscore, retype the underscore, and Save, this seems to get the compiler out of it's funk. (This mostly happens in clean builds)



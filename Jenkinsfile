#!groovy
library 'pipeline-library'

// Keep logs/reports/etc of last 15 builds, only keep build artifacts of last 3 builds
properties([buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '3'))])

// Variables which we assign and share between nodes
// Don't modify these yourself
def gitCommit = ''
def basename = ''
def vtag = ''
def isPR = false
def MAINLINE_BRANCH_REGEXP = /master|\d_\d_(X|\d)/ // a branch is considered mainline if 'master' or like: 6_2_X, 7_0_X, 6_2_1
def isMainlineBranch = true // used to determine if we should publish to S3 (and include branch in main listing)
def isFirstBuildOnBranch = false // calculated by looking at S3's branches.json

// Variables we can change
def nodeVersion = '6.10.3' // NOTE that changing this requires we set up the desired version on jenkins master first!
def npmVersion = '5.4.1' // We can change this without any changes to Jenkins.

def unitTests(os, nodeVersion, testSuiteBranch) {
	return {
		// TODO Customize labels by os we're testing
		node('android-emulator && git && android-sdk && osx') {
			timeout(20) {
				// Unarchive the osx build of the SDK (as a zip)
				sh 'rm -rf osx.zip' // delete osx.zip file if it already exists
				unarchive mapping: ['dist/mobilesdk-*-osx.zip': 'osx.zip'] // grab the osx zip from our current build
				def zipName = sh(returnStdout: true, script: 'ls osx.zip/dist/mobilesdk-*-osx.zip').trim()
				// if our test suite already exists, delete it...
				sh 'rm -rf titanium-mobile-mocha-suite'
				// clone the tests suite fresh
				// FIXME Clone once on initial node and use stash/unstash to ensure all OSes use exact same checkout revision
				dir('titanium-mobile-mocha-suite') {
					// TODO Do a shallow clone, using same credentials as from scm object
					try {
						git changelog: false, poll: false, credentialsId: 'd05dad3c-d7f9-4c65-9cb6-19fef98fc440', url: 'https://github.com/appcelerator/titanium-mobile-mocha-suite.git', branch: testSuiteBranch
					} catch (e) {
						def msg = "Failed to clone the titanium-mobile-mocha-suite test suite from branch ${testSuiteBranch}. Are you certain that the test suite repo has that branch created?"
						echo msg
						manager.addWarningBadge(msg)
						throw e
					}
				}
				// copy over any overridden unit tests into this workspace
				unstash 'override-tests'
				sh 'cp -R tests/ titanium-mobile-mocha-suite'
				// Now run the unit test suite
				dir('titanium-mobile-mocha-suite/scripts') {
					nodejs(nodeJSInstallationName: "node ${nodeVersion}") {
						sh 'npm install .'
						try {
							sh "node test.js -b ../../${zipName} -p ${os}"
						} catch (e) {
							if ('ios'.equals(os)) {
								// Gather the crash report(s)
								def home = sh(returnStdout: true, script: 'printenv HOME').trim()
								sh "mv ${home}/Library/Logs/DiagnosticReports/mocha_*.crash ."
								archiveArtifacts 'mocha_*.crash'
								sh 'rm -f mocha_*.crash'
							} else {
								// FIXME gather crash reports/tombstones for Android?
							}
							throw e
						} finally {
							// Kill the emulators!
							if ('android'.equals(os)) {
								sh 'killall -9 emulator || echo ""'
								sh 'killall -9 emulator64-arm || echo ""'
								sh 'killall -9 emulator64-x86 || echo ""'
							}
						}
					}
					// save the junit reports as artifacts explicitly so danger.js can use them later
					stash includes: 'junit.*.xml', name: "test-report-${os}"
					junit 'junit.*.xml'
				}
			} // timeout
		}
	}
}

@NonCPS
def isMajorVersionLessThan(version, minValue) {
	def versionMatcher = version =~ /(\d+)\.(\d+)\.(\d+)/
	def majorVersion = versionMatcher[0][1].toInteger()
	return majorVersion < minValue
}

// Wrap in timestamper
timestamps {
	def targetBranch
	try {
		node('git && android-sdk && android-ndk && ant && gperf && osx') {
			stage('Checkout') {
				// Update our shared reference repo for all branches/PRs
				dir('..') {
					if (fileExists('titanium_mobile.git')) {
						dir('titanium_mobile.git') {
							sh 'git remote update -p' // update the clone
						}
					} else {
						sh 'git clone --mirror git@github.com:appcelerator/titanium_mobile.git' // create a mirror
					}
				}

				// checkout scm
				// Hack for JENKINS-37658 - see https://support.cloudbees.com/hc/en-us/articles/226122247-How-to-Customize-Checkout-for-Pipeline-Multibranch
				checkout([
					$class: 'GitSCM',
					branches: scm.branches,
					extensions: scm.extensions + [
						[$class: 'CleanBeforeCheckout'],
						[$class: 'CloneOption', honorRefspec: true, noTags: true, reference: "${pwd()}/../titanium_mobile.git", shallow: true, depth: 30, timeout: 30]],
					userRemoteConfigs: scm.userRemoteConfigs
				])
				// FIXME: Workaround for missing env.GIT_COMMIT: http://stackoverflow.com/questions/36304208/jenkins-workflow-checkout-accessing-branch-name-and-git-commit
				gitCommit = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
				isPR = env.BRANCH_NAME.startsWith('PR-')
				isMainlineBranch = (env.BRANCH_NAME ==~ MAINLINE_BRANCH_REGEXP)
				// target branch of windows SDK to use and test suite to test with
				if (isPR) {
					targetBranch = env.CHANGE_TARGET
				} else if (isMainlineBranch) { // if it's a mainline branch, use the same branch for titanium_mobile_windows
					targetBranch = env.BRANCH_NAME
				}
				if (!targetBranch) { // if all else fails, use master as SDK branch to test with
					targetBranch = 'master'
				}
			}

			nodejs(nodeJSInstallationName: "node ${nodeVersion}") {

				stage('Lint') {
					// NPM 5.2.0 had a bug that broke pruning to production, but latest npm 5.4.1 works well
					sh "npm install -g npm@${npmVersion}"

					// Install dependencies
					timeout(5) {
						// FIXME Do we need to do anything special to make sure we get os-specific modules only on that OS's build/zip?
						sh 'npm install'
					}
					// Stash files for danger.js later
					if (isPR) {
						stash includes: 'node_modules/,package.json,package-lock.json,dangerfile.js', name: 'danger'
					}
					sh 'npm test' // Run linting first // TODO Record the eslint output somewhere for danger to use later?
				}

				// Skip the Windows SDK portion if a PR, we don't need it
				stage('Windows') {
					if (!isPR) {
						// This may be the very first build on this branch, so there's no windows build to grab yet
						try {
							sh 'curl -O http://builds.appcelerator.com.s3.amazonaws.com/mobile/branches.json'
							if (fileExists('branches.json')) {
								def branchesJSONContents = readFile('branches.json')
								if (!branchesJSONContents.startsWith('<?xml')) { // May be an 'Access denied' xml file/response
									def branchesJSON = jsonParse(branchesJSONContents)
									isFirstBuildOnBranch = !(branchesJSON['branches'].contains(env.BRANCH_NAME))
								}
							}
						} catch (err) {
							// ignore? Not able to grab the branches.json, what should we assume? In 99.9% of the cases, it's not a new build
						}

						// If there's no windows build for this branch yet, use master
						def windowsBranch = targetBranch
						if (isFirstBuildOnBranch) {
							windowsBranch = 'master'
							manager.addWarningBadge("Looks like the first build on branch ${env.BRANCH_NAME}. Using 'master' branch build of Windows SDK to bootstrap.")
						}
						step([$class: 'CopyArtifact',
							projectName: "../titanium_mobile_windows/${windowsBranch}",
							selector: [$class: 'StatusBuildSelector', stable: false],
							filter: 'dist/windows/'])
						sh 'rm -rf windows; mv dist/windows/ windows/; rm -rf dist'
					} // !isPR
				} // stage

				stage('Build') {
					// Normal build, pull out the version
					def version = sh(returnStdout: true, script: 'sed -n \'s/^ *"version": *"//p\' package.json | tr -d \'"\' | tr -d \',\'').trim()
					echo "VERSION:         ${version}"
					// Create a timestamp
					def timestamp = sh(returnStdout: true, script: 'date +\'%Y%m%d%H%M%S\'').trim()
					echo "TIMESTAMP:       ${timestamp}"
					vtag = "${version}.v${timestamp}"
					echo "VTAG:            ${vtag}"
					basename = "dist/mobilesdk-${vtag}"
					echo "BASENAME:        ${basename}"

					// TODO parallelize the iOS/Android/Mobileweb/Windows portions!
					dir('build') {
						timeout(15) {
							sh "node scons.js build --android-ndk ${env.ANDROID_NDK_R12B} --android-sdk ${env.ANDROID_SDK}"
						} // timeout
						ansiColor('xterm') {
							if (isPR) {
								// For PR builds, just package android and iOS for osx
								sh "node scons.js package android ios --version-tag ${vtag}"
							} else {
								// For non-PR builds, do all platforms for all OSes
								timeout(15) {
									sh "node scons.js package --version-tag ${vtag} --all"
								} // timeout
							}
						} // ansiColor
					} // dir
					archiveArtifacts artifacts: "${basename}-*.zip"
					stash includes: 'dist/parity.html', name: 'parity'
					stash includes: 'tests/', name: 'override-tests'
				} // end 'Build' stage

				stage('Security') {
					// Clean up and install only production dependencies
					sh 'npm prune --production'

					// Scan for Dependency Check and RetireJS warnings
					def scanFiles = [[path: 'dependency-check-report.xml']]
					dependencyCheckAnalyzer datadir: '', hintsFile: '', includeCsvReports: false, includeHtmlReports: false, includeJsonReports: false, isAutoupdateDisabled: false, outdir: '', scanpath: 'package.json', skipOnScmChange: false, skipOnUpstreamChange: false, suppressionFile: '', zipExtensions: ''
					dependencyCheckPublisher canComputeNew: false, defaultEncoding: '', healthy: '', pattern: '', unHealthy: ''

					sh 'npm install -g retire'
					def retireExitCode = sh(returnStatus: true, script: 'retire --outputformat json --outputpath ./retire.json')
					if (retireExitCode != 0) {
						scanFiles << [path: 'retire.json']
					}

					if (!scanFiles.isEmpty()) {
						step([$class: 'ThreadFixPublisher', appId: '136', scanFiles: scanFiles])
					}

					// re-install dev dependencies for testing later...
					sh(returnStatus: true, script: 'npm install --only=dev') // ignore PEERINVALID grunt issue for now
				} // end 'Security' stage
			} // nodeJs
		} // end node for checkout/build

		// Run unit tests in parallel for android/iOS
		stage('Test') {
			parallel(
				'android unit tests': unitTests('android', nodeVersion, targetBranch),
				'iOS unit tests': unitTests('ios', nodeVersion, targetBranch),
				failFast: true
			)
		}

		stage('Deploy') {
			// Push to S3 if on 'master' or "mainline" branch like 6_2_X, 7_0_X...
			if (isMainlineBranch) {
				// Now allocate a node for uploading artifacts to s3 and in Jenkins
				node('(osx || linux) && !axway-internal && curl') {
					def indexJson = []
					if (fileExists('index.json')) {
						sh 'rm -f index.json'
					}
					try {
						sh "curl -O http://builds.appcelerator.com.s3.amazonaws.com/mobile/${env.BRANCH_NAME}/index.json"
					} catch (err) {
						// ignore? Not able to grab the index.json, so assume it means it's a new branch
					}
					if (fileExists('index.json')) {
						def contents = readFile('index.json')
						if (!contents.startsWith('<?xml')) { // May be an 'Access denied' xml file/response
							indexJson = jsonParse(contents)
						} else {
							// we get access denied if it doesn't exist! Let's treat that as us needing to add branch to branches.json listing
							try {
								sh 'curl -O http://builds.appcelerator.com.s3.amazonaws.com/mobile/branches.json'
								if (fileExists('branches.json')) {
									def branchesJSONContents = readFile('branches.json')
									if (!branchesJSONContents.startsWith('<?xml')) { // May be an 'Access denied' xml file/response
										def branchesJSON = jsonParse(branchesJSONContents)
										if (!(branchesJSON['branches'].contains(env.BRANCH_NAME))) {
											// Update the branches.json on S3
											echo 'updating mobile/branches.json to include new branch...'
											branchesJSON['branches'] << env.BRANCH_NAME
											writeFile file: 'branches.json', text: new groovy.json.JsonBuilder(branchesJSON).toPrettyString()
											step([
												$class: 'S3BucketPublisher',
												consoleLogLevel: 'INFO',
												entries: [[
													bucket: 'builds.appcelerator.com/mobile',
													gzipFiles: false,
													selectedRegion: 'us-east-1',
													sourceFile: 'branches.json',
													uploadFromSlave: true,
													userMetadata: []
												]],
												profileName: 'builds.appcelerator.com',
												pluginFailureResultConstraint: 'FAILURE',
												userMetadata: []])
										}
									}
								}
							} catch (err) {
								// ignore? Not able to grab the branches.json, what should we assume? In 99.9% of the cases, it's not a new build
							}
						}
					}

					// unarchive zips
					sh 'rm -rf dist/'
					unarchive mapping: ['dist/': '.']
					// Have to use Java-style loop for now: https://issues.jenkins-ci.org/browse/JENKINS-26481
					def oses = ['osx', 'linux', 'win32']
					for (int i = 0; i < oses.size(); i++) {
						def os = oses[i]
						def sha1 = sh(returnStdout: true, script: "shasum ${basename}-${os}.zip").trim().split()[0]
						def filesize = Long.valueOf(sh(returnStdout: true, script: "wc -c < ${basename}-${os}.zip").trim())
						step([
							$class: 'S3BucketPublisher',
							consoleLogLevel: 'INFO',
							entries: [[
								bucket: "builds.appcelerator.com/mobile/${env.BRANCH_NAME}",
								gzipFiles: false,
								selectedRegion: 'us-east-1',
								sourceFile: "${basename}-${os}.zip",
								uploadFromSlave: true,
								userMetadata: [[key: 'sha1', value: sha1]]
							]],
							profileName: 'builds.appcelerator.com',
							pluginFailureResultConstraint: 'FAILURE',
							userMetadata: [
								[key: 'build_type', value: 'mobile'],
								[key: 'git_branch', value: env.BRANCH_NAME],
								[key: 'git_revision', value: gitCommit],
								[key: 'build_url', value: env.BUILD_URL]]
						])

						// Add the entry to index json!
						indexJson << [
							'filename': "mobilesdk-${vtag}-${os}.zip",
							'git_branch': env.BRANCH_NAME,
							'git_revision': gitCommit,
							'build_url': env.BUILD_URL,
							'build_type': 'mobile',
							'sha1': sha1,
							'size': filesize
						]
					}

					// Update the index.json on S3
					echo "updating mobile/${env.BRANCH_NAME}/index.json..."
					writeFile file: "index.json", text: new groovy.json.JsonBuilder(indexJson).toPrettyString()
					step([
						$class: 'S3BucketPublisher',
						consoleLogLevel: 'INFO',
						entries: [[
							bucket: "builds.appcelerator.com/mobile/${env.BRANCH_NAME}",
							gzipFiles: false,
							selectedRegion: 'us-east-1',
							sourceFile: 'index.json',
							uploadFromSlave: true,
							userMetadata: []
						]],
						profileName: 'builds.appcelerator.com',
						pluginFailureResultConstraint: 'FAILURE',
						userMetadata: []])

					// Upload the parity report
					unstash 'parity'
					sh "mv dist/parity.html ${basename}-parity.html"
					step([
						$class: 'S3BucketPublisher',
						consoleLogLevel: 'INFO',
						entries: [[
							bucket: "builds.appcelerator.com/mobile/${env.BRANCH_NAME}",
							gzipFiles: false,
							selectedRegion: 'us-east-1',
							sourceFile: "${basename}-parity.html",
							uploadFromSlave: true,
							userMetadata: []
						]],
						profileName: 'builds.appcelerator.com',
						pluginFailureResultConstraint: 'FAILURE',
						userMetadata: []])

					// Trigger titanium_mobile_windows if this is the first build on a "mainline" branch
					if (isFirstBuildOnBranch) {
						// Trigger build of titanium_mobile_windows in our pipeline multibranch group!
						build job: "../titanium_mobile_windows/${env.BRANCH_NAME}", wait: false
					}
					// Now wipe the workspace. otherwise the unstashed artifacts will stick around on the node (master)
					deleteDir()
				} // node
			} // isMainlineBranch
		} // stage
	} // try
	catch (err) {
		// TODO Use try/catch at lower level (like around tests) so we can give more detailed failures?
		currentBuild.result = 'FAILURE'
		mail body: "project build error is here: ${env.BUILD_URL}",
			from: 'hudson@appcelerator.com',
			replyTo: 'no-reply@appcelerator.com',
			subject: 'project build failed',
			to: 'eng-platform@appcelerator.com'

		throw err
	}
	finally {
		// If we're building a PR, always try and run Danger.JS at the end so we can provide useful comments/info to the PR author
		if (isPR) {
			stage('Danger') {
				node('osx || linux') {
					nodejs(nodeJSInstallationName: "node ${nodeVersion}") {
						unstash 'danger' // this gives us dangerfile.js, package.json, package-lock.json, node_modules/
						unstash 'test-report-ios' // junit.ios.report.xml
						unstash 'test-report-android' // junit.android.report.xml
						sh "npm install -g npm@${npmVersion}"
						// FIXME We need to hack the env vars for Danger.JS because it assumes Github Pull Request Builder plugin only
						// We use Github branch source plugin implicitly through pipeline job
						// See https://github.com/danger/danger-js/issues/379
						withEnv(['ghprbGhRepository=appcelerator/titanium_mobile',"ghprbPullId=${env.CHANGE_ID}"]) {
							sh 'npx danger'
						} // withEnv
					} // nodejs
				} // node
			} // Danger stage
		} // isPR
	}
}

#!groovy

node('node-4 && android-emulator && npm && git && android-sdk && android-ndk && ant && gperf && osx') {
	currentBuild.result = 'SUCCESS'

	// Wrap in timestamper
	timestamps {
		try {
			def gitCommit = ''
			stage('Checkout') {
				// checkout scm
				// Hack for JENKINS-37658 - see https://support.cloudbees.com/hc/en-us/articles/226122247-How-to-Customize-Checkout-for-Pipeline-Multibranch
				checkout([
					$class: 'GitSCM',
					branches: scm.branches,
					extensions: scm.extensions + [[$class: 'CloneOption', honorRefspec: true, noTags: true, reference: '', shallow: true, depth: 30, timeout: 30]],
					userRemoteConfigs: scm.userRemoteConfigs
				])
				// FIXME: Workaround for missing env.GIT_COMMIT: http://stackoverflow.com/questions/36304208/jenkins-workflow-checkout-accessing-branch-name-and-git-commit
				gitCommit = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
			}

			def basename = ''
			def vtag = ''
			def isPR = env.BRANCH_NAME.startsWith('PR-')
			timeout(45) {
				ansiColor('xterm') {
					stage('Build') {
						// Skip the Windows SDK portion on PR builds?
						if (!isPR) {
							// Grab Windows SDK piece
							def windowsBranch = env.BRANCH_NAME.replaceAll(/_/, ".")
							step ([$class: 'CopyArtifact',
								projectName: "titanium_mobile_windows_${windowsBranch}",
								filter: 'dist/windows/']);
							sh 'rm -rf windows; mv dist/windows/ windows/; rm -rf dist'
						}

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
							sh 'npm install .'
							sh 'node scons.js build --android-ndk /opt/android-ndk-r11c --android-sdk /opt/android-sdk'
							if (isPR) {
								// For PR builds, just package android and iOS for osx
								sh "node scons.js package android ios --version-tag ${vtag}"
							} else {
								// For non-PR builds, do all platforms for all OSes
								sh "node scons.js package --version-tag ${vtag} --all"
							}
						}
						// Stash the zip for later, so we can parallelize the tests
						//stash includes: "${basename}-*.zip", name: 'zip'
					}

					// TODO Separate out the node requirements for test vs build.
					// Specifically, for build we need:
					// node-4 && npm && git && android-sdk && android-ndk && ant && gperf && (osx || linux)
					// For test we need:
					// node-4 && android-emulator && npm && git && android-sdk && osx
					stage('Test') {
						// TODO Unstash the SDK zip and run tests in parallel for android/ios on separate nodes!
						dir('titanium-mobile-mocha-suite') {
							// TODO Do a shallow clone, using same credentials as above
							git credentialsId: 'd05dad3c-d7f9-4c65-9cb6-19fef98fc440', url: 'https://github.com/appcelerator/titanium-mobile-mocha-suite.git'
						}
						sh 'cp -R tests/ titanium-mobile-mocha-suite'
						dir('titanium-mobile-mocha-suite/scripts') {
							sh 'npm install .'
							sh "node test.js -b ../../${basename}-osx.zip -p android,ios"
							junit 'junit.*.xml'
						}
					}
				}
			}

			stage('Deploy') {
				// Push to S3 if not PR
				if (!isPR) {
					def indexJson = []
					try {
						sh "wget http://builds.appcelerator.com.s3.amazonaws.com/mobile/${env.BRANCH_NAME}/index.json"
						indexJson = new groovy.json.JsonSlurperClassic().parseText(readFile('index.json'))
					} catch (err) {
						// ignore? Not able to grab the index.json, so assume it means it's a new branch
					}

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
				}
			}

			stage('Results') {
				archive 'dist/*.zip'
			}
		}
		catch (err) {
			currentBuild.result = 'FAILURE'

			office365ConnectorSend(message: 'Build failed', status: currentBuild.result, webhookUrl: 'https://outlook.office.com/webhook/ba1960f7-fcca-4b2c-a5f3-095ff9c87b22@300f59df-78e6-436f-9b27-b64973e34f7d/JenkinsCI/1e4f6c138db84aeca1b55a0340750b55/72931ee3-e99d-4daf-84d2-1427168af2d9')

			mail body: "project build error is here: ${env.BUILD_URL}",
				from: 'hudson@appcelerator.com',
				replyTo: 'no-reply@appcelerator.com',
				subject: 'project build failed',
				to: 'eng-platform@appcelerator.com'

			throw err
		}
	}
}

#! groovy
library 'pipeline-library'

timestamps {
  node('windows && windows-sdk-10 && windows-sdk-8.1 && (vs2015 || vs2017) && npm-publish') {
    def packageVersion = ''
    def isPR = false
    stage('Checkout') {
      // checkout scm
      // Hack for JENKINS-37658 - see https://support.cloudbees.com/hc/en-us/articles/226122247-How-to-Customize-Checkout-for-Pipeline-Multibranch
      checkout([
        $class: 'GitSCM',
        branches: scm.branches,
        extensions: scm.extensions + [[$class: 'CleanBeforeCheckout']],
        userRemoteConfigs: scm.userRemoteConfigs
      ])

      isPR = env.BRANCH_NAME.startsWith('PR-')
      packageVersion = jsonParse(readFile('package.json'))['version']
      currentBuild.displayName = "#${packageVersion}-${currentBuild.number}"
    }

    nodejs(nodeJSInstallationName: 'node 4.7.3') {
      ansiColor('xterm') {
        timeout(15) {
          stage('Build') {
            // Install yarn if not installed
            if (bat(returnStatus: true, script: 'where yarn') != 0) {
              bat 'npm install -g yarn'
            }
            bat 'yarn install'
            // Try to kill any running emulators first?
            bat returnStatus: true, script: 'taskkill /IM xde.exe'
            // And stop them too!
            bat returnStatus: true, script: 'powershell -NoLogo -ExecutionPolicy ByPass -Command "& {Stop-VM *}"'
            try {
              withEnv(['JUNIT_REPORT_PATH=junit_report.xml']) {
                bat 'yarn test'
              }
            } catch (e) {
              throw e
            } finally {
              junit 'junit_report.xml'
            }
            fingerprint 'package.json'
            // Don't tag PRs
            if (!isPR) {
              pushGitTag(name: packageVersion, message: "See ${env.BUILD_URL} for more information.", force: true)
            }
          } // stage
        } // timeout

        stage('Security') {
          // Clean up and install only production dependencies
          bat 'yarn install --production'

          // Scan for NSP and RetireJS warnings
          bat 'yarn global add nsp'
          bat 'nsp check --output summary --warn-only'

          bat 'yarn global add retire'
          bat 'retire --exitwith 0'

          step([$class: 'WarningsPublisher', canComputeNew: false, canResolveRelativePaths: false, consoleParsers: [[parserName: 'Node Security Project Vulnerabilities'], [parserName: 'RetireJS']], defaultEncoding: '', excludePattern: '', healthy: '', includePattern: '', messagesPattern: '', unHealthy: ''])
        } // stage

        stage('Publish') {
          if (!isPR) {
            bat 'npm publish'
            // Trigger appc-cli-wrapper job
            build job: 'appc-cli-wrapper', wait: false
          }
        } // stage

        stage('JIRA') {
          if (!isPR) {
            def versionName = "windowslib ${packageVersion}"
            def projectKey = 'TIMOB'
            def issueKeys = jiraIssueSelector(issueSelector: [$class: 'DefaultIssueSelector'])

            // Comment on the affected tickets with build info
            step([
              $class: 'hudson.plugins.jira.JiraIssueUpdater',
              issueSelector: [$class: 'hudson.plugins.jira.selector.DefaultIssueSelector'],
              scm: scm
            ])

            // Create the version we need if it doesn't exist...
            step([
              $class: 'hudson.plugins.jira.JiraVersionCreatorBuilder',
              jiraVersion: versionName,
              jiraProjectKey: projectKey
            ])

            // Should append the new version to the ticket's fixVersion field
            def fixVersion = [name: versionName]
            for (i = 0; i < issueKeys.size(); i++) {
              def result = jiraGetIssue(idOrKey: issueKeys[i])
              def fixVersions = result.data.fields.fixVersions << fixVersion
              def testIssue = [fields: [fixVersions: fixVersions]]
              jiraEditIssue(idOrKey: issueKeys[i], issue: testIssue)
            }

            // Should release the version
            step([$class: 'JiraReleaseVersionUpdaterBuilder', jiraProjectKey: projectKey, jiraRelease: versionName])
          } // if
        } // stage(JIRA)
      } // ansiColor
    } //nodejs
  } // node
} // timestamps

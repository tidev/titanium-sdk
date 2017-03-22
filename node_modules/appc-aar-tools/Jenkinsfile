#! groovy

def isPR = false
isPR = env.BRANCH_NAME.startsWith('PR-')

node('node && npm && npm-publish') {
  stage('Checkout') {
    checkout scm
  }
  stage('Dependencies') {
    sh 'npm install'
  }
  stage('Test') {
    sh 'npm test'
  }
  stage('Publish') {
    if (!isPR) {
				sh 'npm publish'
    }
  }
}

#! groovy

def publishableBranches = ["master"]

node('node && npm && npm-publish && nsp && retirejs') {
  stage('Checkout') {
    checkout scm
  }
  stage('Dependencies') {
    sh 'npm install'
  }
  stage('Test') {
    sh 'retire'
    sh 'nsp check'
    sh 'npm test'
  }
  stage('Publish') {
    if(publishableBranches.contains(env.BRANCH_NAME)) {
      echo "Publishing ${env.BRANCH_NAME} branch."
      sh 'npm publish'
    }
  }
}

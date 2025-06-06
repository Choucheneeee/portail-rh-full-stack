pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        ACR_LOGIN_SERVER = 'portailrh.azurecr.io'
        IMAGE_NAME = 'portailrh-app'
        IMAGE_TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/Choucheneeee/portail-rh-full-stack'
            }
        }

        stage('Login to Azure ACR') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'DOCKERHUB_CREDS',
                                                      passwordVariable: 'DOCKERHUB_CREDS_PSW',
                                                      usernameVariable: 'DOCKERHUB_CREDS_USR')]) {
                        bat """
                            docker logout
                            echo ${DOCKERHUB_CREDS_PSW} | docker login portailrh.azurecr.io -u ${DOCKERHUB_CREDS_USR} --password-stdin
                        """
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                bat "docker-compose build"
            }
        }

        stage('Tag & Push to Azure Container Registry') {
            steps {
                script {
                    bat """
                        docker tag backend ${ACR_LOGIN_SERVER}/${IMAGE_NAME}-backend:${IMAGE_TAG}
                        docker tag frontend ${ACR_LOGIN_SERVER}/${IMAGE_NAME}-frontend:${IMAGE_TAG}

                        docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}-backend:${IMAGE_TAG}
                        docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}-frontend:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Cleanup Local Docker') {
            steps {
                bat "docker-compose down --volumes"
                bat "docker system prune -af"
            }
        }
    }
}

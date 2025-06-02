pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        ACR_LOGIN_SERVER = 'portailrh.azurecr.io'
        IMAGE_NAME = 'portailrh-app'
        IMAGE_TAG = 'latest'
        DOCKERHUB_CREDS = credentials('acr-credentials') // Jenkins credentials ID
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
                    bat """
                    docker logout
                    bat "echo ${DOCKERHUB_CREDS_PSW} | docker login portailrh.azurecr.io -u PortailRh --password-stdin"   
                    """
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
                    // You can loop for multiple services if needed
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

pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/Choucheneeee/portail-rh-full-stack'
            }
        }
        stage('Clean Previous Containers') {
    steps {
        bat 'docker-compose down'
    }
}
        stage('Build & Start containers') {
            steps {
                bat 'docker-compose up -d --build'
            }
        }

        // stage('Run tests (optional)') {
        //     steps {
        //         bat 'docker-compose exec backend npm test' // si tu as des tests
        //     }
        // }

        stage('Cleanup') {
            steps {
                bat 'docker-compose down'
            }
        }
    }
}

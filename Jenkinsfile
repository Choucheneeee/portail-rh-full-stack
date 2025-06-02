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

        stage('Build & Start containers') {
            steps {
                sh 'docker-compose up -d --build'
            }
        }

        // stage('Run tests (optional)') {
        //     steps {
        //         sh 'docker-compose exec backend npm test' // si tu as des tests
        //     }
        // }

        stage('Cleanup') {
            steps {
                sh 'docker-compose down'
            }
        }
    }
}

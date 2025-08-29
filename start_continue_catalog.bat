@echo off
REM ==============================
REM Настройка для Continue + deepseek coder
REM ==============================

REM 1. Устанавливаем путь к gcloud (если не добавлен в PATH)
rem SET PATH=C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin;%PATH%

REM 2. Авторизация gcloud (можно раскомментировать при необходимости)
REM gcloud auth login
REM gcloud config set project jumbleai-467718
REM gcloud config set compute/region us-central1

REM 3. Запускаем VS Code
code "l:\!projects\catalog_zaprosov_bd2" 
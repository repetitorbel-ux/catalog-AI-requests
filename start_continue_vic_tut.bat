@echo off
REM ==============================
REM ��������� ��� Continue + VS Code + Vertex AI
REM ==============================

REM 1. ������������� ���� � gcloud (���� �� �������� � PATH)
SET PATH=C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin;%PATH%

REM 2. ����������� gcloud (����� ����������������� ��� �������������)
REM gcloud auth login
REM gcloud config set project jumbleai-467718
REM gcloud config set compute/region us-central1

REM 3. ��������� VS Code
code "C:\Users\vic_tut" 
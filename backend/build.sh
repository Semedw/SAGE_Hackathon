#!/usr/bin/env bash
# Render build script for Django backend
set -o errexit

# Install system dependencies for Pillow, Tesseract OCR, and python-magic
apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype-dev \
    liblcms2-dev \
    libwebp-dev \
    libtiff-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libmagic1

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate

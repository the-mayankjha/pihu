#!/bin/bash
echo "Setting up offline voice recognition (Vosk Model)..."

# Ensure public directory exists
mkdir -p public

if [ ! -f "public/model.tar.gz" ]; then
    echo "Downloading vosk-model-small-en-us-0.15 (~40MB)..."
    curl -L "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip" -o model.zip
    echo "Extracting model..."
    unzip -q model.zip
    cd vosk-model-small-en-us-0.15
    echo "Compressing to tar.gz for browser..."
    tar -czf ../public/model.tar.gz .
    cd ..
    rm -rf vosk-model-small-en-us-0.15 model.zip public/model
    echo "Model repackaged to public/model.tar.gz."
else
    echo "Model already exists at public/model.tar.gz."
fi

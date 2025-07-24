#!/bin/bash

# Build script for Whisper.cpp Lambda Layer
# This script builds Whisper.cpp for AWS Lambda (Amazon Linux 2)

echo "Building Whisper.cpp for AWS Lambda..."

# Create layer directory structure
mkdir -p layer/bin
mkdir -p layer/models

# Build Whisper.cpp using Amazon Linux 2 Docker
echo "Building Whisper binary..."
docker run --rm -v "$(pwd)/layer/bin:/output" amazonlinux:2 bash -c '
  # Install build dependencies
  yum install -y git make gcc gcc-c++ wget
  
  # Clone Whisper.cpp
  cd /tmp
  git clone https://github.com/ggerganov/whisper.cpp
  cd whisper.cpp
  git checkout v1.5.4
  
  # Build
  make -j$(nproc)
  
  # Copy binary to output
  cp main /output/whisper
  chmod +x /output/whisper
  
  echo "Whisper binary built successfully"
'

# Download model
echo "Downloading Whisper model..."
cd layer/models

# Using base.en model (74MB) for Lambda constraints
# You can change to tiny.en (39MB) for even smaller size
if [ ! -f "ggml-base.en.bin" ]; then
  wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
  echo "Model downloaded successfully"
else
  echo "Model already exists"
fi

cd ../..

# Create the layer zip
echo "Creating Lambda layer zip..."
cd layer
zip -r ../whisper-layer.zip .
cd ..

echo "Build complete! whisper-layer.zip is ready for deployment"
echo "Layer contains:"
echo "- bin/whisper (Whisper.cpp binary)"
echo "- models/ggml-base.en.bin (Whisper model)"

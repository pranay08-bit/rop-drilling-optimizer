# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies (needed for compilation if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy python dependencies list
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code folders and files
COPY ./src /app/src
COPY ./backend /app/backend
COPY ./main.py /app/main.py
COPY ./config.yaml /app/config.yaml
COPY ./data /app/data
COPY ./models /app/models

# Expose port 8000 for FastAPI
EXPOSE 8000

# Set environment variable to make imports clean
ENV PYTHONPATH=/app/src:/app

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.11-slim

# Prevent python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies required by Manim CE, LaTeX, Cairo, and ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    sox \
    libcairo2-dev \
    libpango1.0-dev \
    pkg-config \
    git \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    tipa \
    ghostscript \
    bwrap \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create non-privileged runner user for sandboxed Manim execution
RUN useradd -m -u 1001 manimuser && \
    mkdir -p /app/media && \
    chown -R manimuser:manimuser /app

COPY . /app
USER manimuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

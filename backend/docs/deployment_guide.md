# ROP Optimizer Production Deployment Guide

This guide provides step-by-step instructions to compile and deploy your Vite React frontend and FastAPI Python backend to production cloud platforms.

---

## 1. Preparing the Code for Production

### A. Dynamic API URL in Frontend
Currently, your frontend points directly to `http://localhost:8000`. For production, it needs to dynamically point to your live backend domain.

1. Create a `.env.production` file in your `rop-optimizer-ui` folder:
   ```env
   VITE_API_URL=https://your-backend-server.com
   ```
2. In your frontend client code where the Axios/Fetch base URL is configured, change it to reference the environment variable:
   ```javascript
   export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
   ```

---

## 2. Deploying the Frontend (Vite React)

The frontend is a static site. It can be hosted for free on platforms like **Vercel** or **Netlify**.

### Option A: Hosting with Vercel (Easiest)
1. Push your UI code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Go to [Vercel.com](https://vercel.com) and sign in with your GitHub account.
3. Click **Add New** -> **Project** and select your UI repository.
4. Vercel will automatically detect Vite. Leave the build settings as default:
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Open the **Environment Variables** section and add:
   * **Key**: `VITE_API_URL`
   * **Value**: *[The URL of your deployed FastAPI backend (see Step 3)]*
6. Click **Deploy**. Vercel will build the files and provide a live URL (e.g. `https://rop-optimizer-ui.vercel.app`).

---

## 3. Deploying the Backend & ML Pipeline (FastAPI & Python)

Because the backend executes ML models and processes files, we must containerize it with **Docker** and host it on a platform like **Render** or **Railway**.

### A. Create a `Dockerfile`
In the root directory of your backend, create a file named `Dockerfile` (no extension):

```dockerfile
# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies (needed for compiling certain python packages if necessary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy python dependencies list
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files and ML pipeline folder into the container
COPY ./backend /app/backend
COPY ./ROP_Optimizer /app/ROP_Optimizer

# Expose port 8000 for FastAPI
EXPOSE 8000

# Set environment variable to make imports clean
ENV PYTHONPATH=/app/ROP_Optimizer/src:/app

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### B. Create `requirements.txt`
In the same directory, create a `requirements.txt` file listing all Python libraries:

```text
fastapi==0.110.0
uvicorn==0.28.0
pyyaml==6.0.1
pandas==2.2.1
numpy==1.26.4
xgboost==2.0.3
scikit-learn==1.4.1.post1
joblib==1.3.2
openpyxl==3.1.2
python-multipart==0.0.9
```

### C. Deploying to Render.com
1. Create a free account on [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing the backend files.
4. Under **Runtime**, select **Docker**.
5. Choose your server tier (the free tier includes 512MB RAM, which is enough for lightweight runs. For heavy production datasets, choose 2GB RAM).
6. Click **Deploy Web Service**. Render will build your Docker image and expose a public URL (e.g., `https://rop-optimizer-backend.onrender.com`).
7. Update your Vercel frontend environment variable (`VITE_API_URL`) to this URL.

---

## 4. Production Storage Considerations
In a live cloud environment, the backend container's disk is "ephemeral" (temporary). If the server restarts, uploaded files inside `/data` will disappear. 

* **To fix this for production**: Update the FastAPI upload endpoint in `main.py` to write files to **Amazon S3** or **Google Cloud Storage** rather than the local filesystem, and modify `ingest.py` to stream files from that cloud storage bucket.

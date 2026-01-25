#!/bin/bash
# Deploy to Google Cloud Run
# Make sure you have the gcloud CLI installed and authenticated (gcloud auth login)

echo "Deploying Urbanito to Cloud Run..."

# Deploy from source (uses Cloud Build to build the Docker image remotely)
gcloud run deploy urbanito \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

echo "Deployment process finished."

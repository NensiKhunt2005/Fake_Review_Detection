Fake Review Detector
Goal

Build a production-ready AI-powered Fake Review Detector for Amazon, Flipkart and similar e-commerce platforms.

The system must provide trustworthy review analysis using a fine-tuned BERT model.

Do not implement login, registration, authentication, user accounts, user profiles, payments, admin panels, or email verification.

Architecture
Amazon Product

↓

Chrome Extension

↓

FastAPI

↓

BERT Model

↓

Trust Score Engine

↓

Dashboard

↓

Explainable AI
Chrome Extension

Must:

Detect supported product pages
Extract public reviews
Extract product name
Extract product rating when available
Send reviews to backend
Display popup
Display Trust Score
Display Genuine %
Display Suspicious %
Display Top Risk Indicators
View Detailed Report button

Never modify Amazon or Flipkart pages.

Never replace ratings.

Never modify review content.

Backend

FastAPI

Endpoints:

POST /predict

POST /batch-predict

POST /trust-score

Features:

Validation
Logging
Error Handling
OpenAPI
Config Management
Machine Learning

Use

HuggingFace
Fine-tuned BERT

Return

Prediction
Confidence
Explanation

Support

Batch Prediction

Trust Score

Explainability

Dashboard

Pages

Dashboard

Analytics

Reports

History
Manual single-review analysis

Charts

Filters

Review Table

Explainable AI

Responsive UI

Documentation

Generate

README

Installation

Architecture

Folder Structure

Deployment

API Docs

Developer Guide

Troubleshooting

Deployment

Project should be deployable.

Support Docker.

Support Environment Variables.

Definition of Done

The project finishes only when:

✓ Extension works

✓ APIs work

✓ Dashboard works

✓ ML works

✓ Documentation complete

✓ Tests pass

✓ Deployment ready

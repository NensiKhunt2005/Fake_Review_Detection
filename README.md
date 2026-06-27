# Fake Review Detection System using BERT

A production-level AI project to detect fake reviews on e-commerce platforms using BERT and LIME.

## Tech Stack
- **Backend**: FastAPI
- **ML**: HuggingFace Transformers (BERT), LIME
- **Frontend**: React
- **Extension**: Manifest V3 Chrome Extension

## Setup Instructions

### 1. ML Training
```bash
pip install transformers torch accelerate lime pandas scikit-learn
python3 ml/scripts/generate_data.py
python3 ml/scripts/preprocess.py
python3 ml/scripts/train.py
```

### 2. Backend
```bash
python3 -m backend.app.main
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Chrome Extension
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select the `extension/` folder

## Features
- BERT-based classification (Fake vs Genuine)
- LIME Explainability (Highlighting key words)
- Chrome Extension integration for Amazon/Yelp
- Modular and production-level code structure

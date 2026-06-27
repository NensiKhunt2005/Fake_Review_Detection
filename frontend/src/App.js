import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Search, Info } from 'lucide-react';
import './App.css';

function App() {
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDetect = async () => {
    if (!review.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/api/predict', {
        review_text: review
      });
      setResult(response.data);
    } catch (err) {
      setError('Failed to connect to the backend server. Make sure it is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Fake Review Detector</h1>
        <p>AI-powered analysis using BERT and LIME</p>
      </header>

      <main>
        <div className="input-section">
          <textarea
            placeholder="Paste your review here..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={6}
          />
          <button 
            onClick={handleDetect} 
            disabled={loading || !review.trim()}
            className={loading ? 'loading' : ''}
          >
            {loading ? 'Analyzing...' : 'Analyze Review'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className={`result-card ${result.prediction === 'Fake' ? 'fake' : 'genuine'}`}>
            <div className="result-header">
              {result.prediction === 'Fake' ? (
                <><AlertTriangle color="#ef4444" /> <h2>Fake Review Detected</h2></>
              ) : (
                <><CheckCircle color="#22c55e" /> <h2>Genuine Review</h2></>
              )}
            </div>
            
            <div className="confidence-meter">
              <span>Confidence: {(result.confidence * 100).toFixed(2)}%</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${result.confidence * 100}%`, backgroundColor: result.prediction === 'Fake' ? '#ef4444' : '#22c55e' }}
                ></div>
              </div>
            </div>

            {result.explanation && (
              <div className="explanation-section">
                <h3><Info size={16} /> Why? (Top Factors)</h3>
                <div className="keywords">
                  {Object.entries(result.explanation).map(([word, score]) => (
                    <span key={word} className={`keyword ${score > 0 ? 'pos' : 'neg'}`}>
                      {word}
                    </span>
                  ))}
                </div>
                <p className="hint">Red words strongly suggest "Fake", Green words suggest "Genuine".</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2026 Fake Review Detection System</p>
      </footer>
    </div>
  );
}

export default App;

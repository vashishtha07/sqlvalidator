import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; // Make sure this CSS file exists for styling

function App() {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  // Add a new state for the selected dialect, defaulting to 'mysql'
  const [dialect, setDialect] = useState('mysql');
  const debounceTimer = useRef(null);
  // Use a ref to store the AbortController instance
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Clear the previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Abort the previous request if it's still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't send empty SQL
    if (!sql.trim()) {
      setResult(null);
      return;
    }

    // Set a new timer
    debounceTimer.current = setTimeout(() => {
      validateSQL(sql, dialect);
    }, 500);

    // Cleanup function for the effect
    return () => {
      clearTimeout(debounceTimer.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sql, dialect]); // Add dialect as a dependency

  const validateSQL = async (sqlToValidate, selectedDialect) => {
    setLoading(true);
    // Create a new AbortController for the current request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const response = await axios.post(
        'https://sqlvalidator-backend-production.up.railway.app/validate',
        { sql: sqlToValidate, dialect: selectedDialect },
        { signal }
      );
      setResult(response.data);
    } catch (error) {
      // Check if the error is due to the request being aborted
      if (axios.isCancel(error)) {
        console.log('Request was aborted:', error.message);
      } else if (error.response) {
        setResult(error.response.data);
      } else {
        setResult({ valid: false, errors: [{ message: "Server error or connection failed" }] });
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorLines = (errors) => {
    const errorLines = new Set();
    if (errors && Array.isArray(errors)) {
      errors.forEach(err => {
        if (err.line) {
          errorLines.add(err.line);
        }
      });
    }
    return errorLines;
  };

  const errorLines = getErrorLines(result?.errors);

  return (
    <div className="app-container">
      <h1>SQL Syntax Validator</h1>

      <div className="controls">
        <label htmlFor="dialect-select">Database Dialect: </label>
        <select
          id="dialect-select"
          value={dialect}
          onChange={(e) => setDialect(e.target.value)}
        >
          <option value="mysql">MySQL</option>
          <option value="postgres">PostgreSQL</option>
          <option value="oracle">Oracle</option>
          <option value="ansi">ANSI</option>
        </select>
      </div>

      <div className="textarea-container">
        <textarea
          rows="8"
          cols="100"
          placeholder="Write your SQL here..."
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          className={result?.valid === false ? 'has-error' : ''}
        />
        {/* Render error messages below the textarea */}
        {loading && <p className="status-message">Validating...</p>}
        {result && !loading && (
          <div className="result-messages">
            {result.valid ? (
              <p className="success-message">✅ Your SQL is valid!</p>
            ) : (
              <div>
                <p className="error-summary">❌ Validation failed. Errors found:</p>
                <ul>
                  {result.errors.map((err, index) => (
                    <li key={index}>
                      Line {err.line}, Position {err.pos}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
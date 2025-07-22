import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  // Trigger validation after 500ms of no typing
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't send empty SQL
    if (!sql.trim()) {
      setResult(null);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      validateSQL(sql);
    }, 500);

    return () => {
      clearTimeout(debounceTimer.current);
    };
  }, [sql]);

  const validateSQL = async (sqlToValidate) => {
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:5000/validate', { sql: sqlToValidate });
      setResult(response.data);
    } catch (error) {
      if (error.response) {
        setResult(error.response.data);
      } else {
        setResult({ error: "Server error or connection failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>SQL Syntax Validator</h1>
      <textarea
        rows="8"
        cols="100"
        placeholder="Write your SQL here..."
        value={sql}
        onChange={(e) => setSql(e.target.value)}
      />
      <div className="result">
        {loading && <p>Validating...</p>}
        {result && (
          <pre>{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default App;
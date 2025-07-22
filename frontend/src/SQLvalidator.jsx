import { useState } from 'react';
import axios from 'axios';

export default function SQLValidator() {
    const [sql, setSql] = useState('');
    const [issues, setIssues] = useState([]);
    const [fixedSql, setFixedSql] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://127.0.0.1:5000/validate', {
                sql: sql,
                dialect: 'ansi'
            });
            setIssues(res.data.issues);
            setFixedSql(res.data.fixed_sql);
        } catch (err) {
            console.error("Error:", err);
            alert("Failed to validate SQL. Is the backend running?");
        }
    };

    return (
        <div style={{
            maxWidth: '700px',
            margin: '40px auto',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
                SQL Syntax Validator
            </h1>

            <form onSubmit={handleSubmit}>
                <textarea
                    style={{
                        width: '100%',
                        height: '200px',
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        resize: 'vertical'
                    }}
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    placeholder="Write your SQL query here..."
                />
                <button
                    type="submit"
                    style={{
                        marginTop: '10px',
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Validate
                </button>
            </form>

            {issues.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h2 style={{ color: '#c00' }}>Issues Found:</h2>
                    <ul style={{ paddingLeft: '20px' }}>
                        {issues.map((issue, index) => (
                            <li key={index}>
                                <strong>Line {issue.line}, Pos {issue.position}:</strong> {issue.rule} - {issue.description}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {fixedSql && (
                <div style={{
                    marginTop: '20px',
                    padding: '10px',
                    backgroundColor: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: '4px'
                }}>
                    <h2 style={{ color: '#0050b3' }}>Auto-fixed SQL:</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{fixedSql}</pre>
                </div>
            )}
        </div>
    );
}

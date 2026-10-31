import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setFile(selectedFile);
    setMessage("");
    setResumeText("");
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setMessage("Please upload your resume first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setResumeText("");
    setAnalysis(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      setMessage(data.message);
      setResumeText(data.text);
      setAnalysis(data.analysis);
    } catch (error) {
      console.log(error);
      setMessage("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const sectionStyle = {
    marginTop: "20px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "#fafafa",
  };

  const listItemStyle = {
    marginBottom: "5px",
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "50px auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1>AI Resume Analyzer</h1>

      <p>Upload your resume and analyze it with AI.</p>

      <input type="file" accept=".pdf" onChange={handleFileChange} />

      {file && (
        <p>
          Selected file: <strong>{file.name}</strong>
        </p>
      )}

      <br />

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {message && (
        <div style={{ marginTop: "20px" }}>
          <h3>{message}</h3>
        </div>
      )}

      {analysis && (
        <div style={{ marginTop: "30px" }}>
          <div style={sectionStyle}>
            <h2>ATS Score: {analysis.atsScore} / 100</h2>
          </div>

          <div style={sectionStyle}>
            <h3>✅ Detected Skills</h3>
            <ul>
              {analysis.detectedSkills?.map((skill, i) => (
                <li key={i} style={listItemStyle}>
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3>❌ Missing Skills</h3>
            <ul>
              {analysis.missingSkills?.map((skill, i) => (
                <li key={i} style={listItemStyle}>
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3>💪 Strengths</h3>
            <ul>
              {analysis.strengths?.map((item, i) => (
                <li key={i} style={listItemStyle}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3>⚠️ Weaknesses</h3>
            <ul>
              {analysis.weaknesses?.map((item, i) => (
                <li key={i} style={listItemStyle}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3>💡 Suggestions</h3>
            <ul>
              {analysis.suggestions?.map((item, i) => (
                <li key={i} style={listItemStyle}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3>🎯 Suitable Roles</h3>
            <ul>
              {analysis.suitableRoles?.map((role, i) => (
                <li key={i} style={listItemStyle}>
                  {role}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {resumeText && (
        <div style={{ marginTop: "30px" }}>
          <h2>Extracted Resume Text</h2>

          <div
            style={{
              whiteSpace: "pre-wrap",
              border: "1px solid #ccc",
              padding: "20px",
              borderRadius: "8px",
              maxHeight: "500px",
              overflowY: "auto",
              background: "#f7f7f7",
            }}
          >
            {resumeText}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
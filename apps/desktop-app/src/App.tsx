import { useState, useEffect } from "react";

function App() {
  const [timeLeft, setTimeLeft] = useState(10800); // 3 hours

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="exam-container">
      <header className="exam-header">
        <div className="exam-title">JEE Main Mock Test</div>
        <div className="exam-timer">
          <strong>Time Left:</strong> {formatTime(timeLeft)}
        </div>
        <div className="student-info">John Doe (App: #12345)</div>
      </header>
      <div className="exam-body">
        <main className="question-area">
          <h2>Question 1</h2>
          <p>If the sum of the first n terms of an AP is cn^2, then the sum of squares of these n terms is:</p>
          <div style={{ marginTop: '20px' }}>
            <div><input type="radio" name="q1" id="opt1" /> <label htmlFor="opt1">Option A</label></div>
            <div><input type="radio" name="q1" id="opt2" /> <label htmlFor="opt2">Option B</label></div>
            <div><input type="radio" name="q1" id="opt3" /> <label htmlFor="opt3">Option C</label></div>
            <div><input type="radio" name="q1" id="opt4" /> <label htmlFor="opt4">Option D</label></div>
          </div>
        </main>
        <aside className="question-palette">
          <h3>Question Palette</h3>
          <div className="palette-grid">
            <div className="palette-btn answered">1</div>
            <div className="palette-btn unanswered">2</div>
            <div className="palette-btn review">3</div>
            <div className="palette-btn">4</div>
            <div className="palette-btn">5</div>
            <div className="palette-btn">6</div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span className="palette-btn answered" style={{ padding: '2px 10px' }}>&nbsp;</span> Answered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span className="palette-btn unanswered" style={{ padding: '2px 10px' }}>&nbsp;</span> Not Answered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span className="palette-btn review" style={{ padding: '2px 10px' }}>&nbsp;</span> Marked for Review</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;

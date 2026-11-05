import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../const';
import '../css/SameCategoryPickPrompt.css';

export default function SameCategoryPickPrompt({ userId }) {
  const [prompts, setPrompts] = useState([]);
  const [snoozed, setSnoozed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSnoozed(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!snoozed) return undefined;
    const timer = setTimeout(() => setSnoozed(false), 20000);
    return () => clearTimeout(timer);
  }, [snoozed]);

  useEffect(() => {
    if (!userId) return undefined;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS}/api/users/${userId}/trades-usage`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!stop) setPrompts(Array.isArray(data.pickPrompts) ? data.pickPrompts : []);
      } catch {
        if (!stop) setPrompts([]);
      }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [userId, location.pathname]);

  if (!userId || snoozed || prompts.length === 0) return null;

  return (
    <div className="pick-prompt-overlay">
      <div className="pick-prompt" role="dialog" aria-label="Pick required">
        <h2>Pick required</h2>
        {prompts.map((prompt) => (
          <p key={prompt.type}>{prompt.message}</p>
        ))}
        <div className="pick-prompt-actions">
          <button
            type="button"
            className="pick-prompt-go"
            onClick={() => {
              setSnoozed(true);
              navigate('/unsold');
            }}
          >
            Pick now
          </button>
          <button type="button" className="pick-prompt-close" onClick={() => setSnoozed(true)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

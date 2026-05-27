import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { FaCamera, FaCheckCircle, FaTimes, FaUpload } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import {
  buildFormFromParse,
  findMatchingFixture,
  fixtureMatchesOcrTeams,
  normalizeTeamKey,
  parseMatchSummaryOcr,
} from '../utils/fixtureOcrParser';
import '../css/FixtureOcr.css';

const SCORE_REGEX = /^\d+\/\d+$/;

const EMPTY_FORM = {
  winner: '',
  margin: '',
  team1Score: '',
  team2Score: '',
  team1Overs: '',
  team2Overs: '',
  mom: { name: '', score: '', wickets: '' },
  team1Fairness: '',
  team2Fairness: '',
};

const FixtureOcr = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState('');
  const [fixtures, setFixtures] = useState([]);
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [selectedFixtureId, setSelectedFixtureId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('match');
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastParsed, setLastParsed] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const isAdmin = !!user?.isAdmin;
  const userId = user?.id || user?._id || '';
  const userTeamName = user?.teamName || '';

  const isPendingFixture = (fx) => !fx?.winner;

  const fixtureBelongsToUser = useCallback(
    (fx) => {
      if (!fx) return false;
      if (userId) {
        const uid = String(userId);
        if (String(fx.team1UserId) === uid || String(fx.team2UserId) === uid) return true;
      }
      if (!userTeamName) return false;
      const mine = normalizeTeamKey(userTeamName);
      if (!mine) return false;
      return (
        mine === normalizeTeamKey(fx.team1 || '') || mine === normalizeTeamKey(fx.team2 || '')
      );
    },
    [userId, userTeamName]
  );

  const pendingFixtures = useMemo(
    () => fixtures.filter((fx) => isPendingFixture(fx) && fixtureBelongsToUser(fx)),
    [fixtures, fixtureBelongsToUser]
  );

  const selectedFixture = useMemo(
    () => fixtures.find((fx) => String(fx._id) === String(selectedFixtureId)),
    [fixtures, selectedFixtureId]
  );

  useEffect(() => {
    const load = async () => {
      setFixturesLoading(true);
      try {
        const res = await axios.get(`${API_ENDPOINTS}/api/fixtures`);
        setFixtures(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Fixture OCR: load fixtures failed', err);
      } finally {
        setFixturesLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const acceptFile = useCallback(
    (nextFile) => {
      if (!nextFile) return;
      if (!nextFile.type.startsWith('image/')) {
        setOcrError('Please choose a photo (PNG or JPG).');
        return;
      }
      if (nextFile.size > 10 * 1024 * 1024) {
        setOcrError('Image must be under 10 MB.');
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setOcrError('');
      setOcrStatus('ready');
    },
    [previewUrl]
  );

  const preprocessImage = useCallback(async (imageFile) => {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      const url = URL.createObjectURL(imageFile);
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(el);
      };
      el.onerror = reject;
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.filter = 'brightness(1.05) contrast(1.35) grayscale(1)';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Preprocess failed'))), 'image/png', 1);
    });
  }, []);

  const runOcr = useCallback(async () => {
    if (!file) {
      setOcrError('Upload a screenshot first.');
      return;
    }
    setOcrStatus('processing');
    setOcrProgress(0);
    setOcrError('');
    try {
      const source = await preprocessImage(file);
      const { data } = await Tesseract.recognize(source, 'eng', {
        tessedit_pageseg_mode: '6',
        logger: (msg) => {
          if (msg.status === 'recognizing text') {
            setOcrProgress(Math.round(msg.progress * 100));
          }
        },
      });
      const text = data?.text?.trim() || '';
      if (!text) throw new Error('Could not read text. Try a clearer photo.');

      const parsed = parseMatchSummaryOcr(text);
      setLastParsed(parsed);

      const matched = findMatchingFixture(pendingFixtures, parsed.team1Name, parsed.team2Name);
      if (matched) {
        setSelectedFixtureId(String(matched._id));
        setModalStep('review');
      } else {
        setSelectedFixtureId('');
        setModalStep('match');
      }

      const built = buildFormFromParse(parsed, matched || null);
      setForm(built);
      setFieldErrors({});
      setShowModal(true);
      setOcrStatus('done');
    } catch (err) {
      console.error('Fixture OCR failed', err);
      setOcrError(err.message || 'Could not read screenshot. Try again.');
      setOcrStatus('error');
    }
  }, [file, pendingFixtures, preprocessImage]);

  const updateForm = (key, value) => {
    setForm((prev) => {
      if (key === 'mom') return { ...prev, mom: { ...prev.mom, ...value } };
      return { ...prev, [key]: value };
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.momName;
      return next;
    });
  };

  const validate = () => {
    const errors = {};
    if (!selectedFixture) errors.fixture = 'Pick your match';
    if (!form.winner) errors.winner = 'Pick the winner';
    if (!form.margin?.trim()) errors.margin = 'Enter margin (e.g. 50 runs)';
    if (!form.team1Score?.trim()) errors.team1Score = 'Required';
    else if (!SCORE_REGEX.test(form.team1Score.trim())) errors.team1Score = 'Use e.g. 265/10';
    if (!form.team2Score?.trim()) errors.team2Score = 'Required';
    else if (!SCORE_REGEX.test(form.team2Score.trim())) errors.team2Score = 'Use e.g. 134/10';
    if (!form.team1Overs?.trim()) errors.team1Overs = 'Required';
    if (!form.team2Overs?.trim()) errors.team2Overs = 'Required';
    if (form.team1Fairness === '' || form.team1Fairness == null) errors.team1Fairness = 'Required';
    if (form.team2Fairness === '' || form.team2Fairness == null) errors.team2Fairness = 'Required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await axios.post(
        `${API_ENDPOINTS}/api/fixture-submissions/submit`,
        {
          fixtureId: selectedFixture._id,
          winner: form.winner,
          margin: form.margin.trim(),
          team1Score: form.team1Score.trim(),
          team2Score: form.team2Score.trim(),
          team1Overs: form.team1Overs.trim(),
          team2Overs: form.team2Overs.trim(),
          mom: {
            name: form.mom.name?.trim() || null,
            score: form.mom.score !== '' ? Number(form.mom.score) : null,
            wickets: form.mom.wickets !== '' ? Number(form.mom.wickets) : null,
          },
          team1Fairness: Number(form.team1Fairness),
          team2Fairness: Number(form.team2Fairness),
        },
        { headers: { 'user-id': userId } }
      );
      setToast({
        type: 'success',
        message: 'Submitted! Your opponent or admin will confirm before points update.',
      });
      setShowModal(false);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setOcrStatus('idle');
      setForm(EMPTY_FORM);
      setModalStep('match');
      const res = await axios.get(`${API_ENDPOINTS}/api/fixtures`);
      setFixtures(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Submit failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const ocrTeams = lastParsed
    ? { team1: lastParsed.team1Name, team2: lastParsed.team2Name }
    : null;

  const fixtureMismatch =
    selectedFixture &&
    ocrTeams?.team1 &&
    ocrTeams?.team2 &&
    !fixtureMatchesOcrTeams(selectedFixture, ocrTeams.team1, ocrTeams.team2);

  const selectFixture = (fixtureId) => {
    setSelectedFixtureId(fixtureId);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.fixture;
      return next;
    });
    if (!lastParsed) return;
    const fx = fixtures.find((f) => String(f._id) === String(fixtureId));
    const built = buildFormFromParse(lastParsed, fx || null);
    setForm((prev) => ({
      ...built,
      team1Fairness: prev.team1Fairness,
      team2Fairness: prev.team2Fairness,
    }));
  };

  const goToReview = () => {
    if (!selectedFixtureId) {
      setFieldErrors({ fixture: 'Pick your match first' });
      return;
    }
    setModalStep('review');
  };

  const resetUpload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setOcrStatus('idle');
    setOcrError('');
    setShowModal(false);
  };

  const mainStep = !file ? 1 : showModal ? (modalStep === 'match' ? 2 : 3) : 1;

  return (
    <div className="fixture-ocr-page">
      <div className="fixture-ocr-shell">
        <header className="fixture-ocr-header">
          <h1>Submit match result</h1>
          <p>Upload your Cricket 22/24 end-of-match screen. We fill in scores — you check and send.</p>
          <Link to="/fixture-confirmations" className="fixture-ocr-admin-link">
            {isAdmin ? 'Pending approvals →' : 'Opponent submitted? Confirm here →'}
          </Link>
        </header>

        <div className="fixture-ocr-steps" aria-label="Steps">
          <div className={`fixture-ocr-step${mainStep >= 1 ? ' is-active' : ''}${mainStep > 1 ? ' is-done' : ''}`}>
            <span className="fixture-ocr-step-num">1</span>
            <span>Upload</span>
          </div>
          <div className={`fixture-ocr-step${mainStep >= 2 ? ' is-active' : ''}${mainStep > 2 ? ' is-done' : ''}`}>
            <span className="fixture-ocr-step-num">2</span>
            <span>Pick match</span>
          </div>
          <div className={`fixture-ocr-step${mainStep >= 3 ? ' is-active' : ''}`}>
            <span className="fixture-ocr-step-num">3</span>
            <span>Submit</span>
          </div>
        </div>

        <div
          className={`fixture-ocr-upload${isDragOver ? ' is-dragover' : ''}${file ? ' has-file' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            acceptFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => acceptFile(e.target.files?.[0])}
            aria-label="Upload match screenshot"
          />
          <div className="fixture-ocr-upload-icon">
            <FaCamera aria-hidden />
          </div>
          <strong>{file ? 'Screenshot added' : 'Tap to add screenshot'}</strong>
          <span>Full match summary screen · PNG or JPG</span>
        </div>

        {previewUrl && (
          <div className="fixture-ocr-preview">
            <img src={previewUrl} alt="Your screenshot" />
          </div>
        )}

        {ocrStatus === 'processing' && (
          <>
            <div className="fixture-ocr-progress">
              <div className="fixture-ocr-progress-fill" style={{ width: `${ocrProgress}%` }} />
            </div>
            <p className="fixture-ocr-progress-label">Reading screenshot… {ocrProgress}%</p>
          </>
        )}

        {ocrError && <div className="fixture-ocr-error">{ocrError}</div>}

        <div className="fixture-ocr-actions">
          <button
            type="button"
            className="fixture-ocr-btn fixture-ocr-btn--primary"
            onClick={runOcr}
            disabled={!file || ocrStatus === 'processing'}
          >
            {ocrStatus === 'processing' ? 'Reading…' : 'Read screenshot & continue'}
          </button>
          {file && (
            <button type="button" className="fixture-ocr-btn fixture-ocr-btn--ghost" onClick={resetUpload}>
              Start over
            </button>
          )}
        </div>

        <div className="fixture-ocr-tip">
          <strong>Need:</strong> both team scores, overs, who won, and margin on screen.
          <br />
          <strong>You type:</strong> fairness for both teams (not on screenshot).
          <br />
          Player of the match is optional.
        </div>
      </div>

      {showModal && (
        <div
          className="fixture-ocr-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="fixture-ocr-modal">
            <div className="fixture-ocr-modal-handle" aria-hidden />
            <div className="fixture-ocr-modal-head">
              <h2>{modalStep === 'match' ? 'Which match was this?' : 'Check & submit'}</h2>
              <p>
                {modalStep === 'match'
                  ? 'Choose from your remaining fixtures.'
                  : 'Fix anything wrong, add fairness, then submit.'}
              </p>
              <button
                type="button"
                className="fixture-ocr-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="fixture-ocr-modal-body">
              {modalStep === 'match' && (
                <>
                  {ocrTeams?.team1 && ocrTeams?.team2 && (
                    <div className="fixture-ocr-simple-note">
                      Screenshot shows: <strong>{ocrTeams.team1} vs {ocrTeams.team2}</strong>
                    </div>
                  )}
                  {fixturesLoading ? (
                    <p className="fixture-ocr-simple-muted">Loading your matches…</p>
                  ) : pendingFixtures.length === 0 ? (
                    <p className="fixture-ocr-simple-muted">
                      No remaining matches for {userTeamName || 'your team'}.
                    </p>
                  ) : (
                    <ul className="fixture-ocr-match-list">
                      {pendingFixtures.map((fx) => (
                        <li key={fx._id}>
                          <button
                            type="button"
                            className={`fixture-ocr-match-card${
                              String(selectedFixtureId) === String(fx._id) ? ' is-selected' : ''
                            }`}
                            onClick={() => selectFixture(String(fx._id))}
                          >
                            <span className="fixture-ocr-match-card-teams">
                              {fx.team1} vs {fx.team2}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {fieldErrors.fixture && (
                    <p className="fixture-ocr-field-error">{fieldErrors.fixture}</p>
                  )}
                </>
              )}

              {modalStep === 'review' && selectedFixture && (
                <>
                  <div className="fixture-ocr-simple-note fixture-ocr-simple-note--match">
                    <button
                      type="button"
                      className="fixture-ocr-change-match"
                      onClick={() => setModalStep('match')}
                    >
                      Change match
                    </button>
                    <strong>
                      {selectedFixture.team1} vs {selectedFixture.team2}
                    </strong>
                  </div>

                  {fixtureMismatch && (
                    <div className="fixture-ocr-mismatch-warn">
                      Teams on screenshot may not match this fixture. Double-check scores.
                    </div>
                  )}

                  <div className="fixture-ocr-block">
                    <h3 className="fixture-ocr-block-title">Who won?</h3>
                    <div className="fixture-ocr-field-row">
                      <select
                        className={fieldErrors.winner ? 'has-error' : ''}
                        value={form.winner}
                        onChange={(e) => updateForm('winner', e.target.value)}
                      >
                        <option value="">Select winner</option>
                        <option value={selectedFixture.team1}>{selectedFixture.team1}</option>
                        <option value={selectedFixture.team2}>{selectedFixture.team2}</option>
                      </select>
                      <input
                        className={fieldErrors.margin ? 'has-error' : ''}
                        type="text"
                        placeholder="Margin (e.g. 131 runs)"
                        value={form.margin}
                        onChange={(e) => updateForm('margin', e.target.value)}
                      />
                    </div>
                    {(fieldErrors.winner || fieldErrors.margin) && (
                      <p className="fixture-ocr-field-error">
                        {fieldErrors.winner || fieldErrors.margin}
                      </p>
                    )}
                  </div>

                  <div className="fixture-ocr-block">
                    <h3 className="fixture-ocr-block-title">Scores</h3>
                    <div className="fixture-ocr-score-grid">
                      <div className="fixture-ocr-score-col">
                        <span className="fixture-ocr-score-team">{selectedFixture.team1}</span>
                        <input
                          className={fieldErrors.team1Score ? 'has-error' : ''}
                          placeholder="Runs/wkts 265/10"
                          value={form.team1Score}
                          onChange={(e) => updateForm('team1Score', e.target.value)}
                        />
                        <input
                          className={fieldErrors.team1Overs ? 'has-error' : ''}
                          placeholder="Overs 19.5"
                          value={form.team1Overs}
                          onChange={(e) => updateForm('team1Overs', e.target.value)}
                        />
                      </div>
                      <div className="fixture-ocr-score-col">
                        <span className="fixture-ocr-score-team">{selectedFixture.team2}</span>
                        <input
                          className={fieldErrors.team2Score ? 'has-error' : ''}
                          placeholder="Runs/wkts 134/10"
                          value={form.team2Score}
                          onChange={(e) => updateForm('team2Score', e.target.value)}
                        />
                        <input
                          className={fieldErrors.team2Overs ? 'has-error' : ''}
                          placeholder="Overs 16.0"
                          value={form.team2Overs}
                          onChange={(e) => updateForm('team2Overs', e.target.value)}
                        />
                      </div>
                    </div>
                    {(fieldErrors.team1Score ||
                      fieldErrors.team2Score ||
                      fieldErrors.team1Overs ||
                      fieldErrors.team2Overs) && (
                      <p className="fixture-ocr-field-error">Check score and overs format</p>
                    )}
                  </div>

                  <div className="fixture-ocr-block fixture-ocr-block--fairness">
                    <h3 className="fixture-ocr-block-title">Fairness (you enter this)</h3>
                    <div className="fixture-ocr-score-grid">
                      <div className="fixture-ocr-score-col">
                        <span className="fixture-ocr-score-team">{selectedFixture.team1}</span>
                        <input
                          type="number"
                          step="0.01"
                          className={fieldErrors.team1Fairness ? 'has-error' : ''}
                          placeholder="Fairness"
                          value={form.team1Fairness}
                          onChange={(e) => updateForm('team1Fairness', e.target.value)}
                        />
                      </div>
                      <div className="fixture-ocr-score-col">
                        <span className="fixture-ocr-score-team">{selectedFixture.team2}</span>
                        <input
                          type="number"
                          step="0.01"
                          className={fieldErrors.team2Fairness ? 'has-error' : ''}
                          placeholder="Fairness"
                          value={form.team2Fairness}
                          onChange={(e) => updateForm('team2Fairness', e.target.value)}
                        />
                      </div>
                    </div>
                    {(fieldErrors.team1Fairness || fieldErrors.team2Fairness) && (
                      <p className="fixture-ocr-field-error">Enter fairness for both teams</p>
                    )}
                  </div>

                  <details className="fixture-ocr-optional">
                    <summary>Player of the match (optional)</summary>
                    <input
                      type="text"
                      placeholder="Player name"
                      value={form.mom.name}
                      onChange={(e) => updateForm('mom', { name: e.target.value })}
                    />
                    <div className="fixture-ocr-field-row">
                      <input
                        type="number"
                        placeholder="Runs"
                        value={form.mom.score}
                        onChange={(e) => updateForm('mom', { score: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Wickets"
                        value={form.mom.wickets}
                        onChange={(e) => updateForm('mom', { wickets: e.target.value })}
                      />
                    </div>
                  </details>
                </>
              )}
            </div>

            <div className="fixture-ocr-modal-foot">
              {modalStep === 'match' ? (
                <button
                  type="button"
                  className="fixture-ocr-btn fixture-ocr-btn--primary"
                  onClick={goToReview}
                  disabled={!pendingFixtures.length}
                >
                  Next — check details
                </button>
              ) : (
                <>
                  <p className="fixture-ocr-foot-note">
                    Opponent or admin must confirm before points table updates.
                  </p>
                  <button
                    type="button"
                    className="fixture-ocr-btn fixture-ocr-btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Sending…' : (
                      <>
                        <FaCheckCircle aria-hidden /> Send for confirmation
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                type="button"
                className="fixture-ocr-btn fixture-ocr-btn--ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixture-ocr-toast fixture-ocr-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default FixtureOcr;

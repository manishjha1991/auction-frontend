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
  fieldConfidence: {},
};

const hintForField = (confidence, key) => {
  const c = confidence?.[key];
  if (c === 'high') return { class: 'ocr', label: 'From screenshot' };
  if (c === 'low') return { class: 'review', label: 'Check this' };
  if (c === 'manual') return { class: 'manual', label: 'Enter manually' };
  if (c === 'missing') return { class: 'missing', label: 'Not detected' };
  return null;
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastParsed, setLastParsed] = useState(null);
  const [fixtureSearch, setFixtureSearch] = useState('');

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

  const filteredFixtures = useMemo(() => {
    if (!fixtureSearch.trim()) return pendingFixtures;
    const term = fixtureSearch.trim().toLowerCase();
    const words = term.split(/\s+/).filter(Boolean);
    return pendingFixtures.filter((fx) => {
      const t1 = (fx.team1 || '').toLowerCase();
      const t2 = (fx.team2 || '').toLowerCase();
      if (t1.includes(term) || t2.includes(term)) return true;
      if (`${t1} vs ${t2}`.includes(term)) return true;
      if (words.length > 1) {
        return words.every((w) => t1.includes(w) || t2.includes(w));
      }
      return false;
    });
  }, [pendingFixtures, fixtureSearch]);

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

  const playerOptions = useMemo(() => {
    if (!selectedFixture) return [];
    const all = [
      ...(selectedFixture.team1Details?.players || []),
      ...(selectedFixture.team2Details?.players || []),
    ];
    const unique = Array.from(new Map(all.map((p) => [p.name || p._id, p])).values());
    return unique.map((p) => ({ value: p.name, label: p.name }));
  }, [selectedFixture]);

  const acceptFile = useCallback(
    (nextFile) => {
      if (!nextFile) return;
      if (!nextFile.type.startsWith('image/')) {
        setOcrError('Please upload an image file (PNG, JPG, etc.).');
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
      setOcrError('Select a match summary screenshot first.');
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
      if (!text) throw new Error('No text found in the image. Try a clearer screenshot.');

      const parsed = parseMatchSummaryOcr(text);
      setLastParsed(parsed);

      const ocrSearch = [parsed.team1Name, parsed.team2Name].filter(Boolean).join(' ');
      setFixtureSearch(ocrSearch);

      const matched = findMatchingFixture(pendingFixtures, parsed.team1Name, parsed.team2Name);
      if (matched) {
        setSelectedFixtureId(String(matched._id));
      } else {
        setSelectedFixtureId('');
      }

      const built = buildFormFromParse(parsed, matched || null);
      setForm(built);
      setFieldErrors({});
      setShowModal(true);
      setOcrStatus('done');
    } catch (err) {
      console.error('Fixture OCR failed', err);
      setOcrError(err.message || 'OCR failed. Try a clearer screenshot.');
      setOcrStatus('error');
    }
  }, [file, fixtures, pendingFixtures, preprocessImage]);

  const updateForm = (key, value) => {
    setForm((prev) => {
      if (key === 'mom') return { ...prev, mom: { ...prev.mom, ...value } };
      return { ...prev, [key]: value };
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const errors = {};
    if (!selectedFixture) errors.fixture = 'Select a fixture';
    if (!form.winner) errors.winner = 'Winner is required';
    if (!form.margin?.trim()) errors.margin = 'Margin is required';
    if (!form.team1Score?.trim()) errors.team1Score = 'Team 1 score is required';
    else if (!SCORE_REGEX.test(form.team1Score.trim())) {
      errors.team1Score = 'Use runs/wickets format (e.g. 265/10)';
    }
    if (!form.team2Score?.trim()) errors.team2Score = 'Team 2 score is required';
    else if (!SCORE_REGEX.test(form.team2Score.trim())) {
      errors.team2Score = 'Use runs/wickets format (e.g. 134/10)';
    }
    if (!form.team1Overs?.trim()) errors.team1Overs = 'Team 1 overs required';
    if (!form.team2Overs?.trim()) errors.team2Overs = 'Team 2 overs required';
    if (!form.mom?.name?.trim()) errors.momName = 'Man of the Match is required';
    if (form.team1Fairness === '' || form.team1Fairness == null) {
      errors.team1Fairness = 'Fairness is required';
    }
    if (form.team2Fairness === '' || form.team2Fairness == null) {
      errors.team2Fairness = 'Fairness is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const submissionBody = {
        fixtureId: selectedFixture._id,
        winner: form.winner,
        margin: form.margin.trim(),
        team1Score: form.team1Score.trim(),
        team2Score: form.team2Score.trim(),
        team1Overs: form.team1Overs.trim(),
        team2Overs: form.team2Overs.trim(),
        mom: {
          name: form.mom.name.trim(),
          score: form.mom.score !== '' ? Number(form.mom.score) : null,
          wickets: form.mom.wickets !== '' ? Number(form.mom.wickets) : null,
        },
        team1Fairness: Number(form.team1Fairness),
        team2Fairness: Number(form.team2Fairness),
      };

      await axios.post(`${API_ENDPOINTS}/api/fixture-submissions/submit`, submissionBody, {
        headers: { 'user-id': userId },
      });
      const submitterLabel = user?.name || user?.teamName || 'You';
      setToast({
        type: 'success',
        message: `Submitted as ${submitterLabel}${user?.teamName ? ` (${user.teamName})` : ''}. Waiting for opponent or admin to confirm.`,
      });

      setShowModal(false);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setOcrStatus('idle');
      setForm(EMPTY_FORM);

      const res = await axios.get(`${API_ENDPOINTS}/api/fixtures`);
      setFixtures(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to save.',
      });
    } finally {
      setSaving(false);
    }
  };

  const ocrTeams =
    form.ocrTeams?.team1 || form.ocrTeams?.team2
      ? form.ocrTeams
      : lastParsed
      ? { team1: lastParsed.team1Name, team2: lastParsed.team2Name }
      : null;

  const fixtureMismatch =
    selectedFixture &&
    ocrTeams?.team1 &&
    ocrTeams?.team2 &&
    !fixtureMatchesOcrTeams(selectedFixture, ocrTeams.team1, ocrTeams.team2);

  const handleFixtureChange = (fixtureId) => {
    setSelectedFixtureId(fixtureId);
    if (!lastParsed) return;
    const fx = fixtures.find((f) => String(f._id) === String(fixtureId));
    const built = buildFormFromParse(lastParsed, fx || null);
    setForm((prev) => ({
      ...built,
      team1Fairness: prev.team1Fairness,
      team2Fairness: prev.team2Fairness,
    }));
  };

  useEffect(() => {
    if (!showModal || !lastParsed || !selectedFixture) return;
    if (!fixtureMatchesOcrTeams(selectedFixture, lastParsed.team1Name, lastParsed.team2Name)) {
      return;
    }
    const built = buildFormFromParse(lastParsed, selectedFixture);
    setForm((prev) => ({
      ...built,
      team1Fairness: prev.team1Fairness,
      team2Fairness: prev.team2Fairness,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFixtureId, showModal]);

  const renderFieldHint = (key) => {
    const hint = hintForField(form.fieldConfidence, key);
    if (!hint) return null;
    return (
      <span className={`fixture-ocr-field-hint fixture-ocr-field-hint--${hint.class}`}>
        {hint.label}
      </span>
    );
  };

  const fieldClass = (key) => {
    const c = form.fieldConfidence?.[key];
    if (fieldErrors[key]) return 'fixture-ocr-field--error';
    if (c === 'high') return 'fixture-ocr-field--ocr';
    if (c === 'low' || c === 'missing') return 'fixture-ocr-field--review';
    return '';
  };

  return (
    <div className="fixture-ocr-page">
      <div className="fixture-ocr-shell">
        <header className="fixture-ocr-header">
          <h1>Fixture Result OCR</h1>
          <p>
            Upload the end-of-match summary screenshot from Cricket 22/24. We&apos;ll read scores,
            overs, winner and MoM — you review, enter fairness, then submit for opponent or admin
            confirmation.
          </p>
          <span className="fixture-ocr-badge">
            <FaCamera aria-hidden /> Match summary screen
          </span>
          <Link to="/fixture-confirmations" className="fixture-ocr-admin-link">
            {isAdmin ? 'Review pending submissions →' : 'Confirm opponent results →'}
          </Link>
        </header>

        <div
          className={`fixture-ocr-upload${isDragOver ? ' is-dragover' : ''}`}
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
            aria-label="Upload match summary screenshot"
          />
          <div className="fixture-ocr-upload-icon">
            <FaUpload aria-hidden />
          </div>
          <strong>Drop screenshot here</strong>
          <span>or tap to browse · PNG / JPG · max 10 MB</span>
        </div>

        {previewUrl && (
          <div className="fixture-ocr-preview">
            <img src={previewUrl} alt="Match summary preview" />
          </div>
        )}

        {ocrStatus === 'processing' && (
          <>
            <div className="fixture-ocr-progress">
              <div className="fixture-ocr-progress-fill" style={{ width: `${ocrProgress}%` }} />
            </div>
            <p className="fixture-ocr-progress-label">Reading scorecard… {ocrProgress}%</p>
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
            {ocrStatus === 'processing' ? 'Extracting…' : 'Extract & Review'}
          </button>
          {file && (
            <button
              type="button"
              className="fixture-ocr-btn fixture-ocr-btn--ghost"
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setFile(null);
                setPreviewUrl('');
                setOcrStatus('idle');
                setOcrError('');
              }}
            >
              Clear image
            </button>
          )}
        </div>

        <div className="fixture-ocr-tip">
          <strong>Tip:</strong> Use the full post-match screen showing both teams&apos; totals, overs,
          &ldquo;Player of the Match&rdquo;, and the result line (e.g. &ldquo;BL WON BY 131 RUNS&rdquo;).
          Wickets may need a quick check — fairness is always entered by hand.
        </div>
      </div>

      {showModal && (
        <div
          className="fixture-ocr-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fixture-ocr-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="fixture-ocr-modal">
            <div className="fixture-ocr-modal-handle" aria-hidden />
            <div className="fixture-ocr-modal-head">
              <h2 id="fixture-ocr-modal-title">Review fixture result</h2>
              <p>Fields marked in yellow need a quick check. Fairness is manual.</p>
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
              {ocrTeams?.team1 && ocrTeams?.team2 && (
                <div className="fixture-ocr-detected-banner">
                  <span className="fixture-ocr-detected-label">Read from screenshot</span>
                  <strong>
                    {ocrTeams.team1} vs {ocrTeams.team2}
                  </strong>
                </div>
              )}

              {fixtureMismatch && (
                <div className="fixture-ocr-mismatch-warn">
                  Selected fixture does not match the screenshot teams. Pick the correct fixture
                  below — scores are mapped to the wrong teams until you do.
                </div>
              )}

              {!selectedFixtureId && ocrTeams?.team1 && ocrTeams?.team2 && (
                <div className="fixture-ocr-mismatch-warn">
                  No matching fixture found automatically. Select{' '}
                  <strong>
                    {ocrTeams.team1} vs {ocrTeams.team2}
                  </strong>{' '}
                  from the list.
                </div>
              )}

              <div className={`fixture-ocr-field ${fieldErrors.fixture || fixtureMismatch ? 'fixture-ocr-field--error' : ''}`}>
                <label>
                  Fixture <span className="fixture-ocr-required">*</span>
                  <span className="fixture-ocr-field-hint fixture-ocr-field-hint--manual">
                    Your pending · {filteredFixtures.length} shown
                  </span>
                </label>
                <input
                  type="search"
                  className="fixture-ocr-fixture-search"
                  placeholder="Search by team name…"
                  value={fixtureSearch}
                  onChange={(e) => setFixtureSearch(e.target.value)}
                  aria-label="Search fixtures by team name"
                />
                <select
                  value={selectedFixtureId}
                  onChange={(e) => handleFixtureChange(e.target.value)}
                  disabled={fixturesLoading}
                >
                  <option value="">
                    {filteredFixtures.length
                      ? 'Select fixture…'
                      : userTeamName
                        ? `No remaining matches for ${userTeamName}`
                        : 'No pending fixtures match search'}
                  </option>
                  {filteredFixtures.map((fx) => (
                    <option key={fx._id} value={fx._id}>
                      {fx.team1} vs {fx.team2}
                    </option>
                  ))}
                </select>
                {fixtureSearch.trim() && filteredFixtures.length === 0 && (
                  <span className="fixture-ocr-field-error">
                    No remaining matches for &ldquo;{fixtureSearch.trim()}&rdquo;. Try another team
                    name or clear search.
                  </span>
                )}
                {!fixtureSearch.trim() && filteredFixtures.length === 0 && userTeamName && (
                  <span className="fixture-ocr-field-error">
                    You have no remaining matches to update.
                  </span>
                )}
                {fieldErrors.fixture && (
                  <span className="fixture-ocr-field-error">{fieldErrors.fixture}</span>
                )}
              </div>

              {selectedFixture && (
                <div className="fixture-ocr-match-banner">
                  {selectedFixture.team1} vs {selectedFixture.team2}
                </div>
              )}

              <div className={`fixture-ocr-field ${fieldClass('winner')}`}>
                <label>
                  Winner <span className="fixture-ocr-required">*</span>
                  {renderFieldHint('winner')}
                </label>
                <select
                  value={form.winner}
                  onChange={(e) => updateForm('winner', e.target.value)}
                  disabled={!selectedFixture}
                >
                  <option value="">Select winner…</option>
                  {selectedFixture && (
                    <>
                      <option value={selectedFixture.team1}>{selectedFixture.team1}</option>
                      <option value={selectedFixture.team2}>{selectedFixture.team2}</option>
                    </>
                  )}
                </select>
                {fieldErrors.winner && (
                  <span className="fixture-ocr-field-error">{fieldErrors.winner}</span>
                )}
              </div>

              <div className={`fixture-ocr-field ${fieldClass('margin')}`}>
                <label>
                  Margin <span className="fixture-ocr-required">*</span>
                  {renderFieldHint('margin')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 131 runs"
                  value={form.margin}
                  onChange={(e) => updateForm('margin', e.target.value)}
                />
                {fieldErrors.margin && (
                  <span className="fixture-ocr-field-error">{fieldErrors.margin}</span>
                )}
              </div>

              <div className="fixture-ocr-section">
                <div className="fixture-ocr-section-title">Scores & overs</div>
                <div className="fixture-ocr-grid-2">
                  <div className={`fixture-ocr-field ${fieldClass('team1Score')}`}>
                    <label>
                      {selectedFixture?.team1 || 'Team 1'} score{' '}
                      <span className="fixture-ocr-required">*</span>
                      {renderFieldHint('team1Score')}
                    </label>
                    <input
                      type="text"
                      placeholder="265/10"
                      value={form.team1Score}
                      onChange={(e) => updateForm('team1Score', e.target.value)}
                    />
                    {fieldErrors.team1Score && (
                      <span className="fixture-ocr-field-error">{fieldErrors.team1Score}</span>
                    )}
                  </div>
                  <div className={`fixture-ocr-field ${fieldClass('team2Score')}`}>
                    <label>
                      {selectedFixture?.team2 || 'Team 2'} score{' '}
                      <span className="fixture-ocr-required">*</span>
                      {renderFieldHint('team2Score')}
                    </label>
                    <input
                      type="text"
                      placeholder="134/10"
                      value={form.team2Score}
                      onChange={(e) => updateForm('team2Score', e.target.value)}
                    />
                    {fieldErrors.team2Score && (
                      <span className="fixture-ocr-field-error">{fieldErrors.team2Score}</span>
                    )}
                  </div>
                  <div className={`fixture-ocr-field ${fieldClass('team1Overs')}`}>
                    <label>
                      {selectedFixture?.team1 || 'Team 1'} overs{' '}
                      <span className="fixture-ocr-required">*</span>
                      {renderFieldHint('team1Overs')}
                    </label>
                    <input
                      type="text"
                      placeholder="19.5"
                      value={form.team1Overs}
                      onChange={(e) => updateForm('team1Overs', e.target.value)}
                    />
                    {fieldErrors.team1Overs && (
                      <span className="fixture-ocr-field-error">{fieldErrors.team1Overs}</span>
                    )}
                  </div>
                  <div className={`fixture-ocr-field ${fieldClass('team2Overs')}`}>
                    <label>
                      {selectedFixture?.team2 || 'Team 2'} overs{' '}
                      <span className="fixture-ocr-required">*</span>
                      {renderFieldHint('team2Overs')}
                    </label>
                    <input
                      type="text"
                      placeholder="16.0"
                      value={form.team2Overs}
                      onChange={(e) => updateForm('team2Overs', e.target.value)}
                    />
                    {fieldErrors.team2Overs && (
                      <span className="fixture-ocr-field-error">{fieldErrors.team2Overs}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="fixture-ocr-section">
                <div className="fixture-ocr-section-title">Man of the Match</div>
                <div className={`fixture-ocr-field ${fieldClass('momName')}`}>
                  <label>
                    Player name <span className="fixture-ocr-required">*</span>
                    {renderFieldHint('momName')}
                  </label>
                  <input
                    type="text"
                    list="fixture-ocr-mom-list"
                    placeholder="e.g. Laurie Evans"
                    value={form.mom.name}
                    onChange={(e) => updateForm('mom', { name: e.target.value })}
                  />
                  <datalist id="fixture-ocr-mom-list">
                    {playerOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} />
                    ))}
                  </datalist>
                  {fieldErrors.momName && (
                    <span className="fixture-ocr-field-error">{fieldErrors.momName}</span>
                  )}
                </div>
                <div className="fixture-ocr-grid-2">
                  <div className={`fixture-ocr-field ${fieldClass('momScore')}`}>
                    <label>
                      MoM runs (optional)
                      {renderFieldHint('momScore')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="107"
                      value={form.mom.score}
                      onChange={(e) => updateForm('mom', { score: e.target.value })}
                    />
                  </div>
                  <div className={`fixture-ocr-field ${fieldClass('momWickets')}`}>
                    <label>
                      MoM wickets (optional)
                      {renderFieldHint('momWickets')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="2"
                      value={form.mom.wickets}
                      onChange={(e) => updateForm('mom', { wickets: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="fixture-ocr-section">
                <div className="fixture-ocr-section-title">Fairness (manual)</div>
                <div className="fixture-ocr-grid-2">
                  <div className={`fixture-ocr-field ${fieldErrors.team1Fairness ? 'fixture-ocr-field--error' : ''}`}>
                    <label>
                      {selectedFixture?.team1 || 'Team 1'} fairness{' '}
                      <span className="fixture-ocr-required">*</span>
                      {renderFieldHint('team1Fairness')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter fairness"
                      value={form.team1Fairness}
                      onChange={(e) => updateForm('team1Fairness', e.target.value)}
                    />
                    {fieldErrors.team1Fairness && (
                      <span className="fixture-ocr-field-error">{fieldErrors.team1Fairness}</span>
                    )}
                  </div>
                  <div className={`fixture-ocr-field ${fieldErrors.team2Fairness ? 'fixture-ocr-field--error' : ''}`}>
                    <label>
                      {selectedFixture?.team2 || 'Team 2'} fairness{' '}
                      <span className="fixture-ocr-required">*</span>
                      {renderFieldHint('team2Fairness')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter fairness"
                      value={form.team2Fairness}
                      onChange={(e) => updateForm('team2Fairness', e.target.value)}
                    />
                    {fieldErrors.team2Fairness && (
                      <span className="fixture-ocr-field-error">{fieldErrors.team2Fairness}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="fixture-ocr-modal-foot">
              <p className="fixture-ocr-admin-note">
                Your name and team will be sent with this submission. Your opponent or an admin must
                confirm before the points table updates.
              </p>
              {(user?.name || user?.teamName) && (
                <p className="fixture-ocr-submitter-preview">
                  Submitting as <strong>{user?.name || 'User'}</strong>
                  {user?.teamName ? (
                    <>
                      {' '}
                      · <strong>{user.teamName}</strong>
                    </>
                  ) : null}
                </p>
              )}
              <button
                type="button"
                className="fixture-ocr-btn fixture-ocr-btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Submitting…' : (
                  <>
                    <FaCheckCircle aria-hidden /> Submit for confirmation
                  </>
                )}
              </button>
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

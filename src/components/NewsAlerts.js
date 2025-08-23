import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'react-lottie-player';
import announcementAnimation from './animations/Announcment.json';
import hittingSixAnimation from './animations/HittingSix.json';
import '../css/NewsAlerts.css';
import { API_ENDPOINTS } from '../const';
import { FaExchangeAlt, FaHandHolding, FaUnlockAlt, FaStar, FaTrophy, FaTimesCircle, FaCheckCircle, FaHeart, FaComment, FaShare, FaEllipsisH, FaReply, FaEdit, FaTrash, FaSmile, FaRegHeart, FaRegComment, FaTimes } from 'react-icons/fa';

function NewsAlerts() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | trade | pick | release | stats | fixture
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [editingComments, setEditingComments] = useState({});
  const [showLikeReactions, setShowLikeReactions] = useState({});

  // Get current user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  async function loadFeed() {
    try {
      setLoading(true);
      setProgress(0);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      // Fallback progress animation to 90% when content length isn't available
      progressTimerRef.current = setInterval(() => {
        setProgress((p) => (p < 90 ? Math.min(90, p + 2) : p));
      }, 120);
      const res = await fetch(`${API_ENDPOINTS}/api/news/feed`);
      const contentLengthHeader = res.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;

      if (res.body && (totalBytes || typeof ReadableStream !== 'undefined')) {
        const reader = res.body.getReader();
        const chunks = [];
        let receivedBytes = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes) {
            const pct = Math.round((receivedBytes / totalBytes) * 100);
            setProgress(Math.max(10, Math.min(99, pct)));
          }
        }
        const blob = new Blob(chunks, { type: 'application/json' });
        const text = await blob.text();
        const j = JSON.parse(text || '{}');
        const newsItems = j.items || [];
        
        // Add unique IDs to news items if they don't have them
        const itemsWithIds = newsItems.map((item, index) => {
          console.log('News item:', item);
          console.log('News item ID:', item.id);
          console.log('News item _id:', item._id);
          return {
            ...item,
            // Use the id from backend if available, otherwise fallback to generated ID
            uniqueId: item.id || `news_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        });
        
        console.log('News items with IDs:', itemsWithIds);
        setFeed(itemsWithIds);
      } else {
        const j = await res.json();
        const newsItems = j.items || [];
        
        // Add unique IDs to news items if they don't have them
        const itemsWithIds = newsItems.map((item, index) => {
          console.log('News item (fallback):', item);
          console.log('News item ID (fallback):', item.id);
          console.log('News item _id (fallback):', item._id);
          return {
            ...item,
            // Use the id from backend if available, otherwise fallback to generated ID
            uniqueId: item.id || `news_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        });
        
        console.log('News items with IDs (fallback):', itemsWithIds);
        setFeed(itemsWithIds);
      }
    } catch (e) {
      setToast('Failed to load news');
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      // Smoothly complete to 100%
      setProgress(100);
      setLoading(false);
    }
  }

  // Social interaction functions
  const handleLike = async (newsId, likeType = 'like') => {
    if (!currentUser) {
      setToast('Please login to like posts');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS}/api/post-likes/news/${newsId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': currentUser.id
        },
        body: JSON.stringify({ likeType })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Like response:', result); // Debug log
        
        // Update local state with new like data
        setFeed(prevFeed => 
          prevFeed.map(item => {
            if (item.uniqueId === newsId) {
              if (result.action === 'unliked') {
                // Remove like
                const updatedLikes = item.likes.filter(like => like.userId !== currentUser.id);
                const oldType = item.likes.find(like => like.userId === currentUser.id)?.likeType;
                return {
                  ...item,
                  likes: updatedLikes,
                  likeCount: updatedLikes.length,
                  likeCounts: {
                    ...item.likeCounts,
                    [oldType]: Math.max(0, (item.likeCounts[oldType] || 0) - 1)
                  }
                };
              } else if (result.action === 'liked') {
                // Add new like
                const newLike = {
                  _id: Date.now().toString(), // Temporary ID
                  newsId: newsId,
                  userId: currentUser.id,
                  userName: currentUser.name,
                  likeType: likeType,
                  createdAt: new Date()
                };
                return {
                  ...item,
                  likes: [...item.likes, newLike],
                  likeCount: (item.likeCount || 0) + 1,
                  likeCounts: {
                    ...item.likeCounts,
                    [likeType]: (item.likeCounts[likeType] || 0) + 1
                  }
                };
              } else if (result.action === 'changed') {
                // Change like type
                const updatedLikes = item.likes.map(like => 
                  like.userId === currentUser.id 
                    ? { ...like, likeType: likeType }
                    : like
                );
                const oldType = item.likes.find(like => like.userId === currentUser.id)?.likeType;
                return {
                  ...item,
                  likes: updatedLikes,
                  likeCounts: {
                    ...item.likeCounts,
                    [oldType]: Math.max(0, (item.likeCounts[oldType] || 0) - 1),
                    [likeType]: (item.likeCounts[likeType] || 0) + 1
                  }
                };
              }
            }
            return item;
          })
        );
        
        // Don't show toast for like/unlike actions
        
        // Refresh like data to ensure we have the latest counts
        setTimeout(() => {
          refreshLikeData(newsId);
        }, 100);
      } else {
        setToast('Failed to like post');
      }
    } catch (error) {
      setToast('Failed to like post');
    }
  };

  const refreshLikeData = async (newsId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/post-likes/news/${newsId}`);
      if (response.ok) {
        const likeData = await response.json();
        console.log('Refreshed like data:', likeData);
        
        setFeed(prevFeed => 
          prevFeed.map(item => {
            if (item.uniqueId === newsId) {
              return {
                ...item,
                likes: likeData.likes || [],
                likeCounts: likeData.likeCounts || {},
                likeCount: likeData.total || 0
              };
            }
            return item;
          })
        );
      }
    } catch (error) {
      console.error('Failed to refresh like data:', error);
    }
  };

  const handleComment = async (newsId, content, parentCommentId = null) => {
    if (!currentUser) {
      setToast('Please login to comment');
      return;
    }

    if (!content.trim()) {
      setToast('Comment cannot be empty');
      return;
    }

    console.log('Attempting to add comment:', { newsId, content, parentCommentId, currentUser });

    if (!newsId) {
      setToast('Invalid news ID');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS}/api/comments/news/${newsId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': currentUser.id
        },
        body: JSON.stringify({ content: content.trim(), parentCommentId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend response for comment/reply:', result);
        
        // Clear input
        if (parentCommentId) {
          setReplyInputs(prev => ({ ...prev, [parentCommentId]: '' }));
        } else {
          setCommentInputs(prev => ({ ...prev, [newsId]: '' }));
        }
        
        // Update local state with new comment or reply
        if (result.comment || result.reply) {
          setFeed(prevFeed => 
            prevFeed.map(item => {
              if (item.uniqueId === newsId) {
                if (parentCommentId) {
                  // This is a reply - update the parent comment
                  const replyData = result.reply || result.comment;
                  const updatedComments = item.comments.map(comment => {
                    if (comment._id === parentCommentId) {
                      // Create a proper reply object with all needed fields
                      const newReply = {
                        _id: replyData._id || Date.now().toString(),
                        userId: {
                          _id: currentUser.id,
                          name: currentUser.name,
                          avatar: currentUser.avatar
                        },
                        userName: currentUser.name,
                        content: replyData.content,
                        likes: replyData.likes || [],
                        createdAt: replyData.createdAt || new Date()
                      };
                      
                      console.log('Adding new reply:', newReply);
                      
                      return {
                        ...comment,
                        replies: [...(comment.replies || []), newReply]
                      };
                    }
                    return comment;
                  });
                  
                  console.log('Updated comments with reply:', updatedComments);
                  
                  return {
                    ...item,
                    comments: updatedComments,
                    commentCount: (item.commentCount || 0) + 1
                  };
                } else {
                  // This is a new comment
                  return {
                    ...item,
                    comments: [...(item.comments || []), result.comment],
                    commentCount: (item.commentCount || 0) + 1
                  };
                }
              }
              return item;
            })
          );
        }
        
        if (parentCommentId) {
          setToast('Reply added successfully');
        } else {
          setToast('Comment added successfully');
        }
      } else {
        const errorData = await response.json();
        console.error('Comment API error:', errorData);
        setToast(`Failed to add comment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Comment error:', error);
      setToast('Failed to add comment');
    }
  };

  const handleEditComment = async (commentId, content) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_ENDPOINTS}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': currentUser.id
        },
        body: JSON.stringify({ content: content.trim() })
      });

      if (response.ok) {
        setEditingComments(prev => ({ ...prev, [commentId]: false }));
        // Update local state instead of refreshing
        setFeed(prevFeed => 
          prevFeed.map(item => {
            if (item.comments) {
              return {
                ...item,
                comments: item.comments.map(comment => 
                  comment._id === commentId 
                    ? { ...comment, content: content.trim(), isEdited: true, editedAt: new Date() }
                    : comment
                )
              };
            }
            return item;
          })
        );
        setToast('Comment updated successfully');
      } else {
        setToast('Failed to update comment');
      }
    } catch (error) {
      setToast('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;

    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`${API_ENDPOINTS}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'user-id': currentUser.id
        }
      });

      if (response.ok) {
        // Update local state instead of refreshing
        setFeed(prevFeed => 
          prevFeed.map(item => {
            if (item.comments) {
              return {
                ...item,
                comments: item.comments.filter(comment => comment._id !== commentId)
              };
            }
            return item;
          })
        );
        setToast('Comment deleted successfully');
      } else {
        setToast('Failed to delete comment');
      }
    } catch (error) {
      setToast('Failed to delete comment');
    }
  };

  const handleCommentLike = async (commentId, isReply = false, replyIndex = null) => {
    if (!currentUser) {
      setToast('Please login to like comments');
      return;
    }

    try {
      let url = `${API_ENDPOINTS}/api/comments/${commentId}/like`;
      if (isReply && replyIndex !== null) {
        url = `${API_ENDPOINTS}/api/comments/${commentId}/replies/${replyIndex}/like`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'user-id': currentUser.id
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state instead of refreshing
        setFeed(prevFeed => 
          prevFeed.map(item => {
            if (item.comments) {
              return {
                ...item,
                comments: item.comments.map(comment => {
                  if (comment._id === commentId) {
                    if (isReply && replyIndex !== null) {
                      // Update reply like
                      const updatedReplies = [...comment.replies];
                      if (updatedReplies[replyIndex]) {
                        updatedReplies[replyIndex] = {
                          ...updatedReplies[replyIndex],
                          likes: result.isLiked 
                            ? [...(updatedReplies[replyIndex].likes || []), currentUser.id]
                            : (updatedReplies[replyIndex].likes || []).filter(id => id !== currentUser.id)
                        }
                      };
                      return { ...comment, replies: updatedReplies };
                    } else {
                      // Update comment like
                      return {
                        ...comment,
                        likes: result.isLiked 
                          ? [...(comment.likes || []), currentUser.id]
                          : (comment.likes || []).filter(id => id !== currentUser.id)
                      };
                    }
                  }
                  return comment;
                })
              };
            }
            return item;
          })
        );
      } else {
        setToast('Failed to like comment');
      }
    } catch (error) {
      setToast('Failed to like comment');
    }
  };

  const toggleComments = (newsId) => {
    setExpandedComments(prev => ({
      ...prev,
      [newsId]: !prev[newsId]
    }));
  };

  const toggleLikeReactions = (newsId) => {
    setShowLikeReactions(prev => ({
      ...prev,
      [newsId]: !prev[newsId]
    }));
  };

  const toggleLikeDetails = (newsId) => {
    setFeed(prevFeed => 
      prevFeed.map(item => {
        if (item.uniqueId === newsId) {
          return {
            ...item,
            showLikeDetails: !item.showLikeDetails
          };
        }
        return item;
      })
    );
  };

  useEffect(() => { loadFeed(); }, []);

  useEffect(() => () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (feed || []).filter((n) => {
      const typeMatch = filter === 'all' ? true : n.kind === filter;
      const text = `${n.title || ''} ${n.body || ''}`.toLowerCase();
      const qMatch = !q || text.includes(q);
      return typeMatch && qMatch;
    });
  }, [feed, filter, query]);

  const kindIcon = (kind) => {
    switch (kind) {
      case 'trade': return <FaExchangeAlt />;
      case 'pick': return <FaHandHolding />;
      case 'release': return <FaUnlockAlt />;
      case 'stats': return <FaStar />;
      case 'fixture': return <FaTrophy />;
      default: return null;
    }
  };

  const counts = useMemo(() => {
    const acc = { trade: 0, pick: 0, release: 0, stats: 0, fixture: 0 };
    (feed || []).forEach(n => { if (acc.hasOwnProperty(n.kind)) acc[n.kind] += 1; });
    return acc;
  }, [feed]);

  const LiveScores = () => {
    const [scores, setScores] = useState([]);
    useEffect(() => {
      let timer;
      async function loadScores() {
        try {
          const r = await fetch(`${API_ENDPOINTS}/api/live-scores`);
          const j = await r.json();
          setScores(Array.isArray(j.items) ? j.items : []);
        } catch {}
      }
      loadScores();
      timer = setInterval(loadScores, 30000);
      return () => { if (timer) clearInterval(timer); };
    }, []);
    if (!scores.length) return null;
    return (
      <div className="live-scores">
        <div className="live-header">Live Scores</div>
        <div className="live-scroller">
          {scores.map(s => {
            const t1 = s.teams?.[0] || 'Team A';
            const t2 = s.teams?.[1] || 'Team B';
            const initials = (name) => String(name || '?').split(' ').map(x => x[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
            const type = String(s.matchType || '').toLowerCase();
            const isLive = /live|progress/i.test(String(s.status || ''));
            const formatDateTime = (iso) => {
              try {
                if (!iso) return '';
                const d = new Date(iso);
                return d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
              } catch { return ''; }
            };
            const looksLikeId = (txt) => {
              if (!txt) return false;
              const s = String(txt).trim();
              return /^[0-9a-f-]{20,}$/i.test(s);
            };
            const scoreParts = (s.score || '').split('|').map(p => p.trim()).filter(Boolean);
            return (
              <div key={s.id} className={`live-card ${type} ${isLive ? 'is-live' : ''}`}>
                {isLive && <span className="live-ribbon">LIVE</span>}
                <div className="live-top">
                  {!looksLikeId(s.series) && <span className="series">{s.series}</span>}
                  <span className={`badge type ${type || 'other'}`}>{s.matchType || 'Match'}</span>
                </div>
                <div className="team-row">
                  <span className="team-chip">
                    <span className="team-avatar-mini">{initials(t1)}</span>
                    <span className="team-name">{t1}</span>
                  </span>
                  <span className="vs">vs</span>
                  <span className="team-chip">
                    <span className="team-avatar-mini">{initials(t2)}</span>
                    <span className="team-name">{t2}</span>
                  </span>
                </div>
                {scoreParts.length > 0 ? (
                  <div className="score-chips">
                    {scoreParts.map((p, idx) => (
                      <span key={idx} className="score-chip">{p}</span>
                    ))}
                  </div>
                ) : (s.score ? <div className="score-line">{s.score}</div> : null)}
                {s.startsAt && <div className="live-datetime">{formatDateTime(s.startsAt)}</div>}
                <div className="live-bottom">
                  {isLive && <span className="live-dot" aria-label="Live" />}
                  <span className="live-status">{s.status || ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="news-page">
      <div className="news-hero">
        <div className="hero-text">
          <h1>Cricket News & Alerts</h1>
          <p>Trades, picks, releases and big-stat highlights in one place.</p>
        </div>
        <div className="hero-art">
          <Lottie loop play animationData={announcementAnimation} style={{ width: 220, height: 220 }} />
        </div>
      </div>

      <div className="news-toolbar">
        <input
          type="text"
          placeholder="Search news, e.g. trade, pick, release, runs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search news"
        />
        <div className="filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'trade' ? 'active' : ''} onClick={() => setFilter('trade')}>Trades ({counts.trade})</button>
          <button className={filter === 'pick' ? 'active' : ''} onClick={() => setFilter('pick')}>Picks ({counts.pick})</button>
          <button className={filter === 'release' ? 'active' : ''} onClick={() => setFilter('release')}>Releases ({counts.release})</button>
          <button className={filter === 'stats' ? 'active' : ''} onClick={() => setFilter('stats')}>Stats ({counts.stats})</button>
          <button className={filter === 'fixture' ? 'active' : ''} onClick={() => setFilter('fixture')}>Fixtures ({counts.fixture})</button>
        </div>
      </div>

      {loading ? (
        <div className="news-loader">
          <div className="loader-card">
            <div className="loader-art">
              <Lottie loop play animationData={hittingSixAnimation} style={{ width: 160, height: 160 }} />
            </div>
            <div className="loader-title">Fetching the latest buzz…</div>
            <div className="progress-shell" aria-label="Loading progress">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text">{progress}%</div>
          </div>
        </div>
      ) : (
        <>
          <LiveScores />
          <div className="breaking-ticker">
            <div className="track">
              {(feed || []).filter(n => n.isBreaking).slice(0, 10).map((n, idx) => (
                <span key={idx} className="ticker-item">Breaking: {n.title}</span>
              ))}
            </div>
          </div>
          <div className="news-grid">
            {filtered.map((n, idx) => (
              <article key={idx} className={`news-card ${n.kind} ${n.status}`}>
                <div className="news-header">
                  <div className={`pill ${n.kind}`}>{kindIcon(n.kind)}<span className="pill-text">{n.kind}</span></div>
                  <div className={`status-pill ${n.status}`}>{n.status.replace('_', ' ')}</div>
                </div>
                <h3 className="news-title">{n.title}</h3>
                {n.status === 'admin_pending' && (
                  <div className="accepted-note">
                    <FaCheckCircle style={{ marginRight: 8 }} />Accepted by recipient · Awaiting admin approval
                  </div>
                )}
                {n.status === 'rejected' && (
                  <div className="rejected-note">
                    <FaTimesCircle style={{ marginRight: 8 }} />Proposal rejected
                  </div>
                )}
                {n.status === 'withdrawn' && (
                  <div className="withdrawn-note">
                    <FaTimesCircle style={{ marginRight: 8 }} />Proposal withdrawn
                  </div>
                )}
                {n.body && <p className="news-summary">{n.body}</p>}
                <div className="news-meta">
                  <span className="date">{new Date(n.timestamp).toLocaleString()}</span>
                </div>

                {/* Social Interaction Section */}
                <div className="news-social">
                  <div className="social-actions">
                    <div className="action-group">
                      <button 
                        className="action-btn like-btn"
                        onClick={() => handleLike(n.uniqueId, 'like')}
                        title="Like"
                      >
                        <FaRegHeart />
                      </button>
                      <button 
                        className="action-btn comment-btn"
                        onClick={() => toggleComments(n.uniqueId)}
                        title="Comment"
                      >
                        <FaRegComment />
                      </button>
                      <button className="action-btn share-btn" title="Share">
                        <FaShare />
                      </button>
                    </div>
                    
                    <div className="reaction-picker">
                      <button 
                        className="reaction-trigger"
                        onClick={() => toggleLikeReactions(n.uniqueId)}
                        title="Choose reaction"
                      >
                        <FaSmile />
                      </button>
                      {showLikeReactions[n.uniqueId] && (
                        <div className="reaction-options">
                          <button onClick={() => handleLike(n.uniqueId, 'like')} title="Like">👍</button>
                          <button onClick={() => handleLike(n.uniqueId, 'love')} title="Love">❤️</button>
                          <button onClick={() => handleLike(n.uniqueId, 'haha')} title="Haha">😂</button>
                          <button onClick={() => handleLike(n.uniqueId, 'wow')} title="Wow">😮</button>
                          <button onClick={() => handleLike(n.uniqueId, 'sad')} title="Sad">😢</button>
                          <button onClick={() => handleLike(n.uniqueId, 'angry')} title="Angry">😠</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Like Count Display - Clickable to show names */}
                  <div className="like-count" onClick={() => toggleLikeDetails(n.uniqueId)}>
                    <span className="clickable-likes">{n.likeCount || 0} likes</span>
                    {n.likeCounts && Object.entries(n.likeCounts).map(([type, count]) => 
                      count > 0 ? (
                        <span key={type} className={`${type}-count`}>
                          {type === 'like' ? '👍' : type === 'love' ? '❤️' : type === 'haha' ? '😂' : type === 'wow' ? '😮' : type === 'sad' ? '😢' : type === 'angry' ? '😠' : '👍'} {count}
                        </span>
                      ) : null
                    )}
                    {n.likes && n.likes.length > 0 && (
                      <span className="toggle-hint">(click to see who liked)</span>
                    )}
                  </div>
                  
                  {/* Like Details - Only show when clicked */}
                  {n.likes && n.likes.length > 0 && n.showLikeDetails && (
                    <div className="like-details">
                      <span className="like-names">
                        {n.likes.map((like, index) => (
                          <span key={like._id || index} className="liker-name">
                            <span className="like-emoji">
                              {like.likeType === 'like' ? '👍' : like.likeType === 'love' ? '❤️' : like.likeType === 'haha' ? '😂' : like.likeType === 'wow' ? '😮' : like.likeType === 'sad' ? '😢' : like.likeType === 'angry' ? '😠' : '👍'}
                            </span>
                            {like.userId?.name || 'Unknown'}
                            {index < n.likes.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                  
                  {/* Comment Count Display */}
                  <div className="comment-count" onClick={() => toggleComments(n.uniqueId)}>
                    <span className="clickable-count">{n.commentCount || 0} comments</span>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[n.uniqueId] && (
                    <div className="comments-section">
                      <div className="comments-header">
                        <h4>Comments</h4>
                      </div>
                      
                      {/* Comment Input */}
                      {currentUser && (
                        <div className="comment-input-container">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[n.uniqueId] || ''}
                            onChange={(e) => setCommentInputs(prev => ({
                              ...prev,
                              [n.uniqueId]: e.target.value
                            }))}
                            className="comment-input"
                          />
                          <button
                            onClick={() => handleComment(n.uniqueId, commentInputs[n.uniqueId])}
                            className="comment-submit-btn"
                            disabled={!commentInputs[n.uniqueId]?.trim()}
                          >
                            Post
                          </button>
                        </div>
                      )}

                      {/* Comments List */}
                      <div className="comments-list">
                        {n.comments && n.comments.length > 0 ? (
                          n.comments.map((comment, index) => (
                            <div key={comment._id} className="comment-item">
                              <div className="comment-avatar">
                                {comment.userAvatar ? (
                                  <img src={comment.userAvatar} alt={comment.userName} />
                                ) : (
                                  <div className="avatar-placeholder">
                                    {comment.userName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <span className="comment-author">{comment.userName}</span>
                                  <span className="comment-time">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <div className="comment-text">
                                  {comment.content}
                                  {comment.isEdited && (
                                    <span className="edited-mark"> (edited)</span>
                                  )}
                                </div>
                                <div className="comment-actions">
                                  <button 
                                    className="comment-action-btn"
                                    onClick={() => handleCommentLike(comment._id, 'like')}
                                    title="Thumbs up"
                                  >
                                    <span className={`reaction-icon ${comment.likes?.find(like => like.userId === currentUser?.id && like.type === 'like') ? 'liked' : ''}`}>
                                      👍
                                    </span>
                                    <span className="comment-likes">
                                      {comment.likes?.filter(like => like.type === 'like').length || 0}
                                    </span>
                                  </button>
                                  <button 
                                    className="comment-action-btn"
                                    onClick={() => handleCommentLike(comment._id, 'dislike')}
                                    title="Thumbs down"
                                  >
                                    <span className={`reaction-icon ${comment.likes?.find(like => like.userId === currentUser?.id && like.type === 'dislike') ? 'disliked' : ''}`}>
                                      👎
                                    </span>
                                    <span className="comment-likes">
                                      {comment.likes?.filter(like => like.type === 'dislike').length || 0}
                                    </span>
                                  </button>
                                  <button 
                                    className="comment-action-btn"
                                    onClick={() => handleCommentLike(comment._id, 'laugh')}
                                    title="Laugh"
                                  >
                                    <span className={`reaction-icon ${comment.likes?.find(like => like.userId === currentUser?.id && like.type === 'laugh') ? 'laughed' : ''}`}>
                                      😂
                                    </span>
                                    <span className="comment-likes">
                                      {comment.likes?.filter(like => like.type === 'laugh').length || 0}
                                    </span>
                                  </button>
                                  <button 
                                    className="comment-action-btn"
                                    onClick={() => setReplyInputs(prev => ({ ...prev, [comment._id]: '' }))}
                                    title="Reply"
                                  >
                                    <FaReply />
                                    <span className="action-text">Reply</span>
                                  </button>
                                  {currentUser && comment.userId === currentUser.id && (
                                    <>
                                      <button 
                                        className="comment-action-btn"
                                        onClick={() => setEditingComments(prev => ({ ...prev, [comment._id]: true }))}
                                      >
                                        <FaEdit />
                                      </button>
                                      <button 
                                        className="comment-action-btn"
                                        onClick={() => handleDeleteComment(comment._id)}
                                      >
                                        <FaTrash />
                                      </button>
                                    </>
                                  )}
                                </div>
                                
                                {/* Reply Input */}
                                {replyInputs[comment._id] !== undefined && (
                                  <div className="reply-input-container">
                                    <input
                                      type="text"
                                      placeholder="Write a reply..."
                                      value={replyInputs[comment._id] || ''}
                                      onChange={(e) => setReplyInputs(prev => ({
                                        ...prev,
                                        [comment._id]: e.target.value
                                      }))}
                                      className="reply-input"
                                    />
                                    <button
                                      onClick={() => handleComment(n.uniqueId, replyInputs[comment._id], comment._id)}
                                      className="reply-submit-btn"
                                      disabled={!replyInputs[comment._id]?.trim()}
                                    >
                                      Reply
                                    </button>
                                    <button
                                      onClick={() => setReplyInputs(prev => {
                                        const newState = { ...prev };
                                        delete newState[comment._id];
                                        return newState;
                                      })}
                                      className="reply-cancel-btn"
                                      title="Cancel reply"
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                )}
                                
                                {/* Replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="replies-section">
                                    <div className="replies-header">
                                      <span className="replies-title">Replies ({comment.replies.length})</span>
                                    </div>
                                    {comment.replies.map((reply, replyIndex) => (
                                      <div key={replyIndex} className="reply-item">
                                        <div className="reply-avatar">
                                          {reply.userAvatar ? (
                                            <img src={reply.userAvatar} alt={reply.userName} />
                                          ) : (
                                            <div className="avatar-placeholder">
                                              {reply.userId?.name?.charAt(0)?.toUpperCase() || reply.userName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                          )}
                                        </div>
                                        <div className="reply-content">
                                          <div className="reply-header">
                                            <span className="reply-author">
                                              <strong>{reply.userId?.name || reply.userName}</strong>
                                            </span>
                                            <span className="reply-time">
                                              {new Date(reply.createdAt).toLocaleString()}
                                            </span>
                                          </div>
                                          <div className="reply-text">{reply.content}</div>
                                          <div className="reply-actions">
                                            <button 
                                              className="comment-action-btn"
                                              onClick={() => handleCommentLike(comment._id, 'like', replyIndex)}
                                              title="Thumbs up"
                                            >
                                              <span className={`reaction-icon ${reply.likes?.find(like => like.userId === currentUser?.id && like.type === 'like') ? 'liked' : ''}`}>
                                                👍
                                              </span>
                                              <span className="comment-likes">
                                                {reply.likes?.filter(like => like.type === 'like').length || 0}
                                              </span>
                                            </button>
                                            <button 
                                              className="comment-action-btn"
                                              onClick={() => handleCommentLike(comment._id, 'dislike', replyIndex)}
                                              title="Thumbs down"
                                            >
                                              <span className={`reaction-icon ${reply.likes?.find(like => like.userId === currentUser?.id && like.type === 'dislike') ? 'disliked' : ''}`}>
                                                👎
                                              </span>
                                              <span className="comment-likes">
                                                {reply.likes?.filter(like => like.type === 'dislike').length || 0}
                                              </span>
                                            </button>
                                            <button 
                                              className="comment-action-btn"
                                              onClick={() => handleCommentLike(comment._id, 'laugh', replyIndex)}
                                              title="Laugh"
                                            >
                                              <span className={`reaction-icon ${reply.likes?.find(like => like.userId === currentUser?.id && like.type === 'laugh') ? 'laughed' : ''}`}>
                                                😂
                                              </span>
                                              <span className="comment-likes">
                                                {reply.likes?.filter(like => like.type === 'laugh').length || 0}
                                              </span>
                                            </button>
                                            <button 
                                              className="comment-action-btn"
                                              onClick={() => setReplyInputs(prev => ({ ...prev, [`${comment._id}_${replyIndex}`]: '' }))}
                                              title="Reply to this reply"
                                            >
                                              <FaReply />
                                              <span className="action-text">Reply</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-comments">No comments yet. Be the first to comment!</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <div className="empty">No news found. Try a different search.</div>
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast" onClick={() => setToast('')}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default NewsAlerts;



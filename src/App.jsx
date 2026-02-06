import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Trophy, 
  Heart, 
  Send,
  User,
  Activity,
  Lock,
  LogOut,
  ShieldCheck,
  ThumbsUp,
  MessageCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { login, getPosts, getLeaderboard, createPost, createComment, likePost, unlikePost, register as apiRegister } from './services/api';
import Comment from './components/Comment';

export default function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Controlled login inputs (start empty to avoid accidental submissions)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register UI
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerErr, setRegisterErr] = useState('');

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  // Focus tracking to show eye only for focused or filled fields
  const [loginPassFocused, setLoginPassFocused] = useState(false);
  const [regPassFocused, setRegPassFocused] = useState(false);
  const [regConfirmFocused, setRegConfirmFocused] = useState(false);

  // Small flash message for successful registration/logout
  const [flashMsg, setFlashMsg] = useState('');

  // Per-post comment inputs
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});

  // Like loading per post
  const [likeLoading, setLikeLoading] = useState({});

  const setCommentInput = (postId, value) => setCommentInputs(prev => ({...prev, [postId]: value}));


  useEffect(() => {
    // Always start at the login screen when the UI opens.
    // Clear any saved auth tokens and remove default Authorization header so
    // the app does not auto-sign-in from a previous session.
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    try {
      import('./services/api').then(({ default: api }) => {
        if (api && api.defaults && api.defaults.headers) delete api.defaults.headers.common['Authorization'];
      });
    } catch (err) {
      // ignore — dynamic import is best-effort in this init step
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, leaderboardRes] = await Promise.all([
        getPosts(),
        getLeaderboard()
      ]);
      const postsData = postsRes.data.results || postsRes.data;
      setPosts(postsData);
      const lb = leaderboardRes.data || [];
      setLeaderboard(lb.slice(0,5));
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(() => {
        getLeaderboard().then(res => setLeaderboard(res.data.slice(0,5))).catch(console.error);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchData]);

  const handleLogin = async (e) => {
    e && e.preventDefault();
    setAuthLoading(true);
    try {
      const response = await login(loginUsername, loginPassword);
      const userData = {
        access: response.data.access,
        username: loginUsername
      };
      setUser(userData);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('username', loginUsername);
      // Set axios default header immediately so subsequent requests include the new access token
      try { 
        import('./services/api').then(({ default: api }) => {
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        });
      } catch (err) { console.warn('Could not set api default header', err); }
      // fetch feed after login
      fetchData();
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.detail || 'Invalid credentials'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e && e.preventDefault();
    setRegisterErr('');
    if (!regUsername || !regPassword || !regEmail) { setRegisterErr('Username, email and password are required'); return; }
    if (regPassword !== regConfirm) { setRegisterErr('Passwords do not match'); return; }
    setRegisterLoading(true);
    try {
      // Pass the expected payload including email. api.register will try common endpoints.
      await apiRegister({ username: regUsername, email: regEmail, password: regPassword });

      // After successful registration, do NOT auto-login. Instead show a success message and
      // prefill the login username so the user can sign in manually.
      setShowRegister(false);
      setLoginUsername(regUsername);
      setLoginPassword('');
      // Clear registration form fields
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
      setFlashMsg('Account created — please sign in');
      setTimeout(() => setFlashMsg(''), 6000);
      // Do not fetch data or set user here (no auto-login)
      
    } catch (err) {
      console.error('Registration failed', err);
      if (err.response && err.response.status === 404) {
        setRegisterErr('Registration endpoint not available on server (404). Please enable user registration on the backend or create users via admin.');
      } else {
        setRegisterErr(err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || err.response?.data?.detail || 'Registration failed');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    // Clear any lingering login inputs and show brief message
    setLoginUsername('');
    setLoginPassword('');
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirm(false);
    setFlashMsg('You have been logged out');
    setTimeout(() => setFlashMsg(''), 4000);
  }; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await createPost(content);
      setContent("");
      const postsRes = await getPosts();
      setPosts(postsRes.data.results || postsRes.data);
    } catch (err) {
      console.error("Post Creation Failed:", err);
      alert('Failed to create post');
    }
  };

  // Optimistic like toggle per post
  const togglePostLike = async (postId) => {
    setLikeLoading(prev => ({...prev, [postId]: true}));
    // optimistic UI
    setPosts(prev => prev.map(p => p.id === postId ? ({...p, is_liked: !p.is_liked, like_count: (p.like_count || 0) + (p.is_liked ? -1 : 1)}) : p));
    try {
      const post = posts.find(p => p.id === postId);
      if (post?.is_liked) {
        await import('./services/api').then(m => m.unlikePost(postId));
      } else {
        await import('./services/api').then(m => m.likePost(postId));
      }
      await fetchData();
    } catch (err) {
      console.error('Like toggle failed', err);
      // rollback optimistic change
      await fetchData();
    } finally {
      setLikeLoading(prev => ({...prev, [postId]: false}));
    }
  };

  const submitComment = async (e, postId) => {
    e && e.preventDefault();
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    setCommentLoading(prev => ({...prev, [postId]: true}));
    try {
      await createComment(postId, text);
      await fetchData();
      setCommentInput(postId, '');
    } catch (err) {
      console.error('Comment failed', err);
      const detail = err.response?.data || err.response?.status || err.message;
      alert('Failed to post comment: ' + JSON.stringify(detail));
    } finally {
      setCommentLoading(prev => ({...prev, [postId]: false}));
    }
  };
  // LOGIN VIEW
  if (!user) {
    return (
      <div className="login-page">
        <div className="app-container">
          <div className="login-card card">
            <div className="text-center">
              <div className="logo" style={{marginBottom:12}}><ShieldCheck size={22} /></div>
              <div className="title">Playto Community</div>
            </div>

            <form onSubmit={showRegister ? handleRegister : handleLogin} style={{marginTop:20}}>
              {flashMsg && <div style={{marginBottom:12, padding:10, borderRadius:8, background:'#ecfdf5', color:'#065f46', textAlign:'center', fontWeight:700}}>{flashMsg}</div>}
              {showRegister ? (
                <>
                  <div style={{marginBottom:12}}>
                    <label className="small text-muted" style={{display:'block',marginBottom:6}}>Username</label>
                    <input value={regUsername} onChange={(e)=>setRegUsername(e.target.value)} required className="input" placeholder="Choose username" />
                  </div>
                  <div style={{marginBottom:12}}>
                    <label className="small text-muted" style={{display:'block',marginBottom:6}}>Email</label>
                    <input value={regEmail} onChange={(e)=>setRegEmail(e.target.value)} required type="email" className="input" placeholder="Your email" />
                  </div>
                  <div style={{display:'flex',gap:8,marginBottom:12}}>
                    <div style={{flex:1, position:'relative'}}>
                      <label className="small text-muted" style={{display:'block',marginBottom:6}}>Password</label>
                      <input value={regPassword} onChange={(e)=>setRegPassword(e.target.value)} onFocus={() => setRegPassFocused(true)} onBlur={() => setRegPassFocused(false)} required type={showRegPassword ? 'text' : 'password'} className="input" placeholder="Password" style={{paddingRight:44}} />
                      {(regPassword.length > 0 || regPassFocused) && (
                        <button type="button" onClick={() => setShowRegPassword(s => !s)} aria-label={showRegPassword ? 'Hide password' : 'Show password'} style={{position:'absolute', right:12, top:34, background:'transparent', border:'none', cursor:'pointer', padding:6}}>{showRegPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                      )}
                    </div>
                    <div style={{flex:1, position:'relative'}}>
                      <label className="small text-muted" style={{display:'block',marginBottom:6}}>Confirm</label>
                      <input value={regConfirm} onChange={(e)=>setRegConfirm(e.target.value)} onFocus={() => setRegConfirmFocused(true)} onBlur={() => setRegConfirmFocused(false)} required type={showRegConfirm ? 'text' : 'password'} className="input" placeholder="Confirm" style={{paddingRight:44}} />
                      {(regConfirm.length > 0 || regConfirmFocused) && (
                        <button type="button" onClick={() => setShowRegConfirm(s => !s)} aria-label={showRegConfirm ? 'Hide confirm' : 'Show confirm'} style={{position:'absolute', right:12, top:34, background:'transparent', border:'none', cursor:'pointer', padding:6}}>{showRegConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                      )}
                    </div>
                  </div>

                  <div style={{display:'flex',justifyContent:'center'}}>
                    <button disabled={registerLoading} className="btn btn-primary">{registerLoading ? 'Creating...' : 'Create Account'}</button>
                  </div>
                  {registerErr && <div className="error-text">{registerErr}</div>}
                </>
              ) : (
                <>
                  <div style={{marginBottom:12}}>
                    <label className="small text-muted" style={{display:'block',marginBottom:6}}>Username</label>
                    <input name="username" required value={loginUsername} onChange={(e)=>setLoginUsername(e.target.value)} className="input" placeholder="Enter username" />
                  </div>
                  <div style={{marginBottom:12, position:'relative'}}>
                    <label className="small text-muted" style={{display:'block',marginBottom:6}}>Password</label>
                    <input name="password" type={showLoginPassword ? 'text' : 'password'} required value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} onFocus={() => setLoginPassFocused(true)} onBlur={() => setLoginPassFocused(false)} className="input" placeholder="Enter password" style={{paddingRight:44}} />
                    {(loginPassword.length > 0 || loginPassFocused) && (
                      <button type="button" onClick={() => setShowLoginPassword(s => !s)} aria-label={showLoginPassword ? 'Hide password' : 'Show password'} style={{position:'absolute', right:12, top:34, background:'transparent', border:'none', cursor:'pointer', padding:6}}>{showLoginPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                    )}
                  </div>

                  <div style={{display:'flex',justifyContent:'center'}}>
                    <button disabled={authLoading} className="btn btn-primary"><Lock />{authLoading ? 'Syncing...' : 'Enter Portal'}</button>
                  </div>
                </>
              )}
            </form>

            <div style={{display:'flex',justifyContent:'center',marginTop:8}}>
              <div className="small-muted" style={{cursor:'pointer'}} onClick={() => {
                setShowRegister(v => !v);
                // Reset register form state when toggling views
                setRegisterErr('');
                setRegUsername('');
                setRegEmail('');
                setRegPassword('');
                setRegConfirm('');
                setShowRegPassword(false);
                setShowRegConfirm(false);
                setFlashMsg('');
              }}>
                {showRegister ? 'Have an account? Sign in' : 'New? Create an account'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="inner">
          <div className="brand">
            <div className="logo">P</div>
            <div className="brand-text">Playto Feed</div>
          </div>
          <div className="header-actions">
            <div className="user-badge">
              <User style={{width:16,height:16,color:'#64748b'}} />
              <span style={{fontWeight:700}}>{user.username}</span>
              <button onClick={handleLogout} className="logout-btn" title="Logout" style={{marginLeft:8}}>
                <LogOut />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-container">
        <div className="grid">
          {/* Feed Column */}
          <div className="feed-column">
            {/* Create Post Card */}
            <div className="post-create">
              <div className="label">POST TECHNICAL UPDATE</div>
              <form onSubmit={handleSubmit} style={{marginTop:8}}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What did you optimize today?"
                />
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
                  <button type="submit" className="commit-btn">
                    <Send /> Commit
                  </button>
                </div>
              </form>
            </div>

            <h2 className="feed-heading"><MessageSquare size={18} /> Community Feed</h2>

            {/* Posts Feed */}
            <div className="space-y-4">
              {loading ? (
                <div className="center" style={{padding:40}}>
                  <div style={{width:28,height:28,border:'3px solid #cfe7ff',borderTopColor:'#2563eb',borderRadius:999,marginBottom:8,animation:'spin 1s linear infinite'}}></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="post-card">
                    {/* Post Header */}
                    <div className="post-header">
                      <div className="avatar">{post.author.substring(0, 2).toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <h3 style={{fontWeight:800}}>{post.author}</h3>
                        <p className="small text-muted">{new Date(post.created_at || Date.now()).toLocaleDateString()} <span style={{marginLeft:8,fontSize:11,background:'#f1f5f9',padding:'2px 8px',borderRadius:8,fontWeight:700}}>General</span></p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="post-content">{post.content}</p>

                    {/* Post Footer - Interactions */}
                    <div className="post-actions">
                      <div onClick={() => togglePostLike(post.id)} className={`action-pill like-pill ${post.is_liked ? 'liked' : ''}`} style={{cursor: likeLoading[post.id] ? 'wait' : 'pointer', opacity: likeLoading[post.id] ? 0.6 : 1}}>
                        <Heart size={14} fill={post.is_liked ? 'currentColor' : 'none'} />
                        <span className="pill-count">{post.like_count || 0}</span>
                      </div>
                      <div className="action-pill" style={{cursor:'default'}}>
                        <MessageSquare size={14} />
                        <span className="comment-pill">{post.comment_count || 0}</span>
                      </div>
                    </div>

                    {/* Comment area: the add-comment form is anchored under the post (before the comments) */}
                    <div className="mt-3 post-comments">
                      {/* Add comment form (anchored under post) */}
                      <form onSubmit={(e) => submitComment(e, post.id)} className="post-add-comment">
                        <div className="post-add-comment-row">
                          <textarea value={commentInputs[post.id] || ''} onChange={(e)=>setCommentInput(post.id, e.target.value)} className="comment-textarea" placeholder="Write a comment..." rows={2} />
                          <button type="submit" disabled={commentLoading[post.id]} className="commit-btn post-add-comment-button" style={{padding:'8px 14px'}}>{commentLoading[post.id] ? 'Posting...' : 'Comment'}</button>
                        </div>
                      </form>

                      <div className="comments-list">
                        {post.comments && post.comments.map(c => (
                          <Comment key={c.id} comment={c} postId={post.id} onCommentAdded={fetchData} onLikeUpdate={fetchData} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card center">
                  <p className="text-muted">No posts yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="sidebar">
            <div className="card sidebar-card">
              {/* Leaderboard Header */}
              <div className="leaderboard-header">
                <h2 className="font-bold text-gray-900">
                  <span className="trophy-icon"><Trophy size={16} /></span>
                  Top 5 Users
                </h2>
                <span className="time-badge">24H</span>
              </div>

              {/* Leaderboard Items */}
              <div className="leaderboard-list">
                {leaderboard.map((user, idx) => (
                  <div key={user.username} className="leaderboard-item">
                    <div className={`rank ${idx < 3 ? 'top-rank' : ''}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="text-sm font-black text-gray-900 tabular-nums">{user.karma_24h}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">KARMA</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="leaderboard-footer">
                <p>REFRESHES EVERY 30 SECONDS</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

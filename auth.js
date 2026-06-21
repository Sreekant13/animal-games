// auth.js — Animal Games authentication module
// Currently uses localStorage. To upgrade to Firebase or Supabase,
// replace the signIn / signUp / signOut methods below.

const Auth = (() => {
  const USERS_KEY  = 'ag_users';
  const SESSION_KEY = 'ag_session';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
  }
  function saveUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  }

  // Not cryptographic — suitable for a localStorage demo only.
  // Replace with a real hash or delegate to a backend for production.
  function hashPwd(password) {
    let h = 5381;
    for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function avatarColor(name) {
    const colors = ['#2E7D32','#1565C0','#6A1B9A','#E65100','#880E4F','#00695C','#37474F'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  const module = {
    currentUser: null,

    // Call once on every page load
    init() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) this.currentUser = JSON.parse(raw);
      } catch { this.currentUser = null; }
      return this.currentUser;
    },

    async signUp(name, email, password) {
      const users = getUsers();
      const key = email.trim().toLowerCase();
      if (users[key]) throw new Error('An account with this email already exists.');
      const user = {
        id: Date.now().toString(36),
        name: name.trim(),
        email: key,
        initials: name.trim().slice(0, 2).toUpperCase(),
        color: avatarColor(name),
        joinedAt: Date.now(),
        scores: {}
      };
      users[key] = { ...user, pwd: hashPwd(password) };
      saveUsers(users);
      const { pwd, ...session } = users[key];
      this.currentUser = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    },

    async signIn(email, password) {
      const users = getUsers();
      const key = email.trim().toLowerCase();
      const user = users[key];
      if (!user || user.pwd !== hashPwd(password))
        throw new Error('Incorrect email or password.');
      const { pwd, ...session } = user;
      this.currentUser = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    },

    signOut() {
      this.currentUser = null;
      localStorage.removeItem(SESSION_KEY);
      window.location.href = 'index.html';
    },

    getUser() { return this.currentUser; },

    // Save a high score for a game key (only updates if it's a new record)
    saveScore(gameKey, score) {
      if (!this.currentUser) return false;
      const users = getUsers();
      const key = this.currentUser.email;
      if (!users[key]) return false;
      const prev = users[key].scores?.[gameKey] || 0;
      if (score <= prev) return false;
      users[key].scores = { ...(users[key].scores || {}), [gameKey]: score };
      this.currentUser.scores = users[key].scores;
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
      saveUsers(users);
      return true; // new record
    },

    getScore(gameKey) {
      return this.currentUser?.scores?.[gameKey] || 0;
    }
  };

  return module;
})();

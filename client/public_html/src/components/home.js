let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await fetchCurrentUser();
  if (!currentUser) {
    window.location.href = '/index.html';
    return;
  }

  populateSidebar();
  renderFeed();
  addComposeListeners();
  addLogoutListener();
  addSearchListener();
  addProfileLinkListener();
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function fetchCurrentUser() {
  try {
    const res = await fetch('/auth/me');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sidebar user card
// ---------------------------------------------------------------------------

function populateSidebar() {
  const initial = currentUser.username[0].toUpperCase();
  const color = avatarColor(currentUser.username);

  const avatar = document.getElementById('sidebarAvatar');
  if (currentUser.profileImage) {
    avatar.style.backgroundImage = `url(${currentUser.profileImage})`;
    avatar.style.backgroundSize = 'cover';
  } else {
    avatar.textContent = initial;
    avatar.style.background = color;
  }

  document.getElementById('sidebarName').textContent = currentUser.username;
  document.getElementById('sidebarHandle').textContent = '@' + currentUser.username;

  // Also populate the compose avatar
  const composeAvatar = document.getElementById('composeAvatar');
  if (currentUser.profileImage) {
    composeAvatar.style.backgroundImage = `url(${currentUser.profileImage})`;
    composeAvatar.style.backgroundSize = 'cover';
  } else {
    composeAvatar.textContent = initial;
    composeAvatar.style.background = color;
  }
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

async function renderFeed() {
  const timeline = document.querySelector('.timeline');
  timeline.innerHTML = '<p class="loading">Loading...</p>';

  try {
    const res = await fetch('/tweets/feed');
    if (!res.ok) throw new Error();
    const tweets = await res.json();

    if (tweets.length === 0) {
      timeline.innerHTML = '<p class="empty-feed">Nothing here yet — follow some people or post a chirp!</p>';
      return;
    }

    timeline.innerHTML = tweets.map(renderTweetCard).join('');
    attachTweetListeners();
  } catch {
    timeline.innerHTML = '<p class="error">Could not load feed.</p>';
  }
}

function renderTweetCard(tweet) {
  const isOwner = tweet.author._id === currentUser._id;
  const isLiked = Array.isArray(tweet.likes) && tweet.likes.includes(currentUser._id);
  const likeCount = tweet.likes ? tweet.likes.length : 0;
  const initial = tweet.author.username[0].toUpperCase();
  const color = avatarColor(tweet.author.username);
  const avatarStyle = `background:${color}`;

  return `
    <div class="tweet-card" data-id="${tweet._id}">
      <a href="/profile.html?id=${tweet.author._id}" class="tweet-avatar" style="${avatarStyle}" onclick="event.stopPropagation()">
        ${initial}
      </a>
      <div class="tweet-body">
        <div class="tweet-meta">
          <a class="tweet-name" href="/profile.html?id=${tweet.author._id}" onclick="event.stopPropagation()">${escapeHtml(tweet.author.username)}</a>
          <span class="tweet-handle">@${escapeHtml(tweet.author.username)}</span>
          <span class="tweet-dot">·</span>
          <span class="tweet-time">${timeAgo(tweet.created)}</span>
        </div>
        <p class="tweet-text">${escapeHtml(tweet.text)}</p>
        <div class="tweet-actions">
          <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${tweet._id}" title="Like">
            ${isLiked ? heartFilled() : heartOutline()}
            <span class="like-count">${likeCount || ''}</span>
          </button>
          ${isOwner ? `
          <button class="delete-btn" data-id="${tweet._id}" title="Delete">
            ${trashIcon()}
          </button>` : ''}
        </div>
      </div>
    </div>`;
}

function attachTweetListeners() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleLike(btn.dataset.id, btn); });
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteTweet(btn.dataset.id); });
  });
}

// ---------------------------------------------------------------------------
// Like
// ---------------------------------------------------------------------------

async function toggleLike(tweetId, btn) {
  try {
    const res = await fetch(`/tweets/${tweetId}/like`, { method: 'POST' });
    if (!res.ok) return;
    const { liked, likeCount } = await res.json();

    btn.classList.toggle('liked', liked);
    btn.innerHTML = `${liked ? heartFilled() : heartOutline()} <span class="like-count">${likeCount || ''}</span>`;
  } catch (err) {
    console.error('Like failed', err);
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

async function deleteTweet(tweetId) {
  try {
    const res = await fetch(`/tweets/${tweetId}`, { method: 'DELETE' });
    if (!res.ok) return;
    document.querySelector(`.tweet-card[data-id="${tweetId}"]`)?.remove();
    if (!document.querySelector('.tweet-card')) {
      document.querySelector('.timeline').innerHTML =
        '<p class="empty-feed">Nothing here yet — follow some people or post a chirp!</p>';
    }
  } catch (err) {
    console.error('Delete failed', err);
  }
}

// ---------------------------------------------------------------------------
// Compose (inline — no modal)
// ---------------------------------------------------------------------------

function addComposeListeners() {
  const textarea = document.getElementById('chirpText');
  const submitBtn = document.getElementById('submitChirp');
  const counter = document.getElementById('charCounter');

  // Focus compose when "Post" nav button is clicked
  document.getElementById('makeChirp').addEventListener('click', () => {
    textarea.focus();
  });

  // Char counter + enable/disable Post button
  textarea.addEventListener('input', () => {
    const remaining = 280 - textarea.value.length;
    counter.textContent = remaining;
    counter.className = 'char-counter' + (remaining <= 20 ? ' danger' : remaining <= 60 ? ' warn' : '');
    submitBtn.disabled = textarea.value.trim().length === 0;
  });

  // Submit
  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting…';

    try {
      const res = await fetch('/tweets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Could not post.');
        return;
      }
      textarea.value = '';
      counter.textContent = '280';
      counter.className = 'char-counter';
      renderFeed();
    } catch (err) {
      console.error('Post failed', err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  });
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

function addLogoutListener() {
  document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/index.html';
  });
}

// ---------------------------------------------------------------------------
// Profile link
// ---------------------------------------------------------------------------

function addProfileLinkListener() {
  document.getElementById('profileLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = `/profile.html?id=${currentUser._id}`;
  });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function addSearchListener() {
  const input = document.querySelector('.search-bar input');
  const resultsBox = document.getElementById('searchResults');
  if (!input || !resultsBox) return;

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { resultsBox.innerHTML = ''; return; }

    timer = setTimeout(async () => {
      try {
        const res = await fetch(`/users/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const users = await res.json();
        if (!users.length) {
          resultsBox.innerHTML = '<p class="no-results">No results for "' + escapeHtml(q) + '"</p>';
          return;
        }
        resultsBox.innerHTML = users.map(u => `
          <a class="search-result" href="/profile.html?id=${u._id}">
            <div class="search-result-avatar" style="background:${avatarColor(u.username)}">${u.username[0].toUpperCase()}</div>
            <div>
              <div>${escapeHtml(u.username)}</div>
              <div class="search-result-handle">@${escapeHtml(u.username)}</div>
            </div>
          </a>`).join('');
      } catch (err) {
        console.error('Search failed', err);
      }
    }, 300);
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Deterministic color from username
function avatarColor(username) {
  const colors = ['#1d9bf0','#7856ff','#ff7a00','#00ba7c','#f91880','#ffd400'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function heartOutline() {
  return `<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>`;
}

function heartFilled() {
  return `<svg viewBox="0 0 24 24"><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>`;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5zm7.13 15.17c-.04.52-.47.83-.99.83H7.86c-.52 0-.95-.31-.99-.83L6.07 8h11.85l-.79 11.67z"/></svg>`;
}

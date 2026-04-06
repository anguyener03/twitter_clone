let currentUser = null;
let profileUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await fetchCurrentUser();
  if (!currentUser) {
    window.location.href = '/index.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const profileId = params.get('id') || currentUser._id;

  populateSidebarUser();
  await loadProfile(profileId);
  addLogoutListener();
  addSearchListener();
  addMyProfileLinkListener();
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

function populateSidebarUser() {
  const initial = currentUser.username[0].toUpperCase();
  const color = avatarColor(currentUser.username);

  const avatar = document.getElementById('sidebarAvatar');
  if (currentUser.profileImage) {
    avatar.style.backgroundImage = `url(${currentUser.profileImage})`;
    avatar.style.backgroundSize = 'cover';
    avatar.textContent = '';
  } else {
    avatar.textContent = initial;
    avatar.style.background = color;
  }

  document.getElementById('sidebarName').textContent = currentUser.username;
  document.getElementById('sidebarHandle').textContent = '@' + currentUser.username;
}

// ---------------------------------------------------------------------------
// Load profile
// ---------------------------------------------------------------------------

async function loadProfile(userId) {
  try {
    const res = await fetch(`/users/${userId}`);
    if (!res.ok) {
      document.querySelector('.middle-column').innerHTML = '<p class="error" style="padding:2rem;text-align:center">User not found.</p>';
      return;
    }
    profileUser = await res.json();
    renderProfile();
    renderTweets(profileUser.tweets);
  } catch (err) {
    console.error('Failed to load profile', err);
  }
}

function renderProfile() {
  document.title = `@${profileUser.username} / Chirper`;

  const initial = profileUser.username[0].toUpperCase();
  const color = avatarColor(profileUser.username);

  // Avatar
  const avatar = document.getElementById('profileAvatar');
  if (profileUser.profileImage) {
    avatar.style.backgroundImage = `url(${profileUser.profileImage})`;
    avatar.style.backgroundSize = 'cover';
    avatar.textContent = '';
  } else {
    avatar.textContent = initial;
    avatar.style.background = color;
  }

  // Names / bio / stats
  document.getElementById('profileUsername').textContent = profileUser.username;
  document.getElementById('profileDisplayName').textContent = profileUser.username;
  document.getElementById('profileHandleDisplay').textContent = '@' + profileUser.username;
  document.getElementById('profileBio').textContent = profileUser.bio || '';
  document.getElementById('followingCount').textContent = profileUser.followingCount;
  document.getElementById('followerCount').textContent = profileUser.followerCount;
  document.getElementById('profileTweetCount').textContent =
    `${profileUser.tweets?.length ?? 0} post${profileUser.tweets?.length !== 1 ? 's' : ''}`;

  // Action buttons
  const actions = document.getElementById('profileActions');
  const isOwn = profileUser._id === currentUser._id;

  if (isOwn) {
    actions.innerHTML = `<button id="editProfileBtn">Edit profile</button>`;
    document.getElementById('editProfileBtn').addEventListener('click', openEditForm);
  } else {
    const alreadyFollowing = Array.isArray(currentUser.following) &&
      currentUser.following.includes(profileUser._id);
    actions.innerHTML = `
      <button id="followBtn" class="${alreadyFollowing ? 'following-btn' : ''}">
        ${alreadyFollowing ? 'Unfollow' : 'Follow'}
      </button>`;
    document.getElementById('followBtn').addEventListener('click', toggleFollow);
  }
}

// ---------------------------------------------------------------------------
// Render tweets
// ---------------------------------------------------------------------------

function renderTweets(tweets) {
  const container = document.getElementById('profileTweets');
  if (!tweets || tweets.length === 0) {
    container.innerHTML = '<p class="empty-feed">No posts yet.</p>';
    return;
  }

  const isOwn = profileUser._id === currentUser._id;
  const initial = profileUser.username[0].toUpperCase();
  const color = avatarColor(profileUser.username);

  container.innerHTML = tweets.map(tweet => `
    <div class="tweet-card" data-id="${tweet._id}">
      <div class="tweet-avatar" style="background:${color}">${initial}</div>
      <div class="tweet-body">
        <div class="tweet-meta">
          <span class="tweet-name">${escapeHtml(profileUser.username)}</span>
          <span class="tweet-handle">@${escapeHtml(profileUser.username)}</span>
          <span class="tweet-dot">·</span>
          <span class="tweet-time">${timeAgo(tweet.created)}</span>
        </div>
        <p class="tweet-text">${escapeHtml(tweet.text)}</p>
        <div class="tweet-actions">
          <button class="like-btn" data-id="${tweet._id}" title="Like">
            ${heartOutline()}
            <span class="like-count">${tweet.likes?.length || ''}</span>
          </button>
          ${isOwn ? `<button class="delete-btn" data-id="${tweet._id}" title="Delete">${trashIcon()}</button>` : ''}
        </div>
      </div>
    </div>`).join('');

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteTweet(btn.dataset.id); });
  });
}

// ---------------------------------------------------------------------------
// Follow / unfollow
// ---------------------------------------------------------------------------

async function toggleFollow() {
  const btn = document.getElementById('followBtn');
  const isFollowing = btn.classList.contains('following-btn');
  const method = isFollowing ? 'DELETE' : 'POST';

  try {
    const res = await fetch(`/users/${profileUser._id}/follow`, { method });
    if (!res.ok) return;

    if (isFollowing) {
      btn.textContent = 'Follow';
      btn.classList.remove('following-btn');
      profileUser.followerCount--;
    } else {
      btn.textContent = 'Unfollow';
      btn.classList.add('following-btn');
      profileUser.followerCount++;
    }
    document.getElementById('followerCount').textContent = profileUser.followerCount;
  } catch (err) {
    console.error('Follow toggle failed', err);
  }
}

// ---------------------------------------------------------------------------
// Edit profile
// ---------------------------------------------------------------------------

function openEditForm() {
  document.getElementById('editBio').value = profileUser.bio || '';
  document.getElementById('editProfileImage').value = profileUser.profileImage || '';
  document.getElementById('editForm').classList.remove('hidden');

  document.getElementById('saveProfileBtn').onclick = saveProfile;
  document.getElementById('cancelEditBtn').onclick = () =>
    document.getElementById('editForm').classList.add('hidden');
}

async function saveProfile() {
  const bio = document.getElementById('editBio').value;
  const profileImage = document.getElementById('editProfileImage').value.trim();
  const errorEl = document.getElementById('editError');

  try {
    const res = await fetch(`/users/${currentUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, profileImage }),
    });

    if (!res.ok) {
      const err = await res.json();
      errorEl.textContent = err.error || 'Update failed.';
      errorEl.classList.remove('hidden');
      return;
    }

    const updated = await res.json();
    profileUser.bio = updated.bio;
    profileUser.profileImage = updated.profileImage;

    document.getElementById('profileBio').textContent = updated.bio;

    const avatar = document.getElementById('profileAvatar');
    if (updated.profileImage) {
      avatar.style.backgroundImage = `url(${updated.profileImage})`;
      avatar.style.backgroundSize = 'cover';
      avatar.textContent = '';
    }

    errorEl.classList.add('hidden');
    document.getElementById('editForm').classList.add('hidden');
  } catch (err) {
    console.error('Save profile failed', err);
  }
}

// ---------------------------------------------------------------------------
// Delete tweet
// ---------------------------------------------------------------------------

async function deleteTweet(tweetId) {
  try {
    const res = await fetch(`/tweets/${tweetId}`, { method: 'DELETE' });
    if (!res.ok) return;
    document.querySelector(`.tweet-card[data-id="${tweetId}"]`)?.remove();
    if (!document.querySelector('#profileTweets .tweet-card')) {
      document.getElementById('profileTweets').innerHTML = '<p class="empty-feed">No posts yet.</p>';
    }
  } catch (err) {
    console.error('Delete failed', err);
  }
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
// My profile link
// ---------------------------------------------------------------------------

function addMyProfileLinkListener() {
  document.getElementById('myProfileLink')?.addEventListener('click', (e) => {
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
          resultsBox.innerHTML = `<p class="no-results">No results for "${escapeHtml(q)}"</p>`;
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

function avatarColor(username) {
  const colors = ['#1d9bf0','#7856ff','#ff7a00','#00ba7c','#f91880','#ffd400'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function heartOutline() {
  return `<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>`;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5zm7.13 15.17c-.04.52-.47.83-.99.83H7.86c-.52 0-.95-.31-.99-.83L6.07 8h11.85l-.79 11.67z"/></svg>`;
}

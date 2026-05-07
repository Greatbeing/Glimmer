// ====== 应用核心逻辑 ======
(() => {
  'use strict';

  // ====== 配置常量 ======
  const CONFIG = {
    PARTICLE_COUNT_MOBILE: 15,
    PARTICLE_COUNT_DESKTOP: 25,
    MAX_DOTS: 10,
    SWIPE_THRESHOLD: 60,
    WHEEL_SENSITIVITY: 30,
    WHEEL_COOLDOWN: 800,
    PAGE_TRANSITION_MS: 300,
    MAX_POSTS_STORAGE: 50,
    LIKE_BASE_COUNT: 50,
    LIKE_RANDOM_RANGE: 300,
    AMBIENT_CHORD_DURATION_MS: 6000,
    AMBIENT_FADE_OUT_MS: 1200,
    AMBIENT_ATTACK_S: 1.5,
    AMBIENT_BASS_VOLUME: 0.04,
    AMBIENT_NOTE_VOLUME: 0.06,
    AMBIENT_RELEASE_S: 0.5
  };

  const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

  // ====== 状态管理 ======
  const state = {
    ui: {
      currentIndex: 0,
      isDragging: false,
      startY: 0,
      startX: 0,
      swipeOffset: 0,
      isPageTransitioning: false,
      currentPage: 'Recommend'
    },
    data: {
      likedQuotes: new Set(),
      caughtQuotes: new Set(),
      posts: [],
      comments: {}
    },
    audio: {
      isPlaying: false,
      audioCtx: null,
      wheelTimeout: null,
      musicInterval: null,
      activeNodes: []
    }
  };

  // DOM 元素
  const elements = {};

  // 初始化
  function init() {
    cacheElements();
    createParticles();
    loadData();
    renderQuote();
    updateDots();
    bindEvents();
    renderPosts();
    updateSpaceStats();
  }

  // 创建粒子背景
  function createParticles() {
    const container = document.getElementById('particles');
    const count = window.innerWidth < 768 ? CONFIG.PARTICLE_COUNT_MOBILE : CONFIG.PARTICLE_COUNT_DESKTOP;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;will-change:transform;`;
      container.appendChild(particle);
    }
  }

  // 缓存DOM元素
  function cacheElements() {
    elements.quoteCard = document.getElementById('quoteCard');
    elements.quoteZh = document.getElementById('quoteZh');
    elements.quoteEn = document.getElementById('quoteEn');
    elements.quoteSource = document.getElementById('quoteSource');
    elements.quoteTag = document.getElementById('quoteTag');
    elements.badgeText = document.getElementById('badgeText');
    elements.likeCount = document.getElementById('likeCount');
    elements.likeBtn = document.getElementById('likeBtn');
    elements.catchBtn = document.getElementById('catchBtn');
    elements.commentCount = document.getElementById('commentCount');
    elements.commentBtn = document.getElementById('commentBtn');
    elements.dotsIndicator = document.getElementById('dotsIndicator');
    elements.musicBtn = document.getElementById('musicBtn');
    elements.publishInput = document.getElementById('publishInput');
    elements.publishBtn = document.getElementById('publishBtn');
    elements.publishPostsList = document.getElementById('publishPostsList');
    elements.emptyPosts = document.getElementById('emptyPosts');
    elements.catchTotal = document.getElementById('catchTotal');
    elements.postTotal = document.getElementById('postTotal');
    elements.likeTotal = document.getElementById('likeTotal');
    elements.caughtList = document.getElementById('caughtList');
    elements.spacePostsList = document.getElementById('spacePostsList');
    elements.emptySpace = document.getElementById('emptySpace');
  }

  // 加载本地数据
  function loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('glimmer_data') || '{}');
      state.data.likedQuotes = new Set(data.likedQuotes || []);
      state.data.caughtQuotes = new Set(data.caughtQuotes || []);
      state.data.posts = data.posts || [];
      state.data.comments = data.comments || {};
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  }

  // 保存数据
  function saveData() {
    const data = {
      likedQuotes: [...state.data.likedQuotes],
      caughtQuotes: [...state.data.caughtQuotes],
      posts: state.data.posts,
      comments: state.data.comments
    };
    try {
      localStorage.setItem('glimmer_data', JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage配额已满，清理旧数据');
        state.data.posts = state.data.posts.slice(0, CONFIG.MAX_POSTS_STORAGE);
        saveData();
      }
    }
  }

  // 渲染语录
  function renderQuote() {
    const q = QUOTES[state.ui.currentIndex];
    if (!q) return;

    const categoryMap = { literature: '文学', philosophy: '哲学', psychology: '心理', counterintuitive: '反常识' };
    const catText = categoryMap[q.category] || '';

    elements.quoteZh.textContent = `"${q.zh}"`;
    elements.quoteEn.textContent = q.en || '';
    elements.quoteEn.style.display = q.en ? 'block' : 'none';
    elements.quoteSource.textContent = `——《${q.source}》`;
    elements.badgeText.textContent = q.badge || '晨曦之光';

    elements.quoteTag.innerHTML = '';
    if (q.tag) {
      elements.quoteTag.style.display = 'inline-block';
      elements.quoteTag.appendChild(document.createTextNode(q.tag));
      if (catText) {
        const span = document.createElement('span');
        span.style.cssText = 'opacity:0.5;margin-left:4px;';
        span.textContent = ` · ${catText}`;
        elements.quoteTag.appendChild(span);
      }
    } else {
      elements.quoteTag.style.display = 'none';
    }

    const hash = q.id.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
    const likeCount = CONFIG.LIKE_BASE_COUNT + (Math.abs(hash) % CONFIG.LIKE_RANDOM_RANGE);
    elements.likeCount.textContent = likeCount;

    elements.likeBtn.classList.toggle('liked', state.data.likedQuotes.has(q.id));
    elements.catchBtn.classList.toggle('caught', state.data.caughtQuotes.has(q.id));

    const commentCount = (state.data.comments[q.id] || []).length;
    elements.commentCount.textContent = commentCount;
  }

  // 更新dots指示器
  function updateDots() {
    const maxDots = Math.min(QUOTES.length, CONFIG.MAX_DOTS);
    elements.dotsIndicator.innerHTML = '';

    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === state.ui.currentIndex % maxDots ? ' active' : '');
      elements.dotsIndicator.appendChild(dot);
    }
  }

  // 翻页
  function navigateQuote(direction) {
    if (state.ui.isDragging || state.ui.isPageTransitioning) return;
    state.ui.isPageTransitioning = true;

    const card = elements.quoteCard;
    const outDirection = direction === 'next' ? '-20px' : '20px';
    
    card.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
    card.style.transform = `translateY(${outDirection})`;
    card.style.opacity = '0';

    setTimeout(() => {
      if (direction === 'next') {
        state.ui.currentIndex = (state.ui.currentIndex + 1) % QUOTES.length;
      } else {
        state.ui.currentIndex = (state.ui.currentIndex - 1 + QUOTES.length) % QUOTES.length;
      }

      renderQuote();
      updateDots();

      card.style.transform = `translateY(${direction === 'next' ? '20px' : '-20px'})`;
      
      requestAnimationFrame(() => {
        card.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
        card.style.transform = 'translateY(0)';
        card.style.opacity = '1';
      });

      setTimeout(() => {
        state.ui.isPageTransitioning = false;
      }, 350);
    }, 250);
  }

  // 页面切换
  function switchPage(pageName) {
    if (state.ui.isPageTransitioning || state.ui.currentPage === pageName) return;
    state.ui.isPageTransitioning = true;

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageName);
    });

    const currentPage = document.querySelector('.page.active');
    const nextPage = document.getElementById('page' + pageName);

    if (currentPage && nextPage) {
      currentPage.style.opacity = '0';
      currentPage.style.transform = 'translateY(-20px)';

      setTimeout(() => {
        currentPage.classList.remove('active');
        nextPage.classList.add('active');
        nextPage.style.opacity = '0';
        nextPage.style.transform = 'translateY(20px)';

        requestAnimationFrame(() => {
          nextPage.style.opacity = '1';
          nextPage.style.transform = 'translateY(0)';
        });

        state.ui.currentPage = pageName;
        state.ui.isPageTransitioning = false;

        if (pageName === 'Space') {
          updateSpaceStats();
        }
      }, CONFIG.PAGE_TRANSITION_MS);
    } else {
      state.ui.isPageTransitioning = false;
    }
  }

  // 切换点赞
  function toggleLike() {
    const q = QUOTES[state.ui.currentIndex];
    if (!q) return;

    if (state.data.likedQuotes.has(q.id)) {
      state.data.likedQuotes.delete(q.id);
    } else {
      state.data.likedQuotes.add(q.id);
      elements.likeBtn.style.transform = 'scale(1.3)';
      setTimeout(() => elements.likeBtn.style.transform = '', 300);
    }

    saveData();
    renderQuote();
  }

  // 捕捉语录
  function catchQuote() {
    const q = QUOTES[state.ui.currentIndex];
    if (!q) return;

    if (state.data.caughtQuotes.has(q.id)) {
      showToast('已捕捉过');
      return;
    }

    state.data.caughtQuotes.add(q.id);
    saveData();
    renderQuote();
    showToast('捕捉成功！');
  }

  // 显示Toast
  function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // HTML转义（高性能纯字符串替换）
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => HTML_ESCAPE_MAP[c]);
  }

  // 格式化时间
  function formatTime(ts) {
    const d = Date.now() - ts;
    if (d <= 0) return '刚刚';
    if (d < 60000) return '刚刚';
    if (d < 3600000) return Math.floor(d / 60000) + '分钟前';
    if (d < 86400000) return Math.floor(d / 3600000) + '小时前';
    return Math.floor(d / 86400000) + '天前';
  }

  // 渲染帖子卡片（发布页）
  function renderPosts() {
    const list = elements.publishPostsList;
    list.innerHTML = '';

    if (state.data.posts.length === 0) {
      elements.emptyPosts.style.display = 'block';
      return;
    }

    elements.emptyPosts.style.display = 'none';
    state.data.posts.forEach(post => list.appendChild(createPostCardElement(post, true)));
  }

  // 渲染捕捉列表
  function renderCaughtList() {
    const list = elements.caughtList;
    list.innerHTML = '';
    list.style.display = 'block';

    if (state.data.caughtQuotes.size === 0) {
      elements.emptySpace.style.display = 'block';
      return;
    }

    elements.emptySpace.style.display = 'none';

    state.data.caughtQuotes.forEach(id => {
      const q = QUOTES.find(x => x.id === id);
      if (!q) return;

      const el = document.createElement('div');
      el.className = 'glass';
      el.style.cssText = 'padding: 16px; border-radius: 16px; margin-bottom: 12px; position: relative;';
      el.innerHTML = `
        <div style="font-family:var(--font-serif);font-size:15px;line-height:1.7;color:var(--amber-50);margin-bottom:8px;">"${q.zh}"</div>
        <div style="font-size:12px;color:var(--text-muted);">——《${q.source}》</div>
        <button class="remove-caught-btn" data-id="${q.id}" style="position:absolute;top:12px;right:12px;width:24px;height:24px;background:rgba(255,255,255,0.05);border:none;border-radius:50%;font-size:12px;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;justify-content:center;">✕</button>
      `;
      list.appendChild(el);
    });
  }

  // 渲染空间帖子列表
  function renderSpacePostsList() {
    const list = elements.spacePostsList;
    list.innerHTML = '';
    list.style.display = 'block';

    if (state.data.posts.length === 0) {
      elements.emptySpace.style.display = 'block';
      return;
    }

    elements.emptySpace.style.display = 'none';
    state.data.posts.forEach(post => list.appendChild(createPostCardElement(post, false)));
  }

  // 创建帖子卡片DOM元素
  function createPostCardElement(post, showDelete) {
    const el = document.createElement('div');
    el.className = 'glass';
    el.style.cssText = 'padding: 16px; border-radius: 16px; margin-bottom: 12px;';
    
    const moodHtml = post.mood ? `<span style="display:inline-block;font-size:11px;color:var(--amber-200);background:rgba(245,158,11,0.15);padding:2px 8px;border-radius:999px;margin-bottom:8px;">${escapeHtml(post.mood)}</span>` : '';
    const deleteHtml = showDelete ? `<button class="delete-post-btn" data-id="${post.id}" style="cursor:pointer;background:none;border:none;color:var(--text-muted);">删除</button>` : '';
    
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:14px;font-weight:600;color:var(--amber-100);">微光用户</span>
        <span style="font-size:12px;color:var(--text-muted);">${formatTime(post.time)}</span>
      </div>
      ${moodHtml}
      <div style="font-size:15px;line-height:1.7;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(post.content)}</div>
      <div style="display:flex;gap:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
        <button class="like-post-btn" data-id="${post.id}" class="action-btn ${post.liked ? 'liked' : ''}" style="cursor:pointer;background:none;border:none;color:inherit;display:flex;align-items:center;gap:4px;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span>${post.likes}</span>
        </button>
        ${deleteHtml}
      </div>
    `;
    return el;
  }

  // 切换帖子点赞
  function toggleLikePost(id) {
    const post = state.data.posts.find(p => p.id === id);
    if (!post) return;

    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    if (post.likes < 0) post.likes = 0;

    saveData();
    renderPosts();
    renderSpacePostsList();
    updateSpaceStats();
  }

  // 删除帖子
  function deletePost(id) {
    if (!confirm('确定删除？')) return;

    state.data.posts = state.data.posts.filter(p => p.id !== id);
    saveData();
    renderPosts();
    renderSpacePostsList();
    updateSpaceStats();
    showToast('已删除');
  }

  // 移除捕捉
  function removeCaught(id) {
    if (!confirm('确定取消捕捉？')) return;
    state.data.caughtQuotes.delete(id);
    saveData();
    renderQuote();
    updateSpaceStats();
    showToast('已取消');
  }

  // 发布内容
  function publishPost() {
    const content = elements.publishInput.value.trim();
    if (!content) {
      showToast('请输入内容');
      return;
    }

    const mood = document.querySelector('.mood-tag.active')?.dataset.mood || '';
    const post = {
      id: 'p' + Date.now(),
      content,
      mood,
      time: Date.now(),
      likes: 0,
      liked: false
    };

    state.data.posts.unshift(post);
    saveData();

    elements.publishInput.value = '';
    renderPosts();
    updateSpaceStats();
    showToast('发布成功！');
  }

  // 更新空间统计
  function updateSpaceStats() {
    elements.catchTotal.textContent = state.data.caughtQuotes.size;
    elements.postTotal.textContent = state.data.posts.length;
    const totalLikes = state.data.posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    elements.likeTotal.textContent = totalLikes;

    const activeTab = document.querySelector('#pageSpace .tab-btn.active')?.dataset.tab || 'caught';
    
    if (activeTab === 'caught') {
      renderCaughtList();
      elements.spacePostsList.style.display = 'none';
    } else {
      renderSpacePostsList();
      elements.caughtList.style.display = 'none';
    }
  }

  // ====== 事件绑定 ======
  function bindEvents() {
    const card = elements.quoteCard;

    // 触摸事件
    card.addEventListener('touchstart', (e) => {
      state.ui.isDragging = true;
      state.ui.startY = e.touches[0].clientY;
      state.ui.startX = e.touches[0].clientX;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!state.ui.isDragging) return;
      
      const diffY = state.ui.startY - e.touches[0].clientY;
      const diffX = Math.abs(state.ui.startX - e.touches[0].clientX);
      
      // 如果水平滑动大于垂直滑动，不处理（可能是页面滚动）
      if (diffX > Math.abs(diffY)) return;
      
      state.ui.swipeOffset = diffY;

      const maxOffset = 200;
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diffY));
      const opacity = 1 - Math.abs(clampedOffset) / (maxOffset * 1.5);

      card.style.transform = `translateY(${clampedOffset}px)`;
      card.style.opacity = Math.max(0.3, Math.min(1, opacity));
    }, { passive: true });

    card.addEventListener('touchend', () => {
      if (!state.ui.isDragging) return;
      state.ui.isDragging = false;

      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      card.style.transform = '';
      card.style.opacity = '';

      if (Math.abs(state.ui.swipeOffset) > CONFIG.SWIPE_THRESHOLD) {
        navigateQuote(state.ui.swipeOffset > 0 ? 'next' : 'prev');
      }
      state.ui.swipeOffset = 0;
    });

    // 鼠标滚轮
    document.addEventListener('wheel', (e) => {
      if (state.ui.currentPage !== 'Recommend' || state.audio.wheelTimeout) return;

      state.audio.wheelTimeout = setTimeout(() => {
        state.audio.wheelTimeout = null;
      }, CONFIG.WHEEL_COOLDOWN);

      if (Math.abs(e.deltaY) > CONFIG.WHEEL_SENSITIVITY) {
        navigateQuote(e.deltaY > 0 ? 'next' : 'prev');
      }
    }, { passive: true });

    // 键盘导航（过滤输入框）
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (state.ui.currentPage !== 'Recommend') return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        navigateQuote('next');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateQuote('prev');
      }
    });

    // 导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    // 操作按钮
    elements.likeBtn.addEventListener('click', toggleLike);
    elements.catchBtn.addEventListener('click', catchQuote);
    elements.commentBtn.addEventListener('click', () => showToast('评论功能开发中'));
    elements.musicBtn.addEventListener('click', toggleMusic);
    elements.settingsBtn.addEventListener('click', () => showToast('设置功能开发中'));
    elements.publishBtn.addEventListener('click', publishPost);

    // 心情标签
    document.querySelectorAll('.mood-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('.mood-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
      });
    });

    // Tab切换（空间页）
    document.querySelectorAll('#pageSpace .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#pageSpace .tab-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'none';
          b.style.color = 'var(--text-muted)';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--amber-500)';
        btn.style.color = '#fff';

        const tab = btn.dataset.tab;
        elements.caughtList.style.display = tab === 'caught' ? 'block' : 'none';
        elements.spacePostsList.style.display = tab === 'posts' ? 'block' : 'none';
      });
    });

    // 事件委托：帖子点赞、删除、移除捕捉
    document.addEventListener('click', (e) => {
      // 点赞帖子
      const likeBtn = e.target.closest('.like-post-btn');
      if (likeBtn) {
        toggleLikePost(likeBtn.dataset.id);
        return;
      }

      // 删除帖子
      const deleteBtn = e.target.closest('.delete-post-btn');
      if (deleteBtn) {
        deletePost(deleteBtn.dataset.id);
        return;
      }

      // 移除捕捉
      const removeBtn = e.target.closest('.remove-caught-btn');
      if (removeBtn) {
        removeCaught(removeBtn.dataset.id);
      }
    });
  }

  // ====== 音乐播放 - 宁静氛围音乐 ======
  const CHORDS = [
    [261.63, 329.63, 392.00], // C大调
    [220.00, 261.63, 329.63], // A小调
    [174.61, 220.00, 261.63], // F大调
    [196.00, 246.94, 293.66], // G大调
  ];
  let activeChord = 0;

  function toggleMusic() {
    if (state.audio.isPlaying) {
      stopMusic();
    } else {
      playAmbientMusic();
    }
  }

  function playAmbientMusic() {
    if (!state.audio.audioCtx) {
      state.audio.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    state.audio.audioCtx.resume().then(() => {
      state.audio.isPlaying = true;
      activeChord = 0;
      elements.musicBtn.style.color = 'var(--amber-300)';
      showToast('播放中 - 宁静氛围');

      playChord(0);

      state.audio.musicInterval = setInterval(() => {
        if (state.audio.isPlaying) {
          const next = (activeChord + 1) % CHORDS.length;
          fadeAndPlay(next);
        }
      }, CONFIG.AMBIENT_CHORD_DURATION_MS);
    }).catch(err => {
      console.error('音频上下文恢复失败:', err);
      showToast('音乐播放失败');
    });
  }

  function playChord(index) {
    const ctx = state.audio.audioCtx;
    if (!ctx) return;

    activeChord = index;
    const now = ctx.currentTime;
    const freqs = CHORDS[index];

    // 停止旧节点
    state.audio.activeNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + CONFIG.AMBIENT_RELEASE_S);
        osc.stop(now + CONFIG.AMBIENT_RELEASE_S + 0.1);
      } catch(e) {}
    });
    state.audio.activeNodes = [];

    // 播放新和弦
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(CONFIG.AMBIENT_NOTE_VOLUME, now + CONFIG.AMBIENT_ATTACK_S);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);

      state.audio.activeNodes.push({ osc, gain });
    });

    // 低音
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.value = freqs[0] / 2;
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(CONFIG.AMBIENT_BASS_VOLUME, now + 2);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(now);
    state.audio.activeNodes.push({ osc: bass, gain: bassGain });
  }

  function fadeAndPlay(index) {
    if (!state.audio.isPlaying) return;
    
    const ctx = state.audio.audioCtx;
    const now = ctx.currentTime;
    
    state.audio.activeNodes.forEach(({ gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 1);
      } catch(e) {}
    });

    setTimeout(() => {
      if (state.audio.isPlaying) {
        playChord(index);
      }
    }, CONFIG.AMBIENT_FADE_OUT_MS);
  }

  function stopMusic() {
    state.audio.isPlaying = false;
    elements.musicBtn.style.color = '';

    if (state.audio.musicInterval) {
      clearInterval(state.audio.musicInterval);
      state.audio.musicInterval = null;
    }

    if (state.audio.audioCtx) {
      const now = state.audio.audioCtx.currentTime;
      state.audio.activeNodes.forEach(({ gain }) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + CONFIG.AMBIENT_RELEASE_S);
        } catch(e) {}
      });
    }
    
    showToast('已停止');
  }

  // 启动应用
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

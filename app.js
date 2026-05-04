// ====== 应用核心逻辑 ======
(() => {
  'use strict';

  // 状态管理
  const state = {
    currentIndex: 0,
    isDragging: false,
    startY: 0,
    swipeOffset: 0,
    isPageTransitioning: false,
    currentPage: 'Recommend',
    likedQuotes: new Set(),
    caughtQuotes: new Set(),
    posts: [],
    comments: {},
    isPlaying: false,
    audioCtx: null,
    wheelTimeout: null
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
    const count = window.innerWidth < 768 ? 15 : 25;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.width = particle.style.height = (Math.random() * 4 + 2) + 'px';
      particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
      particle.style.animationDelay = (Math.random() * 10) + 's';
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
      state.likedQuotes = new Set(data.likedQuotes || []);
      state.caughtQuotes = new Set(data.caughtQuotes || []);
      state.posts = data.posts || [];
      state.comments = data.comments || {};
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  }

  // 保存数据
  function saveData() {
    const data = {
      likedQuotes: [...state.likedQuotes],
      caughtQuotes: [...state.caughtQuotes],
      posts: state.posts,
      comments: state.comments
    };
    localStorage.setItem('glimmer_data', JSON.stringify(data));
  }

  // 渲染语录
  function renderQuote() {
    const q = QUOTES[state.currentIndex];
    if (!q) return;

    const categoryMap = { literature: '文学', philosophy: '哲学', psychology: '心理', counterintuitive: '反常识' };
    const catText = categoryMap[q.category] || '';

    elements.quoteZh.textContent = `"${q.zh}"`;
    elements.quoteEn.textContent = q.en || '';
    elements.quoteEn.style.display = q.en ? 'block' : 'none';
    elements.quoteSource.textContent = `——《${q.source}》`;
    elements.badgeText.textContent = q.badge || '晨曦之光';

    // 标签
    elements.quoteTag.innerHTML = '';
    if (q.tag) {
      elements.quoteTag.style.display = 'inline-block';
      const tagText = document.createTextNode(q.tag);
      elements.quoteTag.appendChild(tagText);
      if (catText) {
        const span = document.createElement('span');
        span.style.cssText = 'opacity:0.5;margin-left:4px;';
        span.textContent = ` · ${catText}`;
        elements.quoteTag.appendChild(span);
      }
    } else {
      elements.quoteTag.style.display = 'none';
    }

    // 点赞数（确定性算法）
    const hash = q.id.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
    const likeCount = 50 + (Math.abs(hash) % 300);
    elements.likeCount.textContent = likeCount;

    // 状态
    elements.likeBtn.classList.toggle('liked', state.likedQuotes.has(q.id));
    elements.catchBtn.classList.toggle('caught', state.caughtQuotes.has(q.id));

    // 评论数
    const commentCount = (state.comments[q.id] || []).length;
    elements.commentCount.textContent = commentCount;
  }

  // 更新dots指示器
  function updateDots() {
    const maxDots = Math.min(QUOTES.length, 10);
    elements.dotsIndicator.innerHTML = '';

    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === state.currentIndex % maxDots ? ' active' : '');
      elements.dotsIndicator.appendChild(dot);
    }
  }

  // 翻页
  function navigateQuote(direction) {
    if (state.isDragging || state.isPageTransitioning) return;
    state.isPageTransitioning = true;

    const card = elements.quoteCard;
    const inner = card.querySelector('.quote-card-inner');

    // 滑出动画
    const outDirection = direction === 'next' ? '-20px' : '20px';
    card.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
    card.style.transform = `translateY(${outDirection})`;
    card.style.opacity = '0';

    setTimeout(() => {
      // 更新索引
      if (direction === 'next') {
        state.currentIndex = (state.currentIndex + 1) % QUOTES.length;
      } else {
        state.currentIndex = (state.currentIndex - 1 + QUOTES.length) % QUOTES.length;
      }

      renderQuote();
      updateDots();

      // 滑入动画
      card.style.transform = `translateY(${direction === 'next' ? '20px' : '-20px'})`;
      
      requestAnimationFrame(() => {
        card.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
        card.style.transform = 'translateY(0)';
        card.style.opacity = '1';
      });

      setTimeout(() => {
        state.isPageTransitioning = false;
      }, 350);
    }, 250);
  }

  // 页面切换
  function switchPage(pageName) {
    if (state.isPageTransitioning || state.currentPage === pageName) return;
    state.isPageTransitioning = true;

    // 更新导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageName);
    });

    // 页面切换动画
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

        state.currentPage = pageName;
        state.isPageTransitioning = false;

        // 更新空间统计
        if (pageName === 'Space') {
          updateSpaceStats();
        }
      }, 300);
    } else {
      state.isPageTransitioning = false;
    }
  }

  // 切换点赞
  function toggleLike() {
    const q = QUOTES[state.currentIndex];
    if (!q) return;

    if (state.likedQuotes.has(q.id)) {
      state.likedQuotes.delete(q.id);
    } else {
      state.likedQuotes.add(q.id);
      // 心跳动画
      elements.likeBtn.style.transform = 'scale(1.3)';
      setTimeout(() => elements.likeBtn.style.transform = '', 300);
    }

    saveData();
    renderQuote();
  }

  // 捕捉语录
  function catchQuote() {
    const q = QUOTES[state.currentIndex];
    if (!q) return;

    if (state.caughtQuotes.has(q.id)) {
      showToast('已捕捉过');
      return;
    }

    state.caughtQuotes.add(q.id);
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

    state.posts.unshift(post);
    saveData();

    elements.publishInput.value = '';
    renderPosts();
    updateSpaceStats();
    showToast('发布成功！');
  }

  // 渲染帖子列表
  function renderPosts() {
    const list = elements.publishPostsList;
    list.innerHTML = '';

    if (state.posts.length === 0) {
      elements.emptyPosts.style.display = 'block';
      return;
    }

    elements.emptyPosts.style.display = 'none';

    state.posts.forEach(post => {
      const el = document.createElement('div');
      el.className = 'glass';
      el.style.cssText = 'padding: 16px; border-radius: 16px; margin-bottom: 12px;';
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:600;color:var(--amber-100);">微光用户</span>
          <span style="font-size:12px;color:var(--text-muted);">${formatTime(post.time)}</span>
        </div>
        ${post.mood ? `<span style="display:inline-block;font-size:11px;color:var(--amber-200);background:rgba(245,158,11,0.15);padding:2px 8px;border-radius:999px;margin-bottom:8px;">${post.mood}</span>` : ''}
        <div style="font-size:15px;line-height:1.7;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(post.content)}</div>
        <div style="display:flex;gap:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
          <div class="action-btn ${post.liked ? 'liked' : ''}" onclick="window.toggleLikePost('${post.id}')" style="cursor:pointer;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span>${post.likes}</span>
          </div>
          <div class="action-btn" onclick="window.deletePost('${post.id}')" style="cursor:pointer;color:var(--text-muted);">删除</div>
        </div>
      `;
      list.appendChild(el);
    });
  }

  // 切换帖子点赞
  window.toggleLikePost = function(id) {
    const post = state.posts.find(p => p.id === id);
    if (!post) return;

    if (post.liked) {
      post.liked = false;
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.liked = true;
      post.likes += 1;
    }

    saveData();
    renderPosts();
    updateSpaceStats();
  };

  // 删除帖子
  window.deletePost = function(id) {
    if (!confirm('确定删除？')) return;

    state.posts = state.posts.filter(p => p.id !== id);
    saveData();
    renderPosts();
    updateSpaceStats();
    showToast('已删除');
  };

  // 更新空间统计
  function updateSpaceStats() {
    elements.catchTotal.textContent = state.caughtQuotes.size;
    elements.postTotal.textContent = state.posts.length;
    const totalLikes = state.posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    elements.likeTotal.textContent = totalLikes;

    // 渲染捕捉列表
    renderCaughtList();
    renderSpacePostsList();
  }

  // 渲染捕捉列表
  function renderCaughtList() {
    const list = elements.caughtList;
    list.innerHTML = '';

    if (state.caughtQuotes.size === 0) {
      elements.emptySpace.style.display = 'block';
      return;
    }

    elements.emptySpace.style.display = 'none';

    state.caughtQuotes.forEach(id => {
      const q = QUOTES.find(x => x.id === id);
      if (!q) return;

      const el = document.createElement('div');
      el.className = 'glass';
      el.style.cssText = 'padding: 16px; border-radius: 16px; margin-bottom: 12px; position: relative;';
      el.innerHTML = `
        <div style="font-family:var(--font-serif);font-size:15px;line-height:1.7;color:var(--amber-50);margin-bottom:8px;">"${q.zh}"</div>
        <div style="font-size:12px;color:var(--text-muted);">——《${q.source}》</div>
        <div style="position:absolute;top:12px;right:12px;width:24px;height:24px;background:rgba(255,255,255,0.05);border:none;border-radius:50%;font-size:12px;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;justify-content:center;" onclick="window.removeCaught('${q.id}')">✕</div>
      `;
      list.appendChild(el);
    });
  }

  // 渲染空间帖子列表
  function renderSpacePostsList() {
    const list = elements.spacePostsList;
    list.innerHTML = '';

    if (state.posts.length === 0) {
      return;
    }

    state.posts.forEach(post => {
      const el = document.createElement('div');
      el.className = 'glass';
      el.style.cssText = 'padding: 16px; border-radius: 16px; margin-bottom: 12px;';
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:600;color:var(--amber-100);">微光用户</span>
          <span style="font-size:12px;color:var(--text-muted);">${formatTime(post.time)}</span>
        </div>
        ${post.mood ? `<span style="display:inline-block;font-size:11px;color:var(--amber-200);background:rgba(245,158,11,0.15);padding:2px 8px;border-radius:999px;margin-bottom:8px;">${post.mood}</span>` : ''}
        <div style="font-size:15px;line-height:1.7;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(post.content)}</div>
        <div style="display:flex;gap:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
          <div class="action-btn ${post.liked ? 'liked' : ''}" onclick="window.toggleLikePost('${post.id}')" style="cursor:pointer;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span>${post.likes}</span>
          </div>
          <div class="action-btn" onclick="window.deletePost('${post.id}')" style="cursor:pointer;color:var(--text-muted);">删除</div>
        </div>
      `;
      list.appendChild(el);
    });
  }

  // 移除捕捉
  window.removeCaught = function(id) {
    if (!confirm('确定取消捕捉？')) return;
    state.caughtQuotes.delete(id);
    saveData();
    renderQuote();
    updateSpaceStats();
    showToast('已取消');
  };

  // 格式化时间
  function formatTime(ts) {
    const d = Date.now() - ts;
    if (d < 60000) return '刚刚';
    if (d < 3600000) return Math.floor(d / 60000) + '分钟前';
    if (d < 86400000) return Math.floor(d / 3600000) + '小时前';
    return Math.floor(d / 86400000) + '天前';
  }

  // HTML转义
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 绑定事件
  function bindEvents() {
    const card = elements.quoteCard;

    // 触摸事件
    card.addEventListener('touchstart', (e) => {
      state.isDragging = true;
      state.startY = e.touches[0].clientY;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!state.isDragging) return;
      const diff = state.startY - e.touches[0].clientY;
      state.swipeOffset = diff;

      const maxOffset = 200;
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
      const opacity = 1 - Math.abs(clampedOffset) / (maxOffset * 1.5);

      card.style.transform = `translateY(${clampedOffset}px)`;
      card.style.opacity = Math.max(0.3, Math.min(1, opacity));
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      if (!state.isDragging) return;
      state.isDragging = false;

      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      card.style.transform = '';
      card.style.opacity = '';

      const diff = state.swipeOffset;
      if (Math.abs(diff) > 50) {
        navigateQuote(diff > 0 ? 'next' : 'prev');
      }
      state.swipeOffset = 0;
    });

    // 鼠标滚轮
    document.addEventListener('wheel', (e) => {
      if (state.currentPage !== 'Recommend') return;
      if (state.wheelTimeout) return;

      state.wheelTimeout = setTimeout(() => {
        state.wheelTimeout = null;
      }, 800);

      if (Math.abs(e.deltaY) > 30) {
        navigateQuote(e.deltaY > 0 ? 'next' : 'prev');
      }
    }, { passive: true });

    // 键盘导航
    document.addEventListener('keydown', (e) => {
      if (state.currentPage === 'Recommend') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          navigateQuote('next');
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateQuote('prev');
        }
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

    // 心情标签
    document.querySelectorAll('.mood-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('.mood-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
      });
    });

    // 发布按钮
    elements.publishBtn.addEventListener('click', publishPost);

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

    // 音乐按钮 - 已禁用
    // elements.musicBtn.addEventListener('click', toggleMusic);
  }

  // 音乐播放 - 巴赫G大调大提琴合成器
  let bgAudio = null;
  let celloTimeout = null;
  let melodyInterval = null;
  let noteIndex = 0;

  // 巴赫G大调大提琴组曲第1号前奏曲旋律片段 (简化版)
  const BACH_MELODY = [
    // 前奏曲主旋律 - G大调音阶琶音
    { freq: 196.00, dur: 0.8 },  // G3
    { freq: 246.94, dur: 0.6 },  // B3
    { freq: 293.66, dur: 0.4 },  // D4
    { freq: 349.23, dur: 0.8 },  // F4
    { freq: 392.00, dur: 0.4 },  // G4
    { freq: 440.00, dur: 0.6 },  // A4
    { freq: 493.88, dur: 0.4 },  // B4
    { freq: 523.25, dur: 0.8 },  // C5
    { freq: 493.88, dur: 0.4 },  // B4
    { freq: 440.00, dur: 0.6 },  // A4
    { freq: 392.00, dur: 0.8 },  // G4
    { freq: 349.23, dur: 0.4 },  // F4
    { freq: 293.66, dur: 0.8 },  // D4
    { freq: 246.94, dur: 0.6 },  // B3
    { freq: 220.00, dur: 0.4 },  // A3
    { freq: 196.00, dur: 1.2 },  // G3
    // 下行音阶
    { freq: 220.00, dur: 0.4 },
    { freq: 246.94, dur: 0.4 },
    { freq: 261.63, dur: 0.4 },
    { freq: 293.66, dur: 0.4 },
    { freq: 329.63, dur: 0.4 },
    { freq: 349.23, dur: 0.4 },
    { freq: 392.00, dur: 0.6 },
    { freq: 440.00, dur: 0.4 },
    { freq: 392.00, dur: 0.6 },
    { freq: 329.63, dur: 0.4 },
    { freq: 293.66, dur: 0.8 },
    { freq: 246.94, dur: 0.6 },
    { freq: 220.00, dur: 0.4 },
    { freq: 196.00, dur: 1.0 },
    // 持续音
    { freq: 98.00,  dur: 1.5 },  // G2 低音持续
    { freq: 196.00, dur: 0.5 },
    { freq: 293.66, dur: 0.5 },
    { freq: 392.00, dur: 0.5 },
    { freq: 293.66, dur: 0.5 },
    { freq: 196.00, dur: 0.5 },
    { freq: 146.83, dur: 1.0 },  // D3
    { freq: 196.00, dur: 1.0 },  // G3
  ];

  function toggleMusic() {
    showToast('背景音乐功能已移除');
  }

  function playCelloMusic() {
    if (!state.audioCtx) {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    state.isPlaying = true;
    noteIndex = 0;
    elements.musicBtn.style.color = 'var(--amber-300)';
    showToast('播放中 - 巴赫G大调大提琴组曲');

    playNextNote();
    
    // 持续循环播放
    melodyInterval = setInterval(() => {
      if (state.isPlaying) {
        playNextNote();
      }
    }, 800);
  }

  function playNextNote() {
    const ctx = state.audioCtx;
    if (!ctx) return;

    const note = BACH_MELODY[noteIndex % BACH_MELODY.length];
    noteIndex++;

    // 创建大提琴音色
    const now = ctx.currentTime;
    const duration = note.dur;

    // 主振荡器 - 模拟琴弦振动
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = note.freq;

    // 谐波振荡器 - 增加泛音
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = note.freq * 2;

    // 第三谐波
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = note.freq * 3;

    // 琴体共鸣 - 低频共振
    const osc4 = ctx.createOscillator();
    osc4.type = 'sine';
    osc4.frequency.value = note.freq * 0.5;

    // 增益节点 - 音量包络
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.1);  // 慢起弓
    gain1.gain.linearRampToValueAtTime(0.06, now + duration * 0.5);
    gain1.gain.linearRampToValueAtTime(0, now + duration);

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.03;

    const gain3 = ctx.createGain();
    gain3.gain.value = 0.015;

    const gain4 = ctx.createGain();
    gain4.gain.value = 0.04;

    // 颤音效果 (LFO)
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5.5;  // 大提琴颤音频率
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = 3;  // 颤音深度
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibratoGain.connect(osc2.frequency);

    // 连接
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain2.connect(gain1);
    osc3.connect(gain3);
    gain3.connect(gain1);
    osc4.connect(gain4);
    gain4.connect(gain1);
    gain1.connect(ctx.destination);

    // 启动
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc4.start(now);
    vibrato.start(now);

    // 停止
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
    osc4.stop(now + duration);
    vibrato.stop(now + duration);
  }

  function stopMusic() {
    state.isPlaying = false;
    elements.musicBtn.style.color = '';

    if (melodyInterval) {
      clearInterval(melodyInterval);
      melodyInterval = null;
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

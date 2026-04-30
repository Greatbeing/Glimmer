const DataStore = {
  STORAGE_KEY: 'weiguang_data_v2',

  defaultData: {
    user: { id: 'user_default', username: '微光用户', avatar: '☀' },
    caughtQuotes: [],
    myPosts: [],
    likeRecords: { quotes: [], posts: [] },
    comments: {}
  },

  init() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        this.save(this.defaultData);
        return this.defaultData;
      }
      return JSON.parse(stored);
    } catch (e) {
      return this.defaultData;
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  get() { return this.init(); },

  getUser() { return this.get().user; },

  setUser(userData) {
    const data = this.get();
    data.user = { ...data.user, ...userData };
    return this.save(data);
  },

  getCaughtQuotes() { return this.get().caughtQuotes || []; },

  addCaughtQuote(quote) {
    const data = this.get();
    if (data.caughtQuotes.some(q => q.id === quote.id)) return false;
    data.caughtQuotes.unshift({ ...quote, caughtAt: Date.now() });
    this.save(data);
    return true;
  },

  removeCaughtQuote(quoteId) {
    const data = this.get();
    data.caughtQuotes = data.caughtQuotes.filter(q => q.id !== quoteId);
    this.save(data);
    return true;
  },

  isQuoteCaught(quoteId) {
    return this.get().caughtQuotes.some(q => q.id === quoteId);
  },

  getMyPosts() { return this.get().myPosts || []; },

  addPost(post) {
    const data = this.get();
    const newPost = {
      id: 'post_' + Date.now(),
      ...post,
      createTime: Date.now(),
      likeCount: 0,
      commentCount: 0
    };
    data.myPosts.unshift(newPost);
    this.save(data);
    return newPost;
  },

  updatePost(postId, content, mood) {
    const data = this.get();
    const post = data.myPosts.find(p => p.id === postId);
    if (post) {
      post.content = content;
      if (mood !== undefined) post.mood = mood;
      this.save(data);
      return true;
    }
    return false;
  },

  deletePost(postId) {
    const data = this.get();
    data.myPosts = data.myPosts.filter(p => p.id !== postId);
    this.save(data);
    return true;
  },

  isQuoteLiked(quoteId) { return this.get().likeRecords.quotes.includes(quoteId); },
  isPostLiked(postId) { return this.get().likeRecords.posts.includes(postId); },

  toggleQuoteLike(quoteId) {
    const data = this.get();
    const idx = data.likeRecords.quotes.indexOf(quoteId);
    if (idx === -1) {
      data.likeRecords.quotes.push(quoteId);
    } else {
      data.likeRecords.quotes.splice(idx, 1);
    }
    this.save(data);
    return idx === -1;
  },

  togglePostLike(postId) {
    const data = this.get();
    const idx = data.likeRecords.posts.indexOf(postId);
    if (idx === -1) {
      data.likeRecords.posts.push(postId);
    } else {
      data.likeRecords.posts.splice(idx, 1);
    }
    this.save(data);
    return idx === -1;
  },

  getQuoteComments(quoteId) { return this.get().comments[quoteId] || []; },
  getPostComments(postId) { return this.get().comments['post_' + postId] || []; },

  addQuoteComment(quoteId, comment) {
    const data = this.get();
    if (!data.comments[quoteId]) data.comments[quoteId] = [];
    data.comments[quoteId].unshift({
      id: 'comment_' + Date.now(),
      ...comment,
      createTime: Date.now()
    });
    this.save(data);
    return true;
  },

  addPostComment(postId, comment) {
    const data = this.get();
    const key = 'post_' + postId;
    if (!data.comments[key]) data.comments[key] = [];
    data.comments[key].unshift({
      id: 'comment_' + Date.now(),
      ...comment,
      createTime: Date.now()
    });
    this.save(data);
    return true;
  },

  getStats() {
    const data = this.get();
    return {
      catchCount: data.caughtQuotes.length,
      postCount: data.myPosts.length,
      likeCount: data.myPosts.reduce((sum, p) => sum + (p.likeCount || 0), 0)
    };
  }
};

const QuotePool = {
  quotes: [
    { id: 'q001', content: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。', source: { type: 'book', name: '思考致富', author: '拿破仑·希尔' }, musicMood: 'hope' },
    { id: 'q002', content: '我们终此一生，就是要摆脱他人的期待，找到真正的自己。', source: { type: 'book', name: '无声告白', author: '伍绮诗' }, musicMood: 'dream' },
    { id: 'q003', content: '世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱生活。', source: { type: 'book', name: '米开朗琪罗传', author: '罗曼·罗兰' }, musicMood: 'courage' },
    { id: 'q004', content: '当你凝视深渊时，深渊也在凝视着你。', source: { type: 'book', name: '善恶的彼岸', author: '尼采' }, musicMood: 'philosophy' },
    { id: 'q005', content: '所有的大人都曾经是小孩，虽然，只有少数的人记得。', source: { type: 'book', name: '小王子', author: '圣埃克苏佩里' }, musicMood: 'innocence' },
    { id: 'q006', content: '生命中真正重要的不是你遭遇了什么，而是你记住了哪些事，又是如何铭记的。', source: { type: 'book', name: '百年孤独', author: '马尔克斯' }, musicMood: 'memory' },
    { id: 'q007', content: '我荒废了时间，时间便把我荒废了。', source: { type: 'book', name: '莎士比亚全集', author: '莎士比亚' }, musicMood: 'time' },
    { id: 'q008', content: '我唯一能负担的奢侈品，就是一个爱我的人。', source: { type: 'movie', name: '寄生虫', author: '奉俊昊' }, musicMood: 'love' },
    { id: 'q009', content: '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。', source: { type: 'book', name: '活着', author: '余华' }, musicMood: 'life' },
    { id: 'q010', content: '愿你出走半生，归来仍是少年。', source: { type: 'book', name: '愿你出走半生，归来仍是少年', author: '孙衍' }, musicMood: 'youth' },
    { id: 'q011', content: '你要批评指点四周风景，首先要爬上屋顶。', source: { type: 'movie', name: '天堂电影院', author: '托纳多雷' }, musicMood: 'wisdom' },
    { id: 'q012', content: '温柔半两，从容一生。', source: { type: 'book', name: '等一朵花开', author: '林帝浣' }, musicMood: 'serenity' },
    { id: 'q013', content: '把每一个黎明看作是生命的开始，把每一个黄昏看作是你生命的小结。', source: { type: 'book', name: '十力语要', author: '熊十力' }, musicMood: 'hope' },
    { id: 'q014', content: '人生就像一杯茶，不会苦一辈子，但总会苦一阵子。', source: { type: 'book', name: '慧语集', author: '星云大师' }, musicMood: 'wisdom' },
    { id: 'q015', content: '岁月极美，在于它必然的流逝。春花、秋月、夏日、冬雪。', source: { type: 'book', name: '三毛全集', author: '三毛' }, musicMood: 'nature' },
    { id: 'q016', content: '没有人是一座孤岛，在大海里独踞。', source: { type: 'book', name: '没有人是一座孤岛', author: '约翰·多恩' }, musicMood: 'connection' },
    { id: 'q017', content: '重要的不是你活了多少年，而是这些年里，你活出了多少自己。', source: { type: 'book', name: '写下来的愿望更容易实现', author: '毕淑敏' }, musicMood: 'self' },
    { id: 'q018', content: '有时候，你需要停下来，让指尖穿过键盘，感受风的形状。', source: { type: 'movie', name: '海上钢琴师', author: '托纳多雷' }, musicMood: 'freedom' }
  ],

  getRandomQuote() {
    const idx = Math.floor(Math.random() * this.quotes.length);
    return { ...this.quotes[idx] };
  },

  getAllQuotes() {
    return this.quotes.map(q => ({ ...q }));
  },

  generateAIQuote() {
    const themes = [
      { word: '希望', desc: '在最黑暗的时刻，也要相信光明终会到来。每一次坚持，都是在为未来播种。' },
      { word: '勇气', desc: '勇敢不是不害怕，而是害怕时依然选择前行。你比你想象的更强大。' },
      { word: '平静', desc: '心若安静，风奈我何。在喧嚣中保持内心的宁静，是最美的修行。' },
      { word: '温暖', desc: '愿你被这个世界温柔以待，也愿你用温暖照亮他人的路。' },
      { word: '成长', desc: '所有的经历都是礼物，所有的伤痛都会变成照亮前路的光。' }
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    return {
      id: 'ai_' + Date.now(),
      content: theme.desc,
      source: { type: 'ai', name: '微光 AI', author: '智能生成' },
      musicMood: theme.word.toLowerCase()
    };
  }
};

const Utils = {
  formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minute = 60000, hour = 3600000, day = 86400000;
    if (diff < minute) return '刚刚';
    if (diff < hour) return Math.floor(diff / minute) + '分钟前';
    if (diff < day) return Math.floor(diff / hour) + '小时前';
    if (diff < 7 * day) return Math.floor(diff / day) + '天前';
    return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  },

  formatDate(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + weekdays[date.getDay()];
  },

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  },

  showCatchEffect() {
    const overlay = document.getElementById('catchOverlay');
    overlay.innerHTML = '';
    overlay.classList.add('show');

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('span');
      particle.className = 'catch-particle';
      particle.textContent = '✦';
      particle.style.left = '50%';
      particle.style.top = '40%';
      const angle = (i / 12) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
      particle.style.color = i % 2 === 0 ? '#FFD93D' : '#FF9B50';
      overlay.appendChild(particle);
    }

    setTimeout(() => overlay.classList.remove('show'), 1000);
  }
};

const App = {
  currentPage: 'recommend',
  currentQuoteIndex: 0,
  quotes: [],
  currentQuote: null,
  isPlaying: false,
  audioContext: null,

  init() {
    this.initDate();
    this.loadQuotes();
    this.bindEvents();
    this.showQuote(true);
  },

  initDate() {
    document.getElementById('currentDate').textContent = Utils.formatDate(new Date());
  },

  loadQuotes() {
    const allQuotes = [...QuotePool.getAllQuotes(), QuotePool.generateAIQuote()];
    this.quotes = this.shuffle(allQuotes);
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  bindEvents() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchPage(btn.dataset.page));
    });

    document.getElementById('likeBtn').addEventListener('click', () => this.toggleLike());
    document.getElementById('catchBtn').addEventListener('click', () => this.catchQuote());
    document.getElementById('commentBtn').addEventListener('click', () => this.toggleComment(true));
    document.getElementById('closeComment').addEventListener('click', () => this.toggleComment(false));
    document.getElementById('submitComment').addEventListener('click', () => this.submitComment());

    document.getElementById('publishSubmit').addEventListener('click', () => this.submitPost());
    document.querySelectorAll('.mood-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('.mood-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
      });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    document.getElementById('pageSpace').addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      const { action: act, quoteId, postId } = action.dataset;
      if (act === 'remove' && quoteId) this.removeCaught(quoteId);
      if (act === 'delete' && postId) this.deletePost(postId);
      if (act === 'edit' && postId) this.editPost(postId);
      if (act === 'like' && postId) this.togglePostLike(postId);
    });

    this.bindSwipe();
  },

  switchPage(page) {
    if (this.currentPage === page) return;
    this.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1)).classList.add('active');

    if (page === 'space') this.refreshSpace();
    if (page === 'publish') this.refreshPosts();
  },

  switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tab + 'List');
    });
  },

  bindSwipe() {
    const card = document.getElementById('quoteCard');
    let startY = 0, startX = 0, startTime = 0;

    card.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      startTime = Date.now();
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!startY) return;
      const diffY = e.touches[0].clientY - startY;
      const diffX = e.touches[0].clientX - startX;
      if (Math.abs(diffY) > Math.abs(diffX)) {
        e.preventDefault();
        card.style.transform = `translateY(${diffY * 0.4}px)`;
        card.style.opacity = 1 - Math.abs(diffY) / 600;
      }
    }, { passive: false });

    card.addEventListener('touchend', (e) => {
      if (!startY) return;
      const diff = startY - e.changedTouches[0].clientY;
      const duration = Date.now() - startTime;
      card.style.transition = '';
      card.style.transform = '';
      card.style.opacity = '';

      if (Math.abs(diff) > 50 && duration < 500) {
        if (diff > 0) this.nextQuote();
        else this.prevQuote();
      }
      startY = 0;
    }, { passive: true });
  },

  showQuote(direction = 'next', isInit = false) {
    if (!this.quotes.length) return;

    const card = document.getElementById('quoteCard');

    if (isInit) {
      this.currentQuote = this.quotes[this.currentQuoteIndex];
      this.renderQuote();
      return;
    }

    const outClass = direction === 'next' ? 'slide-up-out' : 'slide-down-out';
    card.classList.add(outClass);

    setTimeout(() => {
      this.currentQuote = this.quotes[this.currentQuoteIndex];
      this.renderQuote();
      card.classList.remove(outClass);
      card.classList.add(direction === 'next' ? 'slide-up-in' : 'slide-down-in');

      setTimeout(() => {
        card.classList.remove('slide-up-in', 'slide-down-in');
      }, 300);
    }, 300);
  },

  renderQuote() {
    const q = this.currentQuote;
    const isLiked = DataStore.isQuoteLiked(q.id);
    const isCaught = DataStore.isQuoteCaught(q.id);
    const likeCount = Math.floor(Math.random() * 400) + 100;
    const commentCount = DataStore.getQuoteComments(q.id).length;

    document.getElementById('quoteContent').textContent = q.content;
    document.getElementById('quoteAuthor').textContent = `—— ${q.source.name} ${q.source.author ? '/ ' + q.source.author : ''}`;
    document.getElementById('quoteTypeTag').textContent = q.source.type === 'ai' ? '✨ AI 生成' : '📖 文学作品';
    document.getElementById('likeCount').textContent = likeCount;
    document.getElementById('commentCount').textContent = commentCount;

    document.getElementById('likeBtn').classList.toggle('liked', isLiked);
    document.getElementById('catchBtn').classList.toggle('caught', isCaught);
  },

  nextQuote() {
    this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
    if (this.currentQuoteIndex === 0) {
      this.quotes = this.shuffle([...QuotePool.getAllQuotes(), QuotePool.generateAIQuote()]);
    }
    this.showQuote('next');
  },

  prevQuote() {
    this.currentQuoteIndex = (this.currentQuoteIndex - 1 + this.quotes.length) % this.quotes.length;
    this.showQuote('prev');
  },

  toggleLike() {
    if (!this.currentQuote) return;
    const isNowLiked = DataStore.toggleQuoteLike(this.currentQuote.id);
    document.getElementById('likeBtn').classList.toggle('liked', isNowLiked);
    const countEl = document.getElementById('likeCount');
    countEl.textContent = parseInt(countEl.textContent) + (isNowLiked ? 1 : -1);
  },

  toggleComment(show) {
    const panel = document.getElementById('commentPanel');
    panel.classList.toggle('show', show);
    if (show) {
      this.loadComments();
      document.getElementById('commentInput').focus();
    }
  },

  loadComments() {
    if (!this.currentQuote) return;
    const comments = DataStore.getQuoteComments(this.currentQuote.id);
    const listEl = document.getElementById('commentList');

    if (!comments.length) {
      listEl.innerHTML = '<div class="empty-hint"><span class="empty-icon">💬</span><span>暂无评论</span></div>';
      return;
    }

    listEl.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-user">${c.username}</div>
        <div class="comment-text">${c.text}</div>
        <div class="comment-time">${Utils.formatTime(c.createTime)}</div>
      </div>
    `).join('');
  },

  submitComment() {
    if (!this.currentQuote) return;
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) {
      Utils.showToast('请输入评论');
      return;
    }
    DataStore.addQuoteComment(this.currentQuote.id, {
      username: DataStore.getUser().username,
      text
    });
    input.value = '';
    this.loadComments();
    document.getElementById('commentCount').textContent = DataStore.getQuoteComments(this.currentQuote.id).length;
    Utils.showToast('评论成功');
  },

  catchQuote() {
    if (!this.currentQuote) return;
    if (DataStore.isQuoteCaught(this.currentQuote.id)) {
      Utils.showToast('已捕捉过这条微光');
      return;
    }
    DataStore.addCaughtQuote(this.currentQuote);
    document.getElementById('catchBtn').classList.add('caught');
    Utils.showCatchEffect();
    Utils.showToast('捕捉成功！');
  },

  submitPost() {
    const textarea = document.getElementById('publishTextarea');
    const content = textarea.value.trim();
    const activeMood = document.querySelector('.mood-tag.active');
    const mood = activeMood?.dataset.mood || '';

    if (!content) {
      Utils.showToast('请输入内容');
      return;
    }

    DataStore.addPost({
      username: DataStore.getUser().username,
      content,
      mood,
      avatar: DataStore.getUser().avatar
    });

    textarea.value = '';
    document.querySelectorAll('.mood-tag').forEach(t => t.classList.remove('active'));
    this.refreshPosts();
    Utils.showToast('发布成功');
  },

  refreshPosts() {
    const posts = DataStore.getMyPosts();
    const listEl = document.getElementById('postsList');
    const emptyEl = document.getElementById('emptyPosts');

    if (!posts.length) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = posts.map(post => `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-user">
            <div class="post-avatar">☀</div>
            <div>
              <div class="post-name">${post.username}</div>
              <div class="post-time">${Utils.formatTime(post.createTime)}</div>
            </div>
          </div>
          ${post.mood ? `<span class="post-mood">${post.mood}</span>` : ''}
        </div>
        <div class="post-text">${post.content}</div>
        <div class="post-footer">
          <button class="post-action ${DataStore.isPostLiked(post.id) ? 'liked' : ''}" data-action="like" data-post-id="${post.id}">
            ♥ ${post.likeCount || 0}
          </button>
          <button class="post-action" data-action="delete" data-post-id="${post.id}">删除</button>
        </div>
      </div>
    `).join('');
  },

  refreshSpace() {
    const stats = DataStore.getStats();
    document.getElementById('catchTotal').textContent = stats.catchCount;
    document.getElementById('postTotal').textContent = stats.postCount;
    document.getElementById('likeTotal').textContent = stats.likeCount;

    const caught = DataStore.getCaughtQuotes();
    const myPosts = DataStore.getMyPosts();

    const caughtEl = document.getElementById('caughtList');
    const postsEl = document.getElementById('postsList');
    const emptyEl = document.getElementById('emptySpace');

    if (!caught.length && !myPosts.length) {
      caughtEl.innerHTML = '';
      postsEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      return;
    }

    emptyEl.style.display = 'none';

    caughtEl.innerHTML = caught.map(q => `
      <div class="caught-card">
        <div class="quote-text">${q.content}</div>
        <div class="quote-source">—— ${q.source.name}</div>
        <button class="caught-remove" data-action="remove" data-quote-id="${q.id}">✕</button>
      </div>
    `).join('');

    postsEl.innerHTML = myPosts.map(post => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-user">
            <div class="post-avatar">☀</div>
            <div>
              <div class="post-name">${post.username}</div>
              <div class="post-time">${Utils.formatTime(post.createTime)}</div>
            </div>
          </div>
          ${post.mood ? `<span class="post-mood">${post.mood}</span>` : ''}
        </div>
        <div class="post-text">${post.content}</div>
        <div class="post-footer">
          <button class="post-action" data-action="delete" data-post-id="${post.id}">删除</button>
        </div>
      </div>
    `).join('');
  },

  togglePostLike(postId) {
    DataStore.togglePostLike(postId);
    this.refreshPosts();
  },

  removeCaught(quoteId) {
    if (confirm('确定取消捕捉这条微光？')) {
      DataStore.removeCaughtQuote(quoteId);
      this.refreshSpace();
      Utils.showToast('已取消');
    }
  },

  deletePost(postId) {
    if (confirm('确定删除？')) {
      DataStore.deletePost(postId);
      this.refreshSpace();
      Utils.showToast('已删除');
    }
  },

  editPost(postId) {
    const posts = DataStore.getMyPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newContent = prompt('编辑内容：', post.content);
    if (newContent && newContent.trim()) {
      DataStore.updatePost(postId, newContent.trim());
      this.refreshSpace();
      Utils.showToast('已修改');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

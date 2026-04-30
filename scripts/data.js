const DataStore = {
  STORAGE_KEY: 'weiguang_data',

  defaultData: {
    user: {
      id: 'user_' + Date.now(),
      username: '微光用户',
      avatar: '&#9787;'
    },
    caughtQuotes: [],
    myPosts: [],
    likeRecords: {
      quotes: [],
      posts: []
    },
    comments: {}
  },

  init() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      this.save(this.defaultData);
      return this.defaultData;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored data:', e);
      return this.defaultData;
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save data:', e);
      return false;
    }
  },

  get() {
    return this.init();
  },

  getUser() {
    return this.get().user;
  },

  setUser(userData) {
    const data = this.get();
    data.user = { ...data.user, ...userData };
    return this.save(data);
  },

  getCaughtQuotes() {
    return this.get().caughtQuotes || [];
  },

  addCaughtQuote(quote) {
    const data = this.get();
    if (data.caughtQuotes.find(q => q.id === quote.id)) {
      return false;
    }
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
    const data = this.get();
    return data.caughtQuotes.some(q => q.id === quoteId);
  },

  getMyPosts() {
    return this.get().myPosts || [];
  },

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
      post.updateTime = Date.now();
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

  getAllPosts() {
    return this.get().myPosts;
  },

  isQuoteLiked(quoteId) {
    const data = this.get();
    return data.likeRecords.quotes.includes(quoteId);
  },

  isPostLiked(postId) {
    const data = this.get();
    return data.likeRecords.posts.includes(postId);
  },

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

  getQuoteComments(quoteId) {
    const data = this.get();
    return data.comments[quoteId] || [];
  },

  getPostComments(postId) {
    const data = this.get();
    return data.comments['post_' + postId] || [];
  },

  addQuoteComment(quoteId, comment) {
    const data = this.get();
    const key = quoteId;
    if (!data.comments[key]) {
      data.comments[key] = [];
    }
    data.comments[key].unshift({
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
    if (!data.comments[key]) {
      data.comments[key] = [];
    }
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
    {
      id: 'q001',
      content: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。',
      source: {
        type: 'book',
        name: '思考致富',
        author: '拿破仑·希尔'
      },
      music: {
        name: '希望的曙光',
        mood: 'hope'
      }
    },
    {
      id: 'q002',
      content: '我们终此一生，就是要摆脱他人的期待，找到真正的自己。',
      source: {
        type: 'book',
        name: '无声告白',
        author: '伍绮诗'
      },
      music: {
        name: '追梦之旅',
        mood: 'dream'
      }
    },
    {
      id: 'q003',
      content: '世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱生活。',
      source: {
        type: 'book',
        name: '米开朗琪罗传',
        author: '罗曼·罗兰'
      },
      music: {
        name: '勇者之心',
        mood: 'courage'
      }
    },
    {
      id: 'q004',
      content: '当你凝视深渊时，深渊也在凝视着你。',
      source: {
        type: 'book',
        name: '善恶的彼岸',
        author: '弗里德里希·尼采'
      },
      music: {
        name: '哲学的沉思',
        mood: 'philosophy'
      }
    },
    {
      id: 'q005',
      content: '所有的大人都曾经是小孩，虽然，只有少数的人记得。',
      source: {
        type: 'book',
        name: '小王子',
        author: '安托万·德·圣-埃克苏佩里'
      },
      music: {
        name: '童心永存',
        mood: 'innocence'
      }
    },
    {
      id: 'q006',
      content: '生命中真正重要的不是你遭遇了什么，而是你记住了哪些事，又是如何铭记的。',
      source: {
        type: 'book',
        name: '百年孤独',
        author: '加西亚·马尔克斯'
      },
      music: {
        name: '时光的记忆',
        mood: 'memory'
      }
    },
    {
      id: 'q007',
      content: '我荒废了时间，时间便把我荒废了。',
      source: {
        type: 'book',
        name: '莎士比亚全集',
        author: '威廉·莎士比亚'
      },
      music: {
        name: '时间的流转',
        mood: 'time'
      }
    },
    {
      id: 'q008',
      content: '我唯一能负担的奢侈品，就是一个爱我的人。',
      source: {
        type: 'movie',
        name: '寄生虫',
        author: '奉俊昊'
      },
      music: {
        name: '温暖时光',
        mood: 'love'
      }
    },
    {
      id: 'q009',
      content: '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。',
      source: {
        type: 'book',
        name: '活着',
        author: '余华'
      },
      music: {
        name: '生命的意义',
        mood: 'life'
      }
    },
    {
      id: 'q010',
      content: '愿你出走半生，归来仍是少年。',
      source: {
        type: 'book',
        name: '愿你出走半生，归来仍是少年',
        author: '孙衍'
      },
      music: {
        name: '少年之心',
        mood: 'youth'
      }
    },
    {
      id: 'q011',
      content: '你要批评指点四周风景，首先要爬上屋顶。',
      source: {
        type: 'book',
        name: '天堂电影院',
        author: '托纳多雷'
      },
      music: {
        name: '登高望远',
        mood: 'wisdom'
      }
    },
    {
      id: 'q012',
      content: '温柔半两，从容一生。',
      source: {
        type: 'book',
        name: '等一朵花开',
        author: '林帝浣'
      },
      music: {
        name: '从容步履',
        mood: 'serenity'
      }
    },
    {
      id: 'q013',
      content: '把每一个黎明看作是生命的开始，把每一个黄昏看作是你生命的小结。',
      source: {
        type: 'book',
        name: '十力语要',
        author: '熊十力'
      },
      music: {
        name: '晨曦微露',
        mood: 'hope'
      }
    },
    {
      id: 'q014',
      content: '人生就像一杯茶，不会苦一辈子，但总会苦一阵子。',
      source: {
        type: 'book',
        name: '慧语集',
        author: '星云大师'
      },
      music: {
        name: '茶香袅袅',
        mood: 'wisdom'
      }
    },
    {
      id: 'q015',
      content: '岁月极美，在于它必然的流逝。春花、秋月、夏日、冬雪。',
      source: {
        type: 'book',
        name: '三毛全集',
        author: '三毛'
      },
      music: {
        name: '四季轮回',
        mood: 'nature'
      }
    }
  ],

  getRandomQuote() {
    const idx = Math.floor(Math.random() * this.quotes.length);
    const quote = { ...this.quotes[idx] };
    quote.music = { ...quote.music, url: `/assets/music/${quote.music.mood}.mp3` };
    return quote;
  },

  getAllQuotes() {
    return this.quotes.map(q => ({
      ...q,
      music: { ...q.music, url: `/assets/music/${q.music.mood}.mp3` }
    }));
  },

  getQuoteById(id) {
    const quote = this.quotes.find(q => q.id === id);
    if (quote) {
      return {
        ...quote,
        music: { ...quote.music, url: `/assets/music/${quote.music.mood}.mp3` }
      };
    }
    return null;
  },

  generateAIQuote() {
    const themes = [
      { word: '希望', desc: '在最黑暗的时刻，也要相信光明终会到来' },
      { word: '坚持', desc: '成功的路上并不拥挤，因为坚持下来的人不多' },
      { word: '勇气', desc: '勇敢不是不害怕，而是害怕时依然选择前行' },
      { word: '热爱', desc: '把热爱的事做到极致，便是才华' },
      { word: '平静', desc: '心若安静，风奈我何' }
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    return {
      id: 'ai_' + Date.now(),
      content: `${theme.desc}。每一天都是新的开始，每一个微光都值得被珍藏。`,
      source: {
        type: 'ai',
        name: '微光 AI',
        author: '智能生成'
      },
      music: {
        name: theme.word + '之歌',
        mood: theme.word.toLowerCase(),
        url: `/assets/music/${theme.word.toLowerCase()}.mp3`
      }
    };
  }
};

window.DataStore = DataStore;
window.QuotePool = QuotePool;

App({
  globalData: {
    quotes: [
      // ====== 文学作品 ======
      { id: 'q1', zh: '希望是美好的，也许是人间至善，而美好的事物永不消逝。', en: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.', source: '肖申克的救赎', author: '斯蒂芬·金', context: '主角安迪写给瑞德的信中所表达的信念', tag: '#希望', category: 'literature', badge: '晨曦之光' },
      { id: 'q2', zh: '世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱生活。', en: 'There is only one heroism in the world: to see the world as it is, and to love it.', source: '米开朗琪罗传', author: '罗曼·罗兰', context: '对真正勇气的最高定义', tag: '#英雄主义', category: 'literature', badge: '晨曦之光' },
      { id: 'q3', zh: '所有的大人都曾经是小孩，虽然，只有少数的人记得。', en: 'All grown-ups were once children, but only few of them remember it.', source: '小王子', author: '圣埃克苏佩里', context: '提醒我们保持童心与纯真', tag: '#童心', category: 'literature', badge: '晨曦之光' },
      { id: 'q4', zh: '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。', en: 'People live for the sake of living itself, not for anything beyond life.', source: '活着', author: '余华', context: '对生命本质最朴素的诠释', tag: '#生命', category: 'literature', badge: '晨曦之光' },
      { id: 'q5', zh: '没有人是一座孤岛，在大海里独踞。', en: 'No man is an island, entire of itself.', source: '没有人是一座孤岛', author: '约翰·多恩', context: '人与人之间深刻联系的诗意表达', tag: '#连接', category: 'literature', badge: '晨曦之光' },
      { id: 'q6', zh: '我们终此一生，就是要摆脱他人的期待，找到真正的自己。', en: 'We spend our whole lives trying to break free from others\' expectations and find our true selves.', source: '无声告白', author: '伍绮诗', context: '关于自我认知与人生意义的深刻思考', tag: '#自我', category: 'literature', badge: '晨曦之光' },

      // ====== 哲学 ======
      { id: 'q7', zh: '未经省察的人生不值得过。', en: 'The unexamined life is not worth living.', source: '申辩篇', author: '苏格拉底', context: '苏格拉底在审判中对雅典公民的告诫，强调自我反思的价值', tag: '#反思', category: 'philosophy', badge: '哲思之光' },
      { id: 'q8', zh: '人不能两次踏进同一条河流。', en: 'No man ever steps in the same river twice.', source: '哲学残篇', author: '赫拉克利特', context: '万物皆流，一切都在永恒的变化之中', tag: '#变化', category: 'philosophy', badge: '哲思之光' },
      { id: 'q9', zh: '知道自己无知，本身就是一种知识。', en: 'Knowing that you know nothing is the truest form of wisdom.', source: '理想国', author: '柏拉图', context: '真正的智慧始于承认自己的无知', tag: '#智慧', category: 'philosophy', badge: '哲思之光' },
      { id: 'q10', zh: '存在先于本质。', en: 'Existence precedes essence.', source: '存在主义是一种人道主义', author: '萨特', context: '人首先存在，然后通过自己的选择定义自己', tag: '#自由', category: 'philosophy', badge: '哲思之光' },
      { id: 'q11', zh: '人是一根会思考的芦苇。', en: 'Man is a thinking reed.', source: '思想录', author: '帕斯卡尔', context: '人的伟大不在于占据空间，而在于拥有思想', tag: '#思想', category: 'philosophy', badge: '哲思之光' },
      { id: 'q12', zh: '万物皆有裂痕，那是光照进来的地方。', en: 'There is a crack in everything, that\'s how the light gets in.', source: 'Anthem', author: '莱昂纳德·科恩', context: '不完美并非缺陷，而是光明进入的通道', tag: '#不完美', category: 'philosophy', badge: '哲思之光' },

      // ====== 心理学 ======
      { id: 'q13', zh: '你不能阻止波浪，但你可以学会冲浪。', en: 'You can\'t stop the waves, but you can learn to surf.', source: '正念心理疗法', author: '乔·卡巴金', context: '接纳与承诺疗法的核心思想——与情绪共处而非对抗', tag: '#接纳', category: 'psychology', badge: '心光' },
      { id: 'q14', zh: '你所抵抗的，会持续存在；你所接纳的，会自行消散。', en: 'What you resist persists, what you accept dissipates.', source: '荣格心理学', author: '卡尔·荣格', context: '对抗只会强化问题，接纳才是疗愈的开始', tag: '#接纳', category: 'psychology', badge: '心光' },
      { id: 'q15', zh: '你的感受是你的，但不是你的全部。', en: 'Your feelings are yours, but they are not all of you.', source: '情绪智慧', author: '丹尼尔·戈尔曼', context: '情绪管理的第一步：观察情绪而非被情绪控制', tag: '#情绪', category: 'psychology', badge: '心光' },
      { id: 'q16', zh: '真正的安全感，来自于允许一切发生。', en: 'True security comes from allowing everything to happen.', source: '心理弹性', author: '布芮妮·布朗', context: '脆弱的力量——敢于面对不确定性才是真正的坚强', tag: '#安全感', category: 'psychology', badge: '心光' },
      { id: 'q17', zh: '你不需要完美才能被爱。', en: 'You don\'t have to be perfect to be loved.', source: '不完美的礼物', author: '布芮妮·布朗', context: '归属感不需要条件，你本来的样子就足够了', tag: '#自我接纳', category: 'psychology', badge: '心光' },

      // ====== 反常识 ======
      { id: 'q18', zh: '追求幸福反而会降低幸福感。', en: 'The pursuit of happiness reduces happiness.', source: '幸福的悖论', author: '艾瑞克·威尔逊', context: '幸福是副产品，当你专注于有意义的事情时，它会自然降临', tag: '#幸福悖论', category: 'counterintuitive', badge: '逆光' },
      { id: 'q19', zh: '选择越多，你越不快乐。', en: 'More choices make you less happy.', source: '选择的悖论', author: '巴里·施瓦茨', context: '过度选择带来焦虑和后悔，限制反而带来满足', tag: '#选择', category: 'counterintuitive', badge: '逆光' },
      { id: 'q20', zh: '自信不是"我能行"，而是"不行也没关系"。', en: 'Confidence isn\'t "I can do it", it\'s "It\'s okay if I can\'t".', source: '自信的力量', author: '克里斯汀·聂夫', context: '真正的自信来源于自我接纳，而非自我肯定', tag: '#自信', category: 'counterintuitive', badge: '逆光' },
      { id: 'q21', zh: '最深刻的成长往往发生在最痛苦的时刻。', en: 'The most profound growth often happens in the most painful moments.', source: '创伤后成长', author: '理查德·泰代斯基', context: '心理弹性研究表明，创伤可以成为重生的契机', tag: '#成长', category: 'counterintuitive', badge: '逆光' },
      { id: 'q22', zh: '你越努力控制，越失控。', en: 'The harder you try to control, the more you lose control.', source: '接纳与承诺疗法', author: '史蒂文·海斯', context: '控制的悖论——放手才是真正掌控的开始', tag: '#控制', category: 'counterintuitive', badge: '逆光' },
      { id: 'q23', zh: '忘记目标，专注于系统。', en: 'Forget the goal, focus on the system.', source: '原子习惯', author: '詹姆斯·克利尔', context: '赢家与输家有相同的目标，区别在于他们建立的系统', tag: '#系统思维', category: 'counterintuitive', badge: '逆光' },
      { id: 'q24', zh: '慢即是快。', en: 'Slow is smooth, smooth is fast.', source: '刻意练习', author: '安德斯·艾利克森', context: '看似缓慢的扎实基础，最终带来最快的进步', tag: '#耐心', category: 'counterintuitive', badge: '逆光' },
      { id: 'q25', zh: '你不需要找到激情，你需要培养它。', en: 'You don\'t find passion, you cultivate it.', source: '优秀到不能被忽视', author: '卡尔·纽波特', context: '激情是精通的副产品，而非起点', tag: '#激情', category: 'counterintuitive', badge: '逆光' },
      { id: 'q26', zh: '承认"我不知道"是最有力的回答。', en: 'Saying "I don\'t know" is the most powerful answer.', source: '黑天鹅', author: '纳西姆·塔勒布', context: '承认无知比假装知道更需要智慧，也更能抵御风险', tag: '#认知', category: 'counterintuitive', badge: '逆光' },

      // ====== 励志 ======
      { id: 'q27', zh: '你不需要看到整个楼梯，只要迈出第一步。', en: 'You don\'t have to see the whole staircase, just take the first step.', source: '演讲集', author: '马丁·路德·金', context: '信念不是看清终点，而是有勇气开始', tag: '#勇气', category: 'literature', badge: '晨曦之光' },
      { id: 'q28', zh: '成功不是终点，失败不是末日，唯有勇气才是永恒。', en: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', source: '演讲集', author: '丘吉尔', context: '二战最黑暗时期对英国人民的鼓舞', tag: '#勇气', category: 'literature', badge: '晨曦之光' },
      { id: 'q29', zh: '做你自己，因为别人都有人做了。', en: 'Be yourself; everyone else is already taken.', source: '自传', author: '奥斯卡·王尔德', context: '独特性是最珍贵的品质', tag: '#自我', category: 'literature', badge: '晨曦之光' },
      { id: 'q30', zh: '种一棵树最好的时间是十年前，其次是现在。', en: 'The best time to plant a tree was ten years ago. The second best time is now.', source: '非洲谚语', author: '佚名', context: '行动永远不晚，此刻就是最好的开始', tag: '#行动', category: 'literature', badge: '晨曦之光' }
    ]
  }
})

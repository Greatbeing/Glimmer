if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker 注册成功'))
      .catch(err => console.log('Service Worker 注册失败:', err));
  });
}

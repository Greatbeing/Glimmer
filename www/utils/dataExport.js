// 数据导出/导入工具
// 添加到 index.html 中的设置面板或空间页面

const dataExport = {
  // 导出数据为 JSON 文件
  exportData() {
    try {
      const data = store.data;
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          caught: data.caught || [],
          posts: data.posts || [],
          likedQuotes: data.likedQuotes || [],
          likedPosts: data.likedPosts || []
        }
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glimmer-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('✓ 数据导出成功');
      return true;
    } catch (e) {
      console.error('导出失败:', e);
      showToast('导出失败：' + e.message);
      return false;
    }
  },

  // 从文件导入数据
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          
          // 验证备份格式
          if (!backup.version || !backup.data) {
            throw new Error('无效的备份文件格式');
          }
          
          // 确认导入
          const confirmed = confirm(
            `确定要导入备份数据吗？\n` +
            `- 已捕捉语录：${backup.data.caught?.length || 0} 条\n` +
            `- 发布的帖子：${backup.data.posts?.length || 0} 条\n` +
            `- 点赞的语录：${backup.data.likedQuotes?.length || 0} 条\n\n` +
            `注意：这将覆盖当前本地数据！`
          );
          
          if (!confirmed) {
            resolve(false);
            return;
          }
          
          // 合并数据（避免完全覆盖）
          const currentData = store.data;
          
          // 合并已捕捉语录（去重）
          const existingIds = new Set(currentData.caught.map(x => x.id));
          backup.data.caught?.forEach(item => {
            if (!existingIds.has(item.id)) {
              currentData.caught.push(item);
            }
          });
          
          // 合并帖子（去重）
          const postIds = new Set(currentData.posts.map(x => x.id));
          backup.data.posts?.forEach(item => {
            if (!postIds.has(item.id)) {
              currentData.posts.push(item);
            }
          });
          
          // 合并点赞记录
          currentData.likedQuotes = [
            ...new Set([
              ...(currentData.likedQuotes || []),
              ...(backup.data.likedQuotes || [])
            ])
          ];
          
          currentData.likedPosts = [
            ...new Set([
              ...(currentData.likedPosts || []),
              ...(backup.data.likedPosts || [])
            ])
          ];
          
          // 保存
          localStorage.setItem(store.key, JSON.stringify(currentData));
          store.init(); // 重新初始化
          
          showToast(`✓ 导入成功！新增 ${currentData.caught.length} 条语录`);
          resolve(true);
          
        } catch (err) {
          console.error('导入失败:', err);
          showToast('导入失败：' + err.message);
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsText(file);
    });
  },

  // 创建导入文件输入框
  showImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.importData(file);
      }
    };
    input.click();
  },

  // GitHub Gist 同步（可选高级功能）
  async syncToGist(token) {
    try {
      const data = store.data;
      const gistData = {
        description: 'Glimmer Daily Quotes Backup',
        public: false,
        files: {
          'glimmer-data.json': {
            content: JSON.stringify({
              version: '1.0',
              syncedAt: new Date().toISOString(),
              data
            })
          }
        }
      };

      // 检查是否已有 Gist
      let gistId = localStorage.getItem('glimmer_gist_id');
      
      let url = 'https://api.github.com/gists';
      let method = 'POST';
      
      if (gistId) {
        url += `/${gistId}`;
        method = 'PATCH';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gistData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || '同步失败');
      }

      const result = await response.json();
      
      // 保存 Gist ID 以便下次更新
      if (!gistId) {
        localStorage.setItem('glimmer_gist_id', result.id);
      }

      showToast('✓ 同步到 GitHub 成功');
      return result;
      
    } catch (e) {
      console.error('Gist 同步失败:', e);
      showToast('同步失败：' + e.message);
      throw e;
    }
  },

  // 从 Gist 恢复数据
  async restoreFromGist(token) {
    try {
      const gistId = localStorage.getItem('glimmer_gist_id');
      if (!gistId) {
        throw new Error('未找到云端备份');
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取备份失败');
      }

      const gist = await response.json();
      const content = gist.files['glimmer-data.json'].content;
      const backup = JSON.parse(content);

      // 验证版本
      if (!backup.version) {
        throw new Error('备份格式不正确');
      }

      // 恢复数据
      localStorage.setItem(store.key, JSON.stringify(backup.data));
      store.init();

      showToast('✓ 从云端恢复成功');
      return backup;
      
    } catch (e) {
      console.error('Gist 恢复失败:', e);
      showToast('恢复失败：' + e.message);
      throw e;
    }
  }
};

// 在设置面板中添加导出/导入按钮
function addExportImportButtons() {
  const settingsPanel = document.querySelector('#settingsPanel');
  if (!settingsPanel) return;
  if (document.getElementById('dataExportSection')) return;

  const section = document.createElement('div');
  section.id = 'dataExportSection';
  section.className = 'settings-section';
  section.style.marginTop = '24px';
  section.style.paddingTop = '24px';
  section.style.borderTop = '1px solid rgba(255,255,255,0.1)';
  
  section.innerHTML = `
    <h3 style="font-size: 14px; color: var(--amber-200); margin-bottom: 12px;">数据管理</h3>
    <div style="display: flex; gap: 12px;">
      <button id="exportBtn" class="settings-action-btn" style="flex: 1;">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        导出数据
      </button>
      <button id="importBtn" class="settings-action-btn" style="flex: 1;">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
        </svg>
        导入数据
      </button>
    </div>
    <div class="settings-hint" style="margin-top: 8px;">
      导出数据可备份到本地，导入数据可从备份恢复
    </div>
  `;
  
  settingsPanel.appendChild(section);

  // 绑定事件
  setTimeout(() => {
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      dataExport.exportData();
    });
    
    document.getElementById('importBtn')?.addEventListener('click', () => {
      dataExport.showImportDialog();
    });
  }, 0);
}

// 添加样式
const exportStyles = document.createElement('style');
exportStyles.textContent = `
  .settings-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 8px;
    color: var(--amber-300);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .settings-action-btn:hover {
    background: rgba(245, 158, 11, 0.25);
  }
  
  .settings-action-btn:active {
    transform: scale(0.98);
  }
`;
document.head.appendChild(exportStyles);

// 在页面加载完成后添加按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addExportImportButtons);
} else {
  addExportImportButtons();
}

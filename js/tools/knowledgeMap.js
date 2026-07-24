/**
 * knowledgeMap — 2D 可拖拽知识树
 * 从文章标题自动提取树结构，渲染为可交互的 2D 节点图
 * 挂载位置：文章左侧边栏目录下方
 */
export function initKnowledgeMap() {
  const sidebar = document.querySelector('.article-left-sidebar');
  if (!sidebar) return;

  // 找到 TOC 容器，在其后插入
  const tocContainer = sidebar.querySelector('.als-toc');
  if (!tocContainer) return;

  // 如果已有知识地图容器，跳过
  if (sidebar.querySelector('.km-container')) return;

  // 从页面 DOM 提取标题树
  const treeData = extractHeadingTree();
  if (!treeData || treeData.length === 0) return;

  // 创建容器
  const kmContainer = document.createElement('div');
  kmContainer.className = 'km-container';
  kmContainer.innerHTML = '<div class="km-title">📚 知识树</div>';

  const canvas = document.createElement('canvas');
  canvas.className = 'km-canvas';
  canvas.width = 360;
  canvas.height = 300;
  kmContainer.appendChild(canvas);

  const detailPanel = document.createElement('div');
  detailPanel.className = 'km-detail-panel';
  kmContainer.appendChild(detailPanel);

  // 插入到 toc 之后
  tocContainer.parentNode.insertBefore(kmContainer, tocContainer.nextSibling);

  // 渲染
  const ctx = canvas.getContext('2d');
  const layout = buildTreeLayout(treeData, canvas.width, canvas.height);
  let dragNode = null;
  let dragOffset = { x: 0, y: 0 };
  let panOffset = { x: 0, y: 0 };
  let isPanning = false;
  let panStart = { x: 0, y: 0 };

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    // 画连线
    ctx.strokeStyle = 'var(--border-color, rgba(128,128,128,0.3))';
    ctx.lineWidth = 1.5;
    for (const node of layout) {
      if (node.parent !== null) {
        const parent = layout[node.parent];
        ctx.beginPath();
        ctx.moveTo(parent.x, parent.y);
        // 曲线连接
        const cx = (parent.x + node.x) / 2;
        ctx.quadraticCurveTo(cx, parent.y, node.x, node.y);
        ctx.stroke();
      }
    }

    // 画节点
    for (const node of layout) {
      const x = node.x, y = node.y;
      const r = node.depth === 0 ? 22 : 16;
      const isActive = dragNode === node;

      // 阴影
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = isActive ? 12 : 4;

      // 节点圆
      const gradient = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
      if (node.depth === 0) {
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#4f46e5');
      } else if (node.depth === 1) {
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#7c3aed');
      } else {
        gradient.addColorStop(0, '#a78bfa');
        gradient.addColorStop(1, '#8b5cf6');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 边框高亮
      if (isActive) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 标签文字 — 缩略显示
      if (node.depth <= 2) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = node.label.length > 6 ? node.label.substring(0, 5) + '…' : node.label;
        ctx.fillText(label, x, y + 1);
      }
    }

    ctx.restore();
  }

  // 鼠标/触摸事件
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left - panOffset.x,
      y: clientY - rect.top - panOffset.y
    };
  }

  function findNode(cx, cy) {
    for (let i = layout.length - 1; i >= 0; i--) {
      const n = layout[i];
      const r = n.depth === 0 ? 22 : 16;
      const dx = cx - n.x, dy = cy - n.y;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }

  function onPointerDown(e) {
    const pos = getCanvasPos(e);
    const node = findNode(pos.x, pos.y);
    if (node) {
      dragNode = node;
      dragOffset.x = pos.x - node.x;
      dragOffset.y = pos.y - node.y;
      canvas.style.cursor = 'grabbing';
    } else {
      isPanning = true;
      panStart.x = (e.touches ? e.touches[0].clientX : e.clientX) - panOffset.x;
      panStart.y = (e.touches ? e.touches[0].clientY : e.clientY) - panOffset.y;
      canvas.style.cursor = 'grab';
    }
  }

  function onPointerMove(e) {
    e.preventDefault();
    if (dragNode) {
      const pos = getCanvasPos(e);
      dragNode.x = pos.x - dragOffset.x;
      dragNode.y = pos.y - dragOffset.y;
      render();
    } else if (isPanning) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      panOffset.x = clientX - panStart.x;
      panOffset.y = clientY - panStart.y;
      render();
    } else {
      const pos = getCanvasPos(e);
      const node = findNode(pos.x, pos.y);
      canvas.style.cursor = node ? 'pointer' : 'default';
    }
  }

  function onPointerUp(e) {
    if (dragNode) {
      // 点击事件：弹出详情
      showNodeDetail(dragNode, detailPanel);
      dragNode = null;
      render();
      canvas.style.cursor = 'default';
    } else if (isPanning) {
      // 检查是否为点击（非拖拽）
      isPanning = false;
      canvas.style.cursor = 'default';
    }
    isPanning = false;
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('mouseleave', () => { dragNode = null; isPanning = false; render(); });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onPointerMove(e); });
  canvas.addEventListener('touchend', (e) => { e.preventDefault(); onPointerUp(e); });

  // 首次渲染
  render();
}

/**
 * 从页面的 h1-h6 标题提取树结构
 */
function extractHeadingTree() {
  const content = document.querySelector('.article-content');
  if (!content) return null;

  const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) return null;

  const stack = [];
  const result = [];

  for (const h of headings) {
    const level = parseInt(h.tagName.substring(1), 10);
    const text = h.textContent.trim();

    // 找到父级
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    const parentIdx = stack.length > 0 ? stack[stack.length - 1].idx : null;

    const node = {
      level,
      label: text,
      parent: parentIdx,
      idx: result.length,
      children: [],
      // 可扩展的详情信息
      detail: generateDetail(text, level),
    };

    if (parentIdx !== null) {
      result[parentIdx].children.push(node.idx);
    }

    stack.push({ level, idx: result.length });
    result.push(node);
  }

  return result;
}

/**
 * 为节点生成详情（可扩展）
 */
function generateDetail(text, level) {
  // 从页面内容中提取节点上下文片段
  return {
    title: text,
    summary: '',
    tags: [],
    links: [],
  };
}

/**
 * 构建树布局（力导向 / 简单树布局）
 */
function buildTreeLayout(treeData, width, height) {
  if (!treeData || treeData.length === 0) return [];

  // 按层级分组
  const byLevel = {};
  for (const node of treeData) {
    if (!byLevel[node.level]) byLevel[node.level] = [];
    byLevel[node.level].push(node);
  }

  const layout = [];
  const levelSpacing = 80;
  const verticalStart = 40;

  // 计算每层的 Y 位置
  const levelY = {};
  const maxLevel = treeData.reduce((m, n) => Math.max(m, n.level), 0);
  const minLevel = treeData.reduce((m, n) => Math.min(m, n.level), 0);
  const levelRange = maxLevel - minLevel || 1;

  // 力导向 + 分层布局
  // 先按父节点分配位置
  const placed = new Map();

  function placeNode(idx, x, y) {
    if (placed.has(idx)) return placed.get(idx);
    const node = treeData[idx];
    const result = { ...node, x, y };
    placed.set(idx, result);

    // 放置子节点
    const children = node.children;
    if (children.length > 0) {
      const childLevel = treeData[children[0]].level;
      const childSpacing = Math.min(60, width / (children.length + 1));
      const totalWidth = (children.length - 1) * childSpacing;
      const startX = x - totalWidth / 2;

      for (let i = 0; i < children.length; i++) {
        placeNode(children[i], startX + i * childSpacing, y + levelSpacing);
      }
    }

    return result;
  }

  // 找根节点
  const root = treeData[0];
  placeNode(root.idx || 0, width / 2, verticalStart);

  // 转换为数组
  const result = [];
  for (let i = 0; i < treeData.length; i++) {
    if (placed.has(i)) {
      result.push(placed.get(i));
    }
  }

  return result;
}

/**
 * 显示节点详情面板
 */
function showNodeDetail(node, panel) {
  if (!panel) return;
  panel.innerHTML = `
    <div class="km-detail-close">✕</div>
    <div class="km-detail-title">${node.label}</div>
    <div class="km-detail-meta">层级 ${node.level} · ${node.children.length} 个子节点</div>
    <div class="km-detail-body">
      <p>${node.detail?.summary || '暂无详细描述'}</p>
    </div>
  `;
  panel.classList.add('km-detail-show');

  panel.querySelector('.km-detail-close').addEventListener('click', () => {
    panel.classList.remove('km-detail-show');
  });
}

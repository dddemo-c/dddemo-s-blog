/**
 * gitTreeToc — 重写 post-toc 为 Git 树状结构
 * 遍历 .post-toc > .nav 的 ol/li 嵌套 DOM，每行生成带树线前缀的文本
 */
export function initGitTreeToc() {
  const tocContainer = document.querySelector('.als-toc-compact .post-toc');
  if (!tocContainer) return;

  const rootNav = tocContainer.querySelector(':scope > .nav');
  if (!rootNav) return;

  // 收集所有行及其层级信息
  const rows = [];

  function walk(node, depth, parentLiIndex, parentLastChild) {
    // node 是一个 ol 或 ul
    const items = node.children;
    for (let i = 0; i < items.length; i++) {
      const li = items[i];
      const isLast = i === items.length - 1;
      const a = li.querySelector(':scope > a.nav-link');
      const textNode = a ? a.querySelector('.nav-text') : null;
      const text = textNode ? textNode.textContent : (a ? a.textContent : '');

      rows.push({
        depth,
        text,
        href: a ? a.getAttribute('href') : null,
        isLast,
        parentIsLast: parentLastChild,
      });

      // 找子 nav-child
      const childOl = li.querySelector(':scope > ol.nav-child, :scope > ul.nav-child');
      if (childOl && childOl.children.length > 0) {
        walk(childOl, depth + 1, i, isLast);
      }
    }
  }

  walk(rootNav, 0, -1, true);

  // 构建树线前缀
  // 需要知道每一列的祖先折叠状态
  // ancestors[i] = true 表示第 i 层在当前位置之后还有后续节点（需要画 │）
  const ancestorHasMore = [];

  function computePrefix(ri) {
    const row = rows[ri];
    const parts = [];
    // 对于第 d 列 (0 <= d < row.depth)：
    // 当前行的第 d 层祖先（depth=d）在它之后还有没有子节点（depth=d+1）？
    // 从 ri+1 往后扫描，直到遇到 depth <= d 的行（表示已离开当前祖先的范围）
    // 如果中间有 depth === d+1 的行，说明有兄弟节点 → 画 │
    for (let d = 0; d < row.depth; d++) {
      const childDepth = d + 1;
      let hasMore = false;
      for (let j = ri + 1; j < rows.length; j++) {
        if (rows[j].depth <= d) {
          // 离开了当前祖先的子树
          break;
        }
        if (rows[j].depth === childDepth) {
          hasMore = true;
          break;
        }
        // depth > childDepth: 仍在子树内，继续
      }
      parts.push(hasMore ? '│' : ' ');
    }
    // 最后一列：当前行的连接符号
    if (row.isLast) {
      parts.push('└──');
    } else {
      parts.push('├──');
    }
    return parts.join('\u00a0');
  }

  // 清空容器，填入新结构
  tocContainer.innerHTML = '';

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = computePrefix(i);

    const rowDiv = document.createElement('div');
    rowDiv.className = 'als-git-row';

    const prefixSpan = document.createElement('span');
    prefixSpan.className = 'als-git-prefix';
    prefixSpan.textContent = prefix;
    rowDiv.appendChild(prefixSpan);

    if (r.href) {
      const a = document.createElement('a');
      a.className = 'als-git-label';
      a.href = r.href;
      // 保留锚点导航功能
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = decodeURI(r.href.replace('#', ''));
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      a.textContent = r.text;
      rowDiv.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.className = 'als-git-label';
      span.textContent = r.text;
      rowDiv.appendChild(span);
    }

    tocContainer.appendChild(rowDiv);
  }
}

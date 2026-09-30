"use strict";

/**
 * 保护行间公式，避免被 markdown 渲染器改写
 *
 * 问题：hexo-filter-mathjax（0.9.1）挂在 `after_post_render`、优先级 5，
 * 到那时排版才发生；而 hexo-renderer-marked 在那之前就已经把 $$...$$ 里的
 * 内容当普通正文处理过了，于是：
 *
 *   \left\{    ->  \left{         反斜杠转义被吃掉
 *   \\         ->  <br>           行尾反斜杠被当成硬换行
 *   _{...}     ->  <em>...</em>   下划线被当成强调
 *
 * 结果就是 \left\{\begin{aligned}...\\...\end{aligned}\right. 这类方程组
 * 会碎成「半截 SVG + 半截源码」。
 *
 * 做法：
 *   before_post_render  把每段 $$...$$ 换成纯字母数字占位符（优先级 5，抢在最前面）
 *   after_post_render   原样换回来（优先级 1，早于 mathjax 的 5）
 *
 * 只认 $$...$$ 这一种定界符：它没有歧义，不会误伤正文里当货币符号用的 $。
 * 代码块里的 $$ 也会被换掉再换回来，前后完全一致，不影响高亮。
 */

const PLACEHOLDER_PREFIX = "MJXDISPLAYMATHPLACEHOLDER";
const PLACEHOLDER_SUFFIX = "ENDPLACEHOLDER";

const PLACEHOLDER_REGEX = new RegExp(
  `${PLACEHOLDER_PREFIX}(\\d+)${PLACEHOLDER_SUFFIX}`,
  "g",
);

/** 非贪婪匹配一段完整的行间公式。 */
const DISPLAY_MATH_REGEX = /\$\$[\s\S]+?\$\$/g;

/** 占位符 -> 原始公式。跨 before/after 两个阶段共用。 */
const formulaStore = new Map();

let placeholderSeed = 0;

/**
 * 把行间公式替换成占位符。
 * @param {string} content - 文章源码。
 * @returns {string} 替换后的源码。
 */
function protectDisplayMath(content) {
  return String(content ?? "").replace(DISPLAY_MATH_REGEX, (formula) => {
    const placeholder = `${PLACEHOLDER_PREFIX}${placeholderSeed++}${PLACEHOLDER_SUFFIX}`;
    formulaStore.set(placeholder, formula);
    return placeholder;
  });
}

/**
 * 把占位符还原成原始公式。
 * @param {string} content - 渲染后的 HTML。
 * @returns {string} 还原后的 HTML。
 */
function restoreDisplayMath(content) {
  const text = String(content ?? "");

  if (!text.includes(PLACEHOLDER_PREFIX)) {
    return text;
  }

  return text.replace(PLACEHOLDER_REGEX, (placeholder) =>
    formulaStore.get(placeholder) ?? placeholder,
  );
}

hexo.extend.filter.register(
  "before_post_render",
  (data) => {
    if (typeof data.content === "string") {
      data.content = protectDisplayMath(data.content);
    }

    return data;
  },
  5,
);

hexo.extend.filter.register(
  "after_post_render",
  (data) => {
    if (typeof data.content === "string") {
      data.content = restoreDisplayMath(data.content);
    }

    return data;
  },
  1,
);

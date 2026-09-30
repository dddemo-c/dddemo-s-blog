"use strict";

/**
 * OI Wiki 风格提示框 · 静态 div 版
 *
 * 与同目录 oiwiki.js 的区别：
 *   oiwiki.js   -> <details class="warning">   可折叠，点击标题展开/收起
 *   oiwiki-box.js -> <div class="admonition warning">  固定展开，不可折叠
 *
 * 生成的结构与 https://oi-wiki.org/graph/concept/ 页面上的 warning 框逐字一致：
 *   <div class="admonition warning">
 *     <p class="admonition-title">警告</p>
 *     <p>内容</p>
 *   </div>
 *
 * 用法：
 *   {% adbox warning %}内容{% endadbox %}
 *   {% adbox warning 注意溢出 %}内容{% endadbox %}
 *   {% adbox type="tip" title="提示" %}内容{% endadbox %}
 *
 * 别名 {% box %} / {% admonitionbox %} 等价。
 * 也可以直接在文章里手写原生 <div class="admonition note"> 结构，
 * 样式同样生效（见 source/css/layout/_modules/oiwiki-box.styl）。
 */

const {
  parseTagArgs,
  getNamedString,
} = require("../utils/tag-args");
const { html } = require("../utils/html");
const { renderMarkdownTagSafe } = require("../utils/markdown-swig");

/** 与 OI Wiki / Material for MkDocs 一致的 12 种类型。 */
const TYPES = [
  "note", "abstract", "info", "tip", "success", "question",
  "warning", "failure", "danger", "bug", "example", "quote",
];

/** 未指定标题时的默认标题。 */
const DEFAULT_TITLES = {
  note: "备注",
  abstract: "摘要",
  info: "信息",
  tip: "提示",
  success: "成功",
  question: "疑问",
  warning: "警告",
  failure: "失败",
  danger: "危险",
  bug: "缺陷",
  example: "示例",
  quote: "引用",
};

/**
 * 解析标签参数，同时支持命名参数与位置参数。
 * @param {string} rawArgs - 标签里的原始参数字符串。
 * @returns {{type: string, title: string}}
 */
function parseBoxArgs(rawArgs) {
  const parsed = parseTagArgs(rawArgs);
  const named = parsed.named || {};
  const positional = (parsed.positional || []).filter(Boolean);

  // 第一个位置参数只有在是合法类型时才当类型用，否则整串当标题
  const head = (positional[0] || "").toLowerCase();
  const headIsType = TYPES.includes(head);
  const namedType = getNamedString(named, "type", "").trim().toLowerCase();

  const type = TYPES.includes(namedType)
    ? namedType
    : headIsType
      ? head
      : "note";

  const restTitle = (headIsType ? positional.slice(1) : positional).join(" ").trim();
  const title = getNamedString(named, "title", "").trim() || restTitle || DEFAULT_TITLES[type];

  return { type, title };
}

/**
 * 渲染静态提示框。
 * @param {string[]} args - Hexo 传入的参数数组。
 * @param {string} content - 标签体内容。
 * @returns {Promise<string>} HTML。
 */
async function postAdmonitionBox(args, content) {
  const { type, title } = parseBoxArgs(args.join(" ").trim());

  const renderedContent = await renderMarkdownTagSafe({
    hexo,
    content,
    postContext: this,
  });

  return html`
    <div class="admonition ${type}">
      <p class="admonition-title">${title}</p>
      ${renderedContent}
    </div>
  `;
}

hexo.extend.tag.register("adbox", postAdmonitionBox, { ends: true, async: true });
hexo.extend.tag.register("box", postAdmonitionBox, { ends: true, async: true });
hexo.extend.tag.register("admonitionbox", postAdmonitionBox, { ends: true, async: true });

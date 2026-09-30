"use strict";

/**
 * OI Wiki 风格提示框（复刻 Material for MkDocs 的 admonition / details）
 *
 * 生成的结构与 OI Wiki 线上完全一致：
 *   <details class="note" open>
 *     <summary>标题</summary>
 *     <p>内容</p>
 *   </details>
 *
 * 用法：
 *   {% ad note %}内容{% endad %}
 *   {% ad note 标题 %}内容{% endad %}
 *   {% ad warning 注意 closed %}内容{% endad %}
 *   {% ad type="tip" title="提示" open=false %}内容{% endad %}
 *
 * 别名 {% admonition %} 等价。
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

const isTruthy = (value) => ["1", "true", "yes", "on"].includes(value);
const isFalsy = (value) => ["0", "false", "no", "off"].includes(value);

/**
 * 解析标签参数。同时支持命名参数与位置参数。
 * @param {string} rawArgs - 标签里的原始参数字符串。
 * @returns {{type: string, title: string, open: boolean}}
 */
function parseAdmonitionArgs(rawArgs) {
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

  // 默认展开。OI Wiki 的 ??? 默认收起、???+ 展开；博客里正文更该直接可见。
  let open = true;
  const namedOpen = getNamedString(named, "open", "").trim().toLowerCase();
  if (isTruthy(namedOpen)) {
    open = true;
  } else if (isFalsy(namedOpen)) {
    open = false;
  }
  const flags = positional.map((item) => item.toLowerCase());
  if (flags.includes("closed") || flags.includes("close")) {
    open = false;
  }
  if (flags.includes("open") || flags.includes("opened")) {
    open = true;
  }

  return { type, title, open };
}

/**
 * 渲染提示框。
 * @param {string[]} args - Hexo 传入的参数数组。
 * @param {string} content - 标签体内容。
 * @returns {Promise<string>} HTML。
 */
async function postAdmonition(args, content) {
  const { type, title, open } = parseAdmonitionArgs(args.join(" ").trim());

  const renderedContent = await renderMarkdownTagSafe({
    hexo,
    content,
    postContext: this,
  });

  const openAttr = open ? " open" : "";

  return html`
    <details class="${type}"${openAttr}>
      <summary>${title}</summary>
      ${renderedContent}
    </details>
  `;
}

hexo.extend.tag.register("ad", postAdmonition, { ends: true, async: true });
hexo.extend.tag.register("admonition", postAdmonition, { ends: true, async: true });

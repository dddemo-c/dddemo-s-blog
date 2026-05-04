---
title: Hermes--一周测评
date: 2026-05-04 9:30:00
mathjax: true
sticky: 2
categories:
  - 信息学
  - 信息学/agent框架
tags: 
  - 信息学
  - 信息学/agent框架
  - 大模型
  - Typescript

---

> 我进行了一次为期一周的hermes实际体验测评!

## hermes——优化工作流的神力

### 从openclaw开始

提到**openclaw**，我们都并不陌生，作为现在许多企业与个人开发者的agent框架，在优化企业职能与个人开发者工作流中占市场比很大，直到今天，其内在的一些不足之处，网上对其的吐槽数不计数，大致分为两种：**一是说它token浪费严重，二是说它上下文能力弱**，其实本质来说就是它上下文能力不足，它的记忆系统就是将上下文打包放到memory文件夹里，然后需要时再全部查找读取，同时最严重的问题正是这里：它总是会忘记存储记忆（也许这和模型不能不有关），导致session之间衔接不齐，工作流体验糟糕。

在2026年初，openclaw刚刚推出时，得益于其新颖与开源式的普及应用，同时作为行业新星，它独特的市场广大的需求使得它作为新星一直火到现在（实际上 2025 年 11 月openclaw就已经名为Clawbot推出，可见时间是重要的优势），实际客观地说，openclaw的框架体系做的不赖，从agent核心信息文件（**soul.md,agent.md**），到skills生态，再到心跳检查,以及类似web-search这样的内置技能，都是一个开源项目的顶配设计，废话不多说，一下是openclaw的架构：


<div class="comparison-table">

| 层级 | 说明 | 包含组件 |
|:---|:---|:---|
| **用户交互层** | 多平台消息接入 | 飞书 / Telegram / Discord / WhatsApp / Slack / Web 控制面板 / CLI |
| **Gateway 网关层** | 核心消息路由与调度 | 消息归一化 → 会话管理 (SQLite) → 权限审批 (/approve) → 多用户隔离 → 插件系统 / 技能市场 (npm) → 内置渠道 (Email / RSS / Webhook / Cron) |
| **AI 模型层** | 多模型推理引擎 | OpenAI / Anthropic / DeepSeek / Ollama / OpenRouter → 多智能体路由 → 子代理编排 → Function Calling |

</div>

<div class="comparison-table">

| 分类 | 技能 | 说明 |
|:---|:---|:---|
| **内置技能** | cron | 定时任务调度 |
| | email | 邮件收发 |
| | rss | RSS 订阅监控 |
| | webhook | HTTP Webhook 触发 |
| | script | 本地脚本执行 |
| | fetch | 网页抓取 |
| **社区技能** (npm install) | @openclaw/github | GitHub 监控 / PR / Issue |
| | @openclaw/notion | Notion 笔记管理 |
| | @openclaw/calendar | Google / Outlook 日历 |
| | @openclaw/gpt-sovits | AI 语音合成 |
| **开发脚手架** | openclaw create-skill | TypeScript SDK + 标准化接口 (trigger/action/middleware) |

</div>

```
用户发消息 ──► Gateway 接收 ──► 消息归一化 ──► 会话持久化 ──► 权限检查
                                                        │
                                                    ┌───▼──────────┐
                                                    │ 审批弹窗      │
                                                    │ /approve      │
                                                    │ /deny         │
                                                    │ once/session  │
                                                    │ /always       │
                                                    └───┬──────────┘
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │ LLM 推理  │
                                                  │ + 工具执行 │
                                                  └──────────┘
```


OpenClaw 的架构设计方向是对的——**Gateway 路由 + 插件扩展 + 多模型支持**。但它目前存在两个核心痛点：

1. **上下文能力弱**：记忆系统本质是把历史打包存到 memory 文件夹，每次全部读取，既不精准又浪费 token
2. **技能深度不足**：每个插件往往是单点功能，缺乏链式编排的深度，复杂任务需要用户自己组合

### Hermes深度体验

- #### 起源

在使用了openclaw将近两个月后，我的新鲜感和体验感都被消磨殆尽，github上的各种框架的涌出激发了我对新框架的需求和查找，**hermes**成为了一个不二之选

- #### 深度体验

- 在测评体验之前，我不得不提一句，我使用openclaw时使用了英伟达提供的免费minmax-2.5api，所以体验感差不得不有一些个人主观意见，我选择了性价比最高的模型也是行业新星（*其实只是在各种大模型打的最激烈的时候空档了而已*）的deepseek-v4 falsh版本（pro的价格没那么亲民，同时有些小企业也甚至只装falsh）

- ###### 安装与配置

在hermes官网，最推荐也是最适用的安装方法就是把[中文社区网址](https://hermesagent.org.cn)直接发给你的**openclaw**，让他自己访问并阅读文章，然后给他发这样一段话：
```    md
请把这个 MCP server 加到你的配置里：https://mcp.hermesagent.org.cn/v1 
（Streamable HTTP，无需 API Key、无需登录）。
加完后用它帮我查 Hermes Agent 中文文档来指导我完成安装。
```
考虑到hermes是Linux生态的产物，我作为一个windows用户在wsl2安装这就消耗了很多时间，具体的安装与配置流程可以参考（[官网](https://hermesagent.org.cn/docs/getting-started/installation)）也可以自己上网查查教程。

配置几乎和openclaw差不多，但多了一个核心的点：**上下文对话相关的参数设定**，这是hermes最精辟的几点之一：
- agent.max_turns — 最大轮数
- **compression.* — 上下文压缩**
- terminal.timeout -命令超时
- delegation.max_iterations — 子代理迭代次数
- memory.* — 跨会话记忆
参数最好就和默认一样即可，一般能满足使用，但上下文压缩是特例，为了节约token，可以大幅调整（原因后面会说）
然后你可以选择配置你的通讯工具，其实命令行真的不错，毕竟是最原生态的，我选用了常见的飞书。

配置到这里，基本就可以开启你的hermes之旅了，模型ds是在是夯，5/31之前还打折，百万输入输出和不要钱一样。

- ##### 具体工作体验

在部署完hermes当天晚上，我迫不及待开始用它做了第一个项目，灵感来源于之前看过的一个全栈程序员自媒体分享的一个仿生鸟群项目，typescript架构，我打算做一个类似的，但可以调节参数的开源版。

在和hermes说了我的需求后，甩给我一个OK就开始干活了，在实际使用时，hermes和openclaw不太一样，它默认就会抛出所有工作流程，包括工具调用，命令输出等等,提一句，**它默认执行命令行命令时会给用户发一个许可请求，同意了才会继续**，可以调为只有关于重要的命令才问询，否则会很难受。

追问功能是hermes上下文一个精辟的点，hermes在遇到一个工作有多种不同的合理做法，会对用户发起询问，相当于在模型中添加一个阻塞任务节点，等待用户输入再继续执行，遗憾的是，对于一些想让模型完全自动化的用户，框架本身没有实现自动默认选项，但每次框架都会自动判断有没有必要问询用户，来增强体验感，对一般用户来说够用了（除非你打算搞一个自动盯盘的助手），就像下面这样

![问询机制](/images/ask.png)
![追问回复](/images/oput.png)

飞书上几乎差不多，这里就不展示了

衔接上文，那个鸟群项目，我是分了三步走，从两个鸟之间的分离力，到种群行为中的队列行为，最后是外界与内部系统干扰。hermes很干练的开始写算法，这里我只展示队列行为：

在此之前，我们需要初始化鸟群个体：
```   Typescript
// 空间形态
function buildGrid(boids, w, h) {
  grid = {};
  for (var i = 0; i < boids.length; i++) {
    var b = boids[i];
    var cx = Math.floor(b.pos.x / CELL_SIZE);
    var cy = Math.floor(b.pos.y / CELL_SIZE);
    var key = cx + ',' + cy;
    if (!grid[key]) grid[key] = [];
    grid[key].push(b);
  }
}
// 速度方向
function Boid(x, y, id) {
  this.id = id;
  this.pos = new Vec2(x, y);
  var angle = Math.random() * Math.PI * 2;
  var speed = CONFIG.MIN_SPEED + Math.random() * (CONFIG.MAX_SPEED - CONFIG.MIN_SPEED);
  this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
  this.acc = new Vec2(0, 0);
// === 向量 ===
function Vec2(x, y) {
  this.x = x;
  this.y = y;
}
Vec2.prototype.add = function(v) { return new Vec2(this.x+v.x, this.y+v.y); };
Vec2.prototype.sub = function(v) { return new Vec2(this.x-v.x, this.y-v.y); };
Vec2.prototype.scale = function(s) { return new Vec2(this.x*s, this.y*s); };
Vec2.prototype.mag = function() { return Math.sqrt(this.x*this.x + this.y*this.y); };
Vec2.prototype.normalize = function() {
  var m = this.mag();
  return m === 0 ? new Vec2(0,0) : new Vec2(this.x/m, this.y/m);
};
Vec2.prototype.limit = function(max) {
  var m = this.mag();
  return m > max ? this.scale(max/m) : this;
};
Vec2.prototype.dist = function(v) { return this.sub(v).mag(); };
Vec2.prototype.clone = function() { return new Vec2(this.x, this.y); };
```
hermes通过确定每一帧个体鸟的位置（行列键值对key）来定义个体鸟的空间形态，同时也初始化了鸟的速度向量。

- 队列行为
实际鸟群中，队列行为至少有**对齐，凝聚，头鸟，队列**这四种，我本身不是很懂，只能做到最简单的仿生。
   -  对齐，顾名思义，就是速度向量的方向合并，每只鸟的视野范围内，距离越近，两只鸟的对齐欲望越大，对齐力就 更大，两只鸟被迫形成相同的速度方向，然后以此类推，形成鸟群的方向行为
```   Typescript
  // 对齐算法
  if (distSq < CONFIG.PERCEPTION_RADIUS * CONFIG.PERCEPTION_RADIUS) {
      avgVel.x += other.vel.x;
      avgVel.y += other.vel.y;
      aliCount++;
    }
  // === 对齐结果 ===
  var ali = new Vec2(0, 0);
  if (aliCount > 0 && weights.alignment > 0) {
    avgVel.x /= aliCount; avgVel.y /= aliCount;
    ali = new Vec2(avgVel.x - this.vel.x, avgVel.y - this.vel.y);
    ali = ali.limit(weights.alignment * 0.15);
  }
```
  其中有一些约束条件，这里不过多阐述。

一系列的力合并后，就形成了整体的鸟群系统，看起来就像这样:

![鸟群仿生模拟](/images/boid.png)

实际上，我用openclaw的框架做了一遍，由于模型不同，不能单看成品，这里也不打算展示，但在工作中，两者最大的不同就是，openclaw不会告诉你：怎么改的，为什么这样改，改了有什么效果，而且总是忘记先前的要求，在实际执行中，soul.md一类的核心文件无法真正约束其行为，反而导致它陷入自我混乱。

除此以外，我还用hermes做了一个简单的github新消息推送机器人，后面我会专门写一篇文章整合一些我自己的小工具，下面，是我用hermes一次生成的一个知识框架树ui，没有任何我个人任何的提示词工程，没有任何的二次用户督促，一遍完成（自动弹出网页时真的很舒心）

我会将这些项目推送到我的github，敬请关注

### 结语

hermes作为agent开源框架之光，是你优化工作流的极佳选择。
我会借hermes的上下文机制，在以后的文章中阐述分析上下文工程，同时也会引出对windowswsl2的局限性问题，到时候我还会做一下有趣的小项目，这也许会在暑假前完成。敬请期待。
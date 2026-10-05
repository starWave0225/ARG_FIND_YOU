# 扫码入群核验

独立入口为 `/group-gate.html`。玩家扫描的是此页面地址的二维码，核验通过后页面才显示真实微信群二维码。页面不写入游戏存档，也不自动完成剧情任务。

配置 Cloudflare Worker 的三个变量：

- `GROUP_GATE_QUESTION`：公开问题文本。
- `GROUP_GATE_ANSWER`：使用 Wrangler secret 配置的答案，不提交到仓库或前端。
- `GROUP_GATE_QR_URL`：真实微信群二维码图片的 HTTPS 地址，建议也使用 secret 配置；仅核验通过时由接口返回。

未配置完整时入口显示“入口暂未开放”。答案仅做 Unicode NFKC 规范化及首尾空格清理，其余精确匹配。答错仅显示“核验未通过”。已获得的群二维码仍可被转发，此流程不提供微信群本身的成员审批。

本地页面连接 `http://127.0.0.1:8787`，用 `npm run cloud:dev` 启动接口。私有本地配置放在 `cloud/.dev.vars`，不要提交。线上页面使用 `cloud-config.js` 中的 API 地址；需部署新版 Worker 后接口才生效。更换过期二维码只需更新服务端变量。

const fetch = require('node-fetch');
const Parser = require('rss-parser');
const { kv } = require('@vercel/kv');
const parser = new Parser();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ code: -1, msg: "仅支持POST请求" });
  }
  try {
    // 抓取 GitHub Trending
    const ghRes = await fetch("https://api.github.com/search/repositories?q=stars:>1000&sort=stars&per_page=5");
    const ghJson = await ghRes.json();
    const githubList = ghJson.items.map(item => ({
      name: item.full_name,
      url: item.html_url,
      stars: item.stargazers_count,
      desc: item.description || "无项目描述"
    }));

    // 新华社RSS新闻
    const feed = await parser.parseURL("http://www.xinhuanet.com/rss/politics.xml");
    const newsList = feed.items.slice(0,5).map(item => ({
      title: item.title,
      url: item.link,
      source: "新华社"
    }));

    const dailyData = {
      github: githubList,
      news: newsList,
      updateTime: new Date().toLocaleString("zh-CN")
    };
    await kv.set("daily_workbench_info", dailyData);

    return res.json({ code: 0, msg: "抓取并保存成功", data: dailyData });
  } catch (err) {
    return res.status(500).json({ code: -1, msg: "抓取失败", error: err.message });
  }
};

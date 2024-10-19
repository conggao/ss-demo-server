const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const {init: initDB, Counter} = require("./db");
const {request} = require("express");
const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const {action} = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    let createMatchRuleRes = await request.post('https://api.weixin.qq.com/wxa/business/gamematch/creatematchrule', {
      team_count: 2,
      team_member_count: 1
    })
    res.send(createMatchRuleRes.match_id);
  }
});

// 小程序调用，获取微信 Open ID
app.get("/api/test", async (req, res) => {
  const {code} = req.query;
  const {appid, secret, grant_type} = require('./config/wx');
  const {openid} = await request.get('/sns/jscode2session', {
    appid,
    secret,
    js_code: code,
    grant_type,
  });
  // 3. 查找用户是否已经注册
  models.user
    .findOne({
      where: {
        openid,
      },
    })
    .then((user) => {
      if (user) {
        // 3.2 如果用户已经注册，返回用户信息
        res.json(
          new Result({
            data: user,
            msg: '登录成功',
          })
        );
      } else {
        // 3.3 如果用户没有注册，创建用户并返回用户信息
        const username = randomUserName();
        models.user
          .create({
            nickname: username,
            openid,
            avatar: '/uploads/default-avatar.png',
          })
          .then((user) => {
            res.json(
              new Result({
                data: user,
                msg: '登录成功',
              })
            );
          });
      }
    });
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();

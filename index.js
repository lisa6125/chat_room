import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectMongo from 'connect-mongo'
import cors from 'cors'
import session from 'express-session'

import { createServer } from "http";
import { Server } from "socket.io";


import routerUser from './routes/users.js'

dotenv.config()

mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false ,useCreateIndex: true})

const app = express()

const httpServer = createServer(app);
const io = new Server(httpServer,{
  cors: {
    origin: 'https://alice-chat-test.herokuapp.com/',
    methods: ["GET", "POST"]
  }
});

app.use(bodyParser.json())

// 跨域設定
app.use(cors({
  origin (origin, callback) {
    // 如果是 Postman 之類的後端, 允許
    if (origin === undefined) {
      callback(null, true)
    } else {
      if (process.env.DEV === 'true') {
        // 如果是本機開發, 接受所有請求
        callback(null, true)
      } else if (origin.includes('github')) {
        // 如果不是本機開發, 但是是從 github 過來的請求, 允許
        callback(null, true)
      } else {
        // 如果不是本機開發, 也不是從 github 過來, 拒絕
        callback(new Error('Not allowed'), false)
      }
    }
  },
  credentials: true
}))

const MongoStore = connectMongo(session)

const sessionSettings = {
  secret: 'album',
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: {
    maxAge: 1000 * 60 * 30
  },
  saveUninitialized: false,
  rolling: true,
  resave: true
}

if (process.env.DEV === 'false') {
  // 如果不是本機的開發環境，允許不同網域的認證
  sessionSettings.cookie.sameSite = 'none'
  // 如果是不同網域的認證，一定要設定 secure
  sessionSettings.cookie.secure = true
}

app.use(session(sessionSettings))

// 部署上 heroku 一定要設定
app.set('trust proxy', 1)

app.use('/users', routerUser)
//----------------------------------------------------------------------------
// 加入線上人數計數
let onlineCount = 0;
io.on('connection', (socket) => {
  console.log('a user connected');

  io.emit("message", 'Hello World!');

  socket.on("disconnect", () => {
    console.log("a user go out");
  });
  // //接收greet事件
  // socket.on("greet", () => {
  //   //回傳前台事件與物件
  //   socket.emit("greet", "Hi! Client.");
  // });
  //---------------------------
// 有連線發生時增加人數
onlineCount++;
// 發送人數給網頁
io.emit("online", onlineCount);

// socket.on("greet", () => {
//     socket.emit("greet", onlineCount);
// });

socket.on("send", (msg) => {
    // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
    // 因此我們直接 return ，終止函式執行。
    if (Object.keys(msg).length < 2) return;

    // 廣播訊息到聊天室
    io.emit("msg", msg);
});

socket.on('disconnect', () => {
    // 有人離線了，扣人
    onlineCount = (onlineCount < 0) ? 0 : onlineCount-=1;
    io.emit("online", onlineCount);
});
});
//------------------------------------------------------------------------
// bodyparser cors 之類的套件發生錯誤時的處理
// app.use((err, req, res, next) => {})
// err 發生的錯誤
// next 繼續到下一個 middleware，因為這是最後一個所以不需要
// _ 代表不使用 function 的參數
app.use((_, req, res, next) => {
  res.status(500).send({ success: false, message: '伺服器錯誤' })
})

httpServer.listen(process.env.PORT, () => {
  console.log('server started')
})

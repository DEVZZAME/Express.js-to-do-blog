const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.use("/public", express.static("public"));

MongoClient.connect(
  "mongodb+srv://kdttodoapp:qwer1234@cluster0.t3ifw7q.mongodb.net/?retryWrites=true&w=majority",
  function (에러, client) {
    if (에러) {
      return console.log(에러);
    }

    db = client.db("todoapp");

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});

app.get("/write", function (요청, 응답) {
  응답.render("write.ejs");
});

app.get("/list", function (요청, 응답) {
  db.collection("post")
    .find()
    .toArray(function (에러, 결과) {
      console.log(결과);
      응답.render("list.ejs", { posts: 결과 });
    });
});

app.get("/search", function (요청, 응답) {
  console.log(요청.query.value);
  var 검색조건 = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: 요청.query.value,
          path: "할일", // 할일날짜 둘다 찾고 싶으면 ['할일', '날짜'] 배열 형태로 입력
        },
      },
    },
    { $sort: { _id: 1 } }, //-1은 내림차순 1은 오름차순
    { $limit: 10 }, //포스팅 갯수 10개로 제한
  ];
  if (요청.query.value) {
    db.collection("post")
      .aggregate(검색조건)
      .toArray(function (에러, 결과) {
        console.log(결과);
        응답.render("search.ejs", { posts: 결과 });
      });
  } else {
    db.collection("post")
      .find({})
      .toArray(function (에러, 결과) {
        console.log(결과);
        응답.render("search.ejs", { posts: 결과 });
      });
  }
});

app.get("/detail/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      console.log(결과);
      응답.render("detail.ejs", { data: 결과 });
    }
  );
});

app.get("/edit/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      console.log(결과);
      응답.render("edit.ejs", { post: 결과 });
    }
  );
});

app.put("/edit", function (요청, 응답) {
  db.collection("post").updateOne(
    { _id: parseInt(요청.body.id) },
    { $set: { 할일: 요청.body.title, 날짜: 요청.body.date } },
    function (에러, 결과) {
      console.log(결과);
      응답.redirect("/list");
    }
  );
});

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const e = require("connect-flash");

app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

app.get("/logout", function (req, res) {
  console.log("logout");
  req.logout(function(err){
    if(err){
      return next(err);
    }
    req.session.destroy(function () {
      res.cookie("connect.sid", "", { maxAge: 0 });
      res.redirect("/");
    });
  });

});

app.get("/mypage", 로그인했니, function (요청, 응답) {
  console.log(요청.user);
  응답.render("mypage.ejs", (사용자 = 요청.user));
});

function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    next();
  } else {
    응답.send("로그인 안하셨는데요?");
  }
}

// 로그인 시도를 할 경우 passport는 성공여부와 관계없이 session을 생성함.
// 해당 session에 object 형식으로 message라는 키와 각 조건에 맞는 value가 추가 됨.
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);
          if (!결과)
            return done(null, false, {
              message: "유효하지 않은 아이디입니다.",
            });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, {
              message: "유효하지 않은 비밀번호입니다.",
            });
          }
        }
      );
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});

// 사용자가 /login에서 로그인을 시도할 경우 session에 정보가 저장되는데
// 아래 코드에서는 info가 세션정보임.
// console로 info를 출력해보면 쿠키를 비롯해 로그인 시도 결과에 대해서 message로 알려줌. 성공시에는 undefined.
// info.message에는 로그인에 실패한 이유가 담기게 되고, 이 결과를 각 조건에 맞게 alert 창이나 html에 추가해 뿌려주면 됨.
app.post("/login", function (요청, 응답, next) {
  passport.authenticate("local", function (에러, user, info) {
    console.log("info", info);
    if (에러) {
      return next(에러);
    }
    if (!user) {
      요청.session.save(function () {
        응답.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        응답.write(`<script>alert(' ${info.message} ')</script>`);
        응답.write('<script>window.location="/login"</script>');
      });
      return;
    }
    요청.logIn(user, function (에러) {
      if (에러) {
        return next(에러);
      }
      요청.session.save(function () {
        응답.redirect("/mypage");
      });
    });
  })(요청, 응답, next);
});

app.post("/register", function (요청, 응답) {
  // 중복검사 기능도 만들어줘야 함---------------------------------
  db.collection("login").insertOne(
    { id: 요청.body.id, pw: 요청.body.pw },
    function (에러, 결과) {
      응답.redirect("/login");
    }
  );
});

app.post("/add", function (요청, 응답) {
  // 응답.send("전송완료");
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (에러, 결과) {
      console.log(결과.totalPost);
      var 총게시물갯수 = 결과.totalPost;
      var 저장할거 = {
        _id: 총게시물갯수 + 1,
        할일: 요청.body.title,
        날짜: 요청.body.date,
        작성자: 요청.user._id,
      };
      db.collection("post").insertOne(저장할거, function (에러, 결과) {
        console.log("저장완료");
        db.collection("counter").updateOne(
          { name: "게시물갯수" },
          { $inc: { totalPost: 1 } },
          function (에러, 결과) {
            if (에러) {
              return console.log(에러);
            } else {
              console.log(결과);
              응답.redirect("/list");
            }
          }
        );
      });
    }
  );
});

app.delete("/delete", function (요청, 응답) {
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);

  var 삭제할데이터 = { _id: 요청.body._id, 작성자: 요청.user._id };
  db.collection("post").deleteOne(삭제할데이터, function (에러, 결과) {
    console.log("삭제완료");
    if (에러) {
      console.log(에러);
    }
    응답.status(200).send({ message: "성공했습니다." });
  });
});

// app.use('/shop', require('./routes/shop.js'));
// app.use('/board/sub', require('./routes/board.js'));

let multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/image");
  },

  filename: function (req, file, cb) {
    cb(null, `${file.originalname}`);
  },

  limits: {
    fileSize: 1024 * 1024,
  },
});

var upload = multer({ storage: storage });

app.get("/upload", function (요청, 응답) {
  응답.render("upload.ejs");
});

app.post("/upload", upload.array("profile", 10), function (요청, 응답) {
  응답.send("업로드완료");
});

app.get('/image/:imageName', function(요청, 응답){
  응답.sendFile(__dirname + '/public/image/' + 요청.params.imageName);
})

// app.get('/chat',function(요청, 응답){
//   응답.render('chat.ejs');
// })

app.post('/chatroom', 로그인했니, function(요청, 응답){
  var 저장할거 = {
        title : '무슨무슨채팅방',
        member : [요청.body.당한사람id, 요청.user._id],
        date : new Date()
      }
  db.collection('chatroom').insertOne(저장할거).then((결과)=>{
    응답.send('저장완료')
  })
})
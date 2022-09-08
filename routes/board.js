var router = require('express').Router();

function 로그인했니(){
  console.log("나도몰라?");
};

router.use(로그인했니);

router.get('/sports', function(요청, 응답){
   응답.send('스포츠 게시판');
});

router.get('/game', function(요청, 응답){
   응답.send('게임 게시판');
});

module.exports = router;
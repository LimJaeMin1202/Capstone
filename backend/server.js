const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 프론트엔드 파일 서빙
app.use(express.static(path.join(__dirname, '../frontend')));

// 라우터 연결
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/records', require('./routes/records'));

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
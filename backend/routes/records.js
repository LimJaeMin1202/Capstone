const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/records.json');

// records.json 없으면 자동 생성
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, '[]', 'utf-8');
}

// 기록 전체 가져오기
router.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  res.json(data);
});

// 기록 저장
router.post('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const record = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  data.push(record);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  res.json({ success: true, record });
});

// 기록 전체 삭제
router.delete('/', (req, res) => {
  fs.writeFileSync(dataPath, '[]', 'utf-8');
  res.json({ success: true });
});

module.exports = router;
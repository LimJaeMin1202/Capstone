const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/exercises.json');

// 전체 운동 목록 가져오기
router.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  res.json(Object.values(data));
});

// 특정 운동 가져오기
router.get('/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const exercise = data[req.params.id];
  if (!exercise) return res.status(404).json({ error: '운동을 찾을 수 없어요' });
  res.json(exercise);
});

module.exports = router;
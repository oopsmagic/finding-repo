const express = require('express');
const { analyzeRepo } = require('../controllers/repo.controller');

const router = express.Router();

router.post('/analyze', analyzeRepo);

module.exports = router;

const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index.twig', { title: 'Base Map' });
});

module.exports = router;

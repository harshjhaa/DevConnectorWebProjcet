const express = require('express');
const router = express.Router();

router
    //@route        GET api/posts
    //@description  Testing route
    //@access       Public (no authentication needed)
    .get('/', (req, res) => {
        res.send("posts router");
    });
module.exports = router
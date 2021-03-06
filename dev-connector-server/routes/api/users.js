const express = require('express');
const router = express.Router();
const gravatar = require('gravatar')
const User = require('../../models/User');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator');

router
    //@route        Post api/users
    //@description  Register User
    //@access       Public (no authentication needed)
    .post('/',
        [
            check('name', 'Name is required').not().isEmpty(),
            check('email', 'Valid email is required').isEmail(),
            check('password', 'Password must be greaterthan 3 characters').isLength({ min: 3 })
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { name, email, password } = req.body;
            try {
                let user = await User.findOne({ email });
                if (user) {
                    console.log('Error: User already exists!');
                    return res.status(400).json({ errors: [{ msg: 'User already exists!' }] });
                }
                const avatar = gravatar.url(email, { size: 200, r: 'pg', d: 'mm' });

                user = new User({ name, email, avatar, password })

                const salt = await bcrypt.genSalt(10);

                user.password = await bcrypt.hash(password, salt);

                await user.save();

                const payload = {
                    user: {
                        id: user.id
                    }
                }

                jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
                    if (err) { throw err }
                    res.json({ token })
                })

            } catch (err) {
                console.log(err.message);
                res.status(500).json('Server Error');
            }
        });

module.exports = router

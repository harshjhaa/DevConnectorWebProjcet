const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');


const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')


router
    //@route        GET api/profile/me
    //@description  Get current user profile
    //@access       Private
    .get('/me', auth, async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
            if (!profile) {
                return res.status(400).json({ mssg: 'Profile not found' });
            }
            res.json(profile);
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        POST api/profile
    //@description  Create or update the user profile
    //@access       Private
    .post('/',
        [
            auth,
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const {
                company,
                website,
                location,
                bio,
                status,
                githubUserName,
                skills,
                youtube,
                facebook,
                twitter,
                instagram,
                linkedin
            } = req.body; 

            //building profile object
            const profileFields = {};
            profileFields.user = req.user.id;
            if (company) profileFields.company = company;
            if (website) profileFields.website = website;
            if (location) profileFields.location = location;
            if (bio) profileFields.bio = bio;
            if (status) profileFields.status = status;
            if (githubUserName) profileFields.githubUserName = githubUserName;
            if (skills)
                profileFields.skills = skills.split(',').map(skill => skill.trim());

            //building social object
            profileFields.socials = {};
            if (youtube) profileFields.socials.youtube = youtube;
            if (facebook) profileFields.socials.facebook = facebook;
            if (twitter) profileFields.socials.twitter = twitter;
            if (instagram) profileFields.socials.instagram = instagram;
            if (linkedin) profileFields.socials.linkedin = linkedin;

            try {
                let profile = await Profile.findOne({ user: req.user.id });
                //if profile already exist then update it
                if (profile) {
                    // return res.status(400).json({ mssg: 'Profile not found' });
                    profile = await Profile.findOneAndUpdate(
                        { user: req.user.id },
                        { $set: profileFields },
                        { new: true }
                    );
                    return res.json({ msg: "Profile Updation Success", profile });
                }
                //create
                else {
                    profile = new Profile(profileFields);
                    await profile.save();
                    return res.json({ msg: "Profile successfully created", profile });
                }
            } catch (err) {
                console.log(err.message);
                res.status(500).send("Server Error");
            }
        })

module.exports = router;
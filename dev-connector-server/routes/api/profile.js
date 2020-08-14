const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const request = require('request')
const config = require('config')

const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')


router
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
    //@route        DELETE api/profile
    //@description  Delete profile, user and posts
    //@access       Private
    .delete('/', auth, async (req, res) => {
        try {
            //Removing Profile
            await Profile.findOneAndRemove({ user: req.user.id });
            //Removing User
            await User.findOneAndRemove({ _id: req.user.id });
            res.json({ msg: 'User and Profile Deleted' });
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        PUT api/profile/experience
    //@description  Add profile experience
    //@access       Private
    .put('/experience',
        [
            auth,
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const {
                title,
                company,
                location,
                from,
                to,
                currnet,
                description
            } = req.body;
            console.log(req.body);
            //building experience object
            const newExperience = {
                title,
                company,
                location,
                from,
                to,
                currnet,
                description
            };
            try {
                const profile = await Profile.findOne({ user: req.user.id });
                if (profile) {
                    profile.experiences.unshift(newExperience);
                    await profile.save();
                    return res.json({ profile });
                }
                else {
                    return res.json({ msg: "Profile not found" });
                }
            } catch (err) {
                console.log(err.message);
                res.status(500).send("Server Error");
            }
        })
    //@route        DELETE api/profile/experience/:exp_id
    //@description  Delete profile experience
    //@access       Private
    .delete('/experience/:exp_id', auth, async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                const removeIndex = profile.experiences.map(item => item.id).indexOf(req.params.exp_id);
                if (removeIndex >= 0) {
                    profile.experiences.splice(removeIndex, 1)
                    await profile.save();
                    return res.json({ profile });
                } else {
                    return res.json({ msg: 'Experience not found' });
                }
            }
            else {
                return res.json({ msg: "Profile not found" });
            }
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //----------------------------------------------------------------
    //@route        PUT api/profile/experience
    //@description  Add profile experience
    //@access       Private
    .put('/education',
        [
            auth,
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('fieldofstudy', 'Field-of-study Date is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty(),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const {
                school,
                degree,
                fieldofstudy,
                from,
                to,
                currnet,
                description
            } = req.body;
            console.log(req.body);
            //building experience object
            const newEducation = {
                school,
                degree,
                fieldofstudy,
                from,
                to,
                currnet,
                description
            };
            try {
                const profile = await Profile.findOne({ user: req.user.id });
                if (profile) {
                    profile.education.unshift(newEducation);
                    await profile.save();
                    return res.json({ profile });
                }
                else {
                    return res.json({ msg: "Profile not found" });
                }
            } catch (err) {
                console.log(err.message);
                res.status(500).send("Server Error");
            }
        })
    //@route        DELETE api/profile/experience/:exp_id
    //@description  Delete profile experience
    //@access       Private
    .delete('/education/:edu_id', auth, async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
                if (removeIndex >= 0) {
                    profile.education.splice(removeIndex, 1)
                    await profile.save();
                    return res.json({ profile });
                } else {
                    return res.json({ msg: 'Education not found' });
                }
            }
            else {
                return res.json({ msg: "Profile not found" });
            }
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //----------------------------------------------------------------
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
    //@route        GET api/profile/all
    //@description  Get all profile
    //@access       Public
    .get('/all', async (req, res) => {
        try {
            const profiles = await Profile.find().populate('user', ['name', 'avatar']); //we are populating from user collection
            if (!profiles) {
                return res.status(400).json({ mssg: 'Profiles not found' });
            }
            res.json(profiles);
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        GET api/profile/user/:user_id
    //@description  Get profile by user ID
    //@access       Public
    .get('/user/:user_id', async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']); //we are populating from user collection
            if (!profile) {
                return res.status(400).json({ mssg: 'Profile not found' });
            }
            res.json(profile);
        } catch (err) {
            if (err.kind === 'ObjectId')
                return res.status(400).json({ mssg: 'Profile not found' });
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        GET api/profile/github/:username
    //@description  Getting github profile
    //@access       Public
    .get('/github/:username', async (req, res) => {
        try {
            const options = {
                uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
                method: 'GET',
                headers: { 'user-agent': 'node.js' }
            };
            request(options, (error, response, body) => {
                if (error)
                    console.log(error);
                if (response.statusCode !== 200)
                    return res.status(404).json({ msg: "No Github Profile Found" })
                return res.json(JSON.parse(body));
            })
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })

module.exports = router;

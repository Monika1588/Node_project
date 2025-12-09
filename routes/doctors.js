const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/", async (req, res) => {
    try {
        let { name, spec, availability, time, symptoms } = req.query;

        let filter = { role: "doctor" };

        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }

        if (spec) {
            filter.specialization = spec;
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /api/doctors?name=&spec=&availability=&time=&symptoms=
router.get("/", async (req, res) => {
    try {
        let { name, spec, availability, time, symptoms } = req.query;

        let filter = { role: "doctor" };

        //Search by doctor name
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }

        // Filter by specialization
        if (spec) {
            filter.specialization = spec;
        }

        //Symptoms search
        if (symptoms) {
            filter.symptoms = { $regex: symptoms, $options: "i" };
        }

        //Availability filter
        if (availability === "today") {
            filter.availableDays = { $in: ["today"] };
        }
        if (availability === "tomorrow") {
            filter.availableDays = { $in: ["tomorrow"] };
        }

        //Time slot filter
        if (time) {
            filter.availableSlots = { $in: [time] };
        }

        const doctors = await User.find(filter);
        res.json({ doctors });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

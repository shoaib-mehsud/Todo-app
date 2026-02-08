import express from 'express'
import z from 'zod';
import bcrypt from 'bcrypt';
import db from '../../db.js';
import jwt from 'jsonwebtoken';
const secret = process.env.JWT_SECRET;

const { TodoModel, UserModel } = db;


const router = express.Router();
router.post('/signup', async (req, res) => {

    const signupSchema = z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .min(5, "Email is too short")
            .max(50, "Email is too long")
            .email("Invalid email format"),

        name: z
            .string()
            .trim()
            .min(3, "Name must be at least 3 characters")
            .max(20, "Name must be at most 20 characters")
            .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(32, "Password must be at most 32 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    });

    const parsed = signupSchema.safeParse(req.body);

        if (!parsed.success) {
        return res.status(400).json({
            errors: parsed.error.flatten().fieldErrors
        });
        }


    try {
        const email = req.body.email;
        const password = req.body.password;
        const name = req.body.name;

        const hashPassword = await bcrypt.hash(password, 13)
        console.log(hashPassword);
        await UserModel.create({
            email: email,
            password: hashPassword,
            name: name
        });

        res.status(201).json({
            message: "Signup successful"
        });
    }

    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "User already exist with this email"
            });
        }

         console.error(error);
    res.status(500).json({
      message: "Internal server error"
    });
    }

});

router.post('/signin', async (req, res) => {

    const email = req.body.email;
    const password = req.body.password;

    const emailfound = await UserModel.findOne({
        email: email
    })
    if (!emailfound) {
        res.status(403).json({
            message: "user with this email doesnot exist in our data"
        });
    }

    const passMatch = await bcrypt.compare(password, emailfound.password)

    if (passMatch) {
        const token = jwt.sign({
            userId: emailfound._id
        }, secret);

        res.json({
            token: token
        });
    }
    else {
        res.status(403).json({
            message: "incorrect credentials"
        })
    }

});

export default router;
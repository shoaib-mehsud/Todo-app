import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../db.js';
import z from 'zod';
import mongoose from 'mongoose';



const app = express();
app.use(express.json());

const { TodoModel, UserModel } = db;
const secret = process.env.JWT_SECRET;


app.post('/signup', async (req, res) => {

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

app.post('/signin', async (req, res) => {

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

function authen_middle_ware(req, res, next) {
    const token = req.get('authen_token');

    try {
        const decode = jwt.verify(token, secret);
        if (decode) {
            req.userId = decode.userId;
            next();
        }

    } catch (error) {
        res.json({
            message: "Incorrect credentials, invalid token"
        })
    }

}


app.post('/todo', authen_middle_ware, (req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const done = req.body.done;
    TodoModel.create({
        title,
        userId,
        done
    });

    console.log("in todo");
    res.json({
        message: "todo created"
    })
});

app.patch('/update/:todoId',authen_middle_ware,async(req,res)=>{
        const userId = new mongoose.Types.ObjectId(req.userId);
        const todoId =new mongoose.Types.ObjectId(req.params.todoId);
        const updatedTitle = req.body.title;

        if(updatedTitle !== undefined){
                                 

            try {
                const updatedTodo = await TodoModel.findOneAndUpdate(

                    {_id: todoId, userId: userId},
                    {$set: { title: updatedTitle}}, //will change only the given field (as here is title) and keep the other fields as it is
                    {new: true} // to return the updated version of the document
              
                );
                if(!updatedTodo){
                    return res.status(404).json({
                        message: "Todo not found or you donot have access to change this todo"
                    });

               
                }
                 res.json({
                    message: "update successed",
                    todo: updatedTodo
                })
            } catch (error) {
                res.json({
                    message: error
                });
            }
        }

});

app.patch('/markasDone/:todoId',authen_middle_ware,async(req,res)=>{
        const userId = new mongoose.Types.ObjectId(req.userId);
        const todoId =new mongoose.Types.ObjectId(req.params.todoId);
        const status = req.body.status;

        if(status !== undefined){
                                 

            try {
                const updatedTodo = await TodoModel.findOneAndUpdate(

                    {_id: todoId, userId: userId},
                    {$set: {done: status}}, //will change only the given field (as here is title) and keep the other fields as it is
                    {new: true} // to return the updated version of the document
              
                );
                if(!updatedTodo){
                    return res.status(404).json({
                        message: "Todo not found or you donot have access to change this todo"
                    });

               
                }
                 res.json({
                    message: "Task has been completed",
                    todo: updatedTodo
                })
            } catch (error) {
                res.json({
                    message: error
                });
            }
        }

});

// to delete a todo by the user who has created it 
app.delete('/delete/:todoId',authen_middle_ware, async (req,res)=>{
    const todoId = new mongoose.Types.ObjectId(req.params.todoId);
    const userId = req.userId;      // will use the userID to compare that either the todo a user want to delete was created by him/her 
    try{
        const deletedTodo = await TodoModel.findOneAndDelete({
            _id: todoId, userId: userId // withres comapring the userId , any authourized user can delete any todo , wheather it belong to him/her or not.
        })
        if(!deletedTodo){
            return res.status(404).json({
                message: "todo not found or you are not authorized"
            })
        }

        res.json({
            message:"todo is deleted successfully",
                todo: deletedTodo.title
        })
    }
    catch(e){
        res.json({
            message: "Invalid ID"
        
        })
    }
})

app.get('/todos', authen_middle_ware, async (req, res) => {
    const userId = req.userId;

    const todos = await TodoModel.find({
        userId: userId
    })
    res.json({
        user_id: todos
    })
})

app.listen(3000);
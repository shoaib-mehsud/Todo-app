import express from 'express'
import mongoose from 'mongoose';
import db from '../../db.js';
import authen_middle_ware from '../middleware/auth.js';

const { TodoModel, UserModel } = db;

const router = express.Router();
router.post('/create', authen_middle_ware, (req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const isDone = req.body.isDone;
    TodoModel.create({
        title,
        userId,
        isDone
    });

    console.log("in todo");
    res.json({
        message: "todo created"
    })
});

router.patch('/update/:todoId',authen_middle_ware,async(req,res)=>{
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
                    return res.isDone(404).json({
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

router.patch('/markasDone/:todoId',authen_middle_ware,async(req,res)=>{
        const userId = new mongoose.Types.ObjectId(req.userId);
        const todoId =new mongoose.Types.ObjectId(req.params.todoId);
        const isDone = req.body.isDone;

        if(isDone !== undefined){
                                 

            try {
                const updatedTodo = await TodoModel.findOneAndUpdate(

                    {_id: todoId, userId: userId},
                    {$set: {isDone: isDone}}, //will change only the given field (as here is title) and keep the other fields as it is
                    {new: true} // to return the updated version of the document
              
                );
                if(!updatedTodo){
                    return res.isDone(404).json({
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
router.delete('/delete/:todoId',authen_middle_ware, async (req,res)=>{
    const todoId = new mongoose.Types.ObjectId(req.params.todoId);
    const userId = req.userId;      // will use the userID to compare that either the todo a user want to delete was created by him/her 
    try{
        const deletedTodo = await TodoModel.findOneAndDelete({
            _id: todoId, userId: userId // withres comapring the userId , any authourized user can delete any todo , wheather it belong to him/her or not.
        })
        if(!deletedTodo){
            return res.isDone(404).json({
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

router.get('/myTodos', authen_middle_ware, async (req, res) => {
    const userId = req.userId;

    const todos = await TodoModel.find({
        userId: userId
    })
    res.json({
        user_id: todos
    })
})



export default router;
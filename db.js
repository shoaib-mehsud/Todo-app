import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' }); 

console.log("Checking MONGO_URL:", process.env.MONGO_URL); // Debug line
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("Connected to MongoDB successfully"))
.catch((err) => console.error("MongoDB connection error:", err));

const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;

const User = new Schema({
    email: { type: String, unique: true },
    password: String,
    name: String
});

const Todo = new Schema({
    title: String,
    done: Boolean,
    userId: ObjectId
});

const UserModel = mongoose.model('USER', User);
const TodoModel = mongoose.model('TODO', Todo);

export default {  
    UserModel,
    TodoModel
};
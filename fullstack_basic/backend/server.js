import express from 'express';

const app = express()
const port = process.env.PORT || 3000
const users = [
    {
        id: 1,
        name: "Akash",
        gender: "Male"
    },
    {
        id: 2,
        name: "Bindu",
        gender: "Female"
    },
    {
        id: 3,
        name: "Chaten",
        gender: "Male"
    },
    {
        id: 4,
        name: "Dhristi",
        gender: "Female"
    },
    {
        id: 5,
        name: "Ellen",
        gender: "Male"
    },
    {
        id: 6,
        name: "Farana",
        gender: "Female"
    },
    {
        id: 7,
        name: "Girish",
        gender: "Male"
    },
    {
        id: 8,
        name: "Hella",
        gender: "Female"
    }
]

app.get("/", (req,res)=>{
    res.header("X-Author", "Anirudh Girish").status(200).send("You are at home route")
})

app.get("/api/users", (req,res)=>{
    res.header("X-Author", "Anirudh Girish").status(200).json(users)
})

app.listen(port, ()=>{
    console.log("Backend is running and is acting as a server")
})
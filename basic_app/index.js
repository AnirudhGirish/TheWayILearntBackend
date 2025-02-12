import express from "express"
import "dotenv/config"

const app = express()
const port = process.env.PORT || 4000

app.get('/',(req,res)=>{
    res.header('X-Author', 'Anirudh').send("Hello World").status(200)
})

app.listen(port, ()=>{
    console.log(`Backend system has been fired up and is serving on port ${port}`);
})
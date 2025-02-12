// User[icon:user]{
//     id string pk
//     username string
//     password string
//     email string
//     phone number
//     watchHistory ObjedctId[] Video
//     createdAt timestamp
//     updatedAt timestamp
//   }

import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password : {
        type : String,
        required: [true, "Password is required"],
    },
    email : {
        type: String,
        required: true,
        unique: true,
    },
    phone : {
        type : String,
        required: true,
        unique: true,
    },
    watchhistory : [{
        type : Schema.Types.ObjectId,
        ref : "Video"
    }],
    refreshToken : {
        type: String,
    },
    avatar : {
        type: String,
        required: true,
    },
    coverImage : {
        type: String,
        required: false,
    }
},
    {timestamps : true}
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()

    this.password = bcrypt.hash(this.password, 10)
    next ()
})

userSchema.methods.isPasswordcorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function (){
    // short lived access JWT token
    return jwt.sign({
       _id : this._id,
       username : this.username,
       email : this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn : process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = function (){
    // long lived access JWT token
    return jwt.sign({
       _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn : process.env.REFRESH_TOKEN_EXPIRY})
}

export const User = mongoose.model("User", userSchema)
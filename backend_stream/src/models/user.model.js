import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username : {
        type :String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true,
    },
    email : {
        type :String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullname : {
        type :String,
        required : true,
        trim : true,
        index : true,
    },
    password :{
        type :String,
        required : [true, "Password is required"],
    },
    avatar : {
        type :String,
        required : true,
    },
    coverImage : {
        type :String,
    },
    watchHistory : [{
        type : Schema.Types.ObjectId,
        ref : "Video"
    }],
    refreshToken : {
        type :String,
    },
    resetPasswordToken: {  // Add this field
        type: String,
    },
    resetPasswordExpires: {  // Add this field
        type: Date,
    },
},{timestamps : true});

//encryption
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//decryption to check for user auth
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
};

//JWT token generation methods
userSchema.methods.generateAccessToken = async function () {
    return jwt.sign({
        _id:this._id, 
        email:this.email, 
        username:this.username, 
        fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign({
        _id:this._id, 
        email:this.email, 
        username:this.username, 
        fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};

// Method to generate password reset token
userSchema.methods.generateResetPasswordToken = async function () {
    const payload = { _id: this._id, email: this.email };
    const token = jwt.sign(payload, process.env.RESET_PASSWORD_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
    this.resetPasswordToken = token;
    this.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await this.save();
    return token;
};

export const User = mongoose.model("User", userSchema);
// export const User = mongoose.models.User || mongoose.model("User", userSchema); to check if model already exists, helps prevent re-registering the model 

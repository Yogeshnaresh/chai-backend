import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import {User} from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.genrateAccessToken();
        const refreshToken=user.genrateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false})
        return {accessToken,refreshToken};
    }
    catch(error){
        throw new ApiError(500,"Something went wrong while genratin refresh and access token");

    }
}
const registerUser=asynchandler(async(req,res)=>{
    const {fullName,email,username,password}=req.body;

    if(
        [fullName,email,username,password].some((field)=>
            field?.trim()==="" )
    ){
       throw new ApiError(400,"All fields are required"); 
    }
    const existedUser=await User.findOne({
        $or: [{username: username},{email: email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exited")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is required");
    }

    const avatar=await uploadonCloudinary(avatarLocalPath)
    const coverImage=await uploadonCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})
const loginUser=asynchandler(async(req,res)=>{
    const {email,username,password}=req.body;
    
    if(!username || !email){
        throw new ApiError(400,"username or email is required");
    }
    const user=await User.findOne({
        $or: [{ username: username }, { email: email }]
    })
    if(!user){
        throw new ApiError(400,"User doesn't exist");
    }
    const isPasswordvalid=await user.isPasswordCorrect(password);
    if(!isPasswordvalid){
        throw new ApiError(401,"Password is incorrect");
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnlye: true,
        secure: true
    }

    return res.
    status(200).
    cookie( "accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(
            200,
            {
                user:logedInUser,accessToken,refreshToken

            },
            "User logged In Successfully"
        )
    )
})
const logoutUser=asynchandler(async(req,res)=>{

})

export {
    registerUser,
    loginUser,
    logoutUser
}

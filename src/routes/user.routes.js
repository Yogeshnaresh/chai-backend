import {Router} from "express";
import {loginUser, registerUser,logoutUser,refreshaccessToken} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)
router.route("/login").post(
    loginUser
)
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token",refreshaccessToken);
export default router
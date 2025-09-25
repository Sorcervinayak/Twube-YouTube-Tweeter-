import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logOutUser, refreshAccessToken, registerUser, updateAccountDetails, updateCoverImage, updateUserAvatar } from "../controllers/User.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verfiyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(
    loginUser
)

//Secured routes
router.route("/logout").post( verfiyJWT,logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verfiyJWT,changeCurrentPassword)

router.route("/current-user").get(verfiyJWT,getCurrentUser)

router.route("/updateAccount-details").patch(verfiyJWT,updateAccountDetails)

router.route("/avatar-User").patch(verfiyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/update-CoverImage").patch(verfiyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/c/:username").get(verfiyJWT,getUserChannelProfile)

router.route("/watch-history").get(verfiyJWT,getWatchHistory)
export default router
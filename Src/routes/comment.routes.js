import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getComments,
    updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/:videoId").get(getComments); // public

router.route("/:videoId").post(verifyJWT, addComment); // auth required

router.route("/c/:commentId")
  .delete(verifyJWT, deleteComment)
  .patch(verifyJWT, updateComment);

export default router;

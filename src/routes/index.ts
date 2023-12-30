import express, { Request, Response } from "express";
import multer from "multer";
import { UploadImages } from "../IMAGES/Uploads/index.js";
import { deleteImageAndThumbnail } from "../IMAGES/Delete/deletSpecificImages.js";
import { deleteImagesContainer } from "../IMAGES/Delete/destroyImageContainer.js";
import { deleteUsersFiles } from "../helper/deleteUsersFiles/index.js";
import { uploadVideo } from "../videos/Uploads/index.js";
import { testing } from "../testing.js";
// import { registerUser } from "../Controllers/auth/Signup.js";
// import { loginUser } from "../Controllers/auth/login.js";
// import { getAllUsers } from "../Controllers/users/getAllUsers.js";
// import getSingleUser from "../Controllers/users/getSingleUser.js";
// import authenticateToken from "../middleware/AuthMiddleware.js";
// import UpdateUser from "../Controllers/users/updateUser.js";
// import deleteUser from "../Controllers/users/deleteUsers.js";

const router=express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.get("/api", (req:Request, res:Response) => {
    res.send("api working succesful!");
  });

//   router.post("/api/auth/signup", registerUser);
//   router.post("/api/auth/login", loginUser);
//   router.route('/api/users/').get(getAllUsers);
//   router.route('/api/users/:id').get(getSingleUser).patch(authenticateToken,UpdateUser).delete(authenticateToken,deleteUser)


const storeTemp= multer({ dest: '//home/glen/Desktop/mediaGlens/temp'});
// images
router.put('/api/upload-images/',upload.array('images'),UploadImages);
router.delete('/api/delete-images/',deleteImageAndThumbnail);
router.delete('/api/destroy-images-folder/',deleteImagesContainer);
router.delete('/api/destroy-User-folder/',deleteUsersFiles);

///upload video
router.put('/api/upload-video/',storeTemp.single('video'),uploadVideo);
router.put('/api/upload/',testing);


  export default  router
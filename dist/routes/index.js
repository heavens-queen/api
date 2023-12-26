import express from "express";
// import { registerUser } from "../Controllers/auth/Signup.js";
// import { loginUser } from "../Controllers/auth/login.js";
// import { getAllUsers } from "../Controllers/users/getAllUsers.js";
// import getSingleUser from "../Controllers/users/getSingleUser.js";
// import authenticateToken from "../middleware/AuthMiddleware.js";
// import UpdateUser from "../Controllers/users/updateUser.js";
// import deleteUser from "../Controllers/users/deleteUsers.js";
const router = express.Router();
router.get("/api", (req, res) => {
    res.send("api working succesful!");
});
//   router.post("/api/auth/signup", registerUser);
//   router.post("/api/auth/login", loginUser);
//   router.route('/api/users/').get(getAllUsers);
//   router.route('/api/users/:id').get(getSingleUser).patch(authenticateToken,UpdateUser).delete(authenticateToken,deleteUser)
export default router;
//# sourceMappingURL=index.js.map
import mongoose from "mongoose";
export const connectToDatabase = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("Connected to MongoDB");
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error; // Propagate the error up
    }
};
export default connectToDatabase;
//# sourceMappingURL=index.js.map
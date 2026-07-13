import express from "express";
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const PORT = 8000;

app.use(express.json());

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
  res.send("Server is running! 🚀");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

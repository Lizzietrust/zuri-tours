// controllers/userController.js

// Sample in-memory data (replace with database later)
let users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    password: "hashed_password_123",
    active: true,
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "admin",
    password: "hashed_password_456",
    active: true,
    createdAt: "2025-02-20T14:30:00Z",
  },
];

// Get all users
export const getAllUsers = (req, res) => {
  try {
    // Filter out password field for security
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.status(200).json({
      status: "success",
      results: usersWithoutPassword.length,
      data: {
        users: usersWithoutPassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get a single user by ID
export const getUser = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = users.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      status: "success",
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Create a new user
export const createUser = (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, email, and password",
      });
    }

    // Check if email already exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "Email already registered",
      });
    }

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      name,
      email,
      password: `hashed_${password}`, // In real app, use bcrypt to hash
      role,
      active: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      status: "success",
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update a user (PATCH - partial update)
export const updateUser = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Prevent updating sensitive fields
    const { id: _, password, ...updateData } = req.body;

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      id: users[userIndex].id, // Keep original ID
    };

    // Remove password from response
    const { password: pwd, ...userWithoutPassword } = users[userIndex];

    res.status(200).json({
      status: "success",
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete a user (soft delete)
export const deleteUser = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Hard delete - remove completely
    // users.splice(userIndex, 1);

    // Soft delete - mark as inactive (recommended)
    users[userIndex] = {
      ...users[userIndex],
      active: false,
    };

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

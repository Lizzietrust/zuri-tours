const users = [
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

export const getAllUsers = (req, res) => {
  try {
    const usersWithoutPassword = users.map(
      ({ password: _password, ...user }) => user,
    );

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

export const getUser = (req, res) => {
  try {
    const id = req.parsedId;
    const user = users.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const { password: _password, ...userWithoutPassword } = user;

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

export const createUser = (req, res) => {
  try {
    const { name, email, password: _password, role = "user" } = req.body;

    if (!name || !email || !_password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, email, and password",
      });
    }

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
      password: `hashed_${_password}`,
      role,
      active: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    const { password: __password, ...userWithoutPassword } = newUser;

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

export const updateUser = (req, res) => {
  try {
    const id = req.parsedId;
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const { id: _id, password: _password, ...updateData } = req.body;

    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      id: users[userIndex].id,
    };

    const { password: __password, ...userWithoutPassword } = users[userIndex];

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

export const deleteUser = (req, res) => {
  try {
    const id = req.parsedId;
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

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

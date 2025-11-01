import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { registerSchema, loginSchema } from "../utils/validation";

// Register new user
export async function register(req: Request, res: Response) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
}

// Login user
export async function login(req: Request, res: Response) {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

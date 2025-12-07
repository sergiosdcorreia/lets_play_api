"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../utils/auth");
const validation_1 = require("../utils/validation");
// Register new user
async function register(req, res) {
    try {
        // Validate input
        const validatedData = validation_1.registerSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(validatedData.password);
        // Create user
        const user = await prisma_1.prisma.user.create({
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
        const token = (0, auth_1.generateToken)(user.id);
        res.status(201).json({
            message: "User registered successfully",
            user,
            token,
        });
    }
    catch (error) {
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
async function login(req, res) {
    try {
        // Validate input
        const validatedData = validation_1.loginSchema.parse(req.body);
        // Find user
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Check password
        const isPasswordValid = await (0, auth_1.comparePassword)(validatedData.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Generate token
        const token = (0, auth_1.generateToken)(user.id);
        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    }
    catch (error) {
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

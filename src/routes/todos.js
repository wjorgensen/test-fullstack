const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All todo routes require authentication
router.use(authMiddleware);

// Validation middleware
const validateTodo = [
  body('title').notEmpty().trim().isLength({ max: 255 })
];

// Get all todos for authenticated user
router.get('/', async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get single todo by id
router.get('/:id', async (req, res) => {
  try {
    const todo = await prisma.todo.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// Create new todo
router.post('/', validateTodo, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title } = req.body;

    const todo = await prisma.todo.create({
      data: {
        title,
        userId: req.userId
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo (toggle completed or edit title)
router.put('/:id', async (req, res) => {
  try {
    const { title, completed } = req.body;

    // Check if todo exists and belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    const todo = await prisma.todo.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(todo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    // Check if todo exists and belongs to user
    const todo = await prisma.todo.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await prisma.todo.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
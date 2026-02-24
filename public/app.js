// API Configuration
const API_BASE_URL = '/api';

// State Management
let todos = [];
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const todoSection = document.getElementById('todo-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const addTodoForm = document.getElementById('add-todo-form');
const todoList = document.getElementById('todo-list');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const tabBtns = document.querySelectorAll('.tab-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Auth tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    addTodoForm.addEventListener('submit', handleAddTodo);
    logoutBtn.addEventListener('click', handleLogout);
}

// Tab Switching
function switchTab(tab) {
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }

    // Clear error messages
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}

// Authentication Functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        try {
            currentUser = JSON.parse(userStr);
            showTodoSection();
            loadTodos();
        } catch (error) {
            console.error('Invalid user data in localStorage:', error);
            showAuthSection();
        }
    } else {
        showAuthSection();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            loginForm.reset();
            showTodoSection();
            loadTodos();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            registerForm.reset();
            showTodoSection();
            loadTodos();
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    todos = [];
    showAuthSection();
}

// UI State Functions
function showAuthSection() {
    authSection.classList.remove('hidden');
    todoSection.classList.add('hidden');
    userInfo.classList.add('hidden');
}

function showTodoSection() {
    authSection.classList.add('hidden');
    todoSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userEmail.textContent = currentUser.email;
}

// Todo Functions
async function loadTodos() {
    const token = localStorage.getItem('token');
    if (!token) return;

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            todos = await response.json();
            renderTodos();
        } else if (response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        console.error('Load todos error:', error);
    } finally {
        showLoading(false);
    }
}

async function handleAddTodo(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const todoInput = document.getElementById('todo-input');
    const title = todoInput.value.trim();

    if (!title || !token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        });

        if (response.ok) {
            const newTodo = await response.json();
            todos.unshift(newTodo);
            todoInput.value = '';
            renderTodos();
        } else if (response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        console.error('Add todo error:', error);
    }
}

async function toggleTodo(id) {
    const token = localStorage.getItem('token');
    const todo = todos.find(t => t.id === id);
    if (!todo || !token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed: !todo.completed })
        });

        if (response.ok) {
            const updatedTodo = await response.json();
            todos = todos.map(t => t.id === id ? updatedTodo : t);
            renderTodos();
        } else if (response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        console.error('Toggle todo error:', error);
    }
}

async function deleteTodo(id) {
    const token = localStorage.getItem('token');
    if (!token || !confirm('Are you sure you want to delete this todo?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            todos = todos.filter(t => t.id !== id);
            renderTodos();
        } else if (response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        console.error('Delete todo error:', error);
    }
}

// Render Functions
function renderTodos() {
    const completedCount = todos.filter(t => t.completed).length;
    const pendingCount = todos.length - completedCount;

    // Update stats
    document.getElementById('total-todos').textContent = `Total: ${todos.length}`;
    document.getElementById('completed-todos').textContent = `Completed: ${completedCount}`;
    document.getElementById('pending-todos').textContent = `Pending: ${pendingCount}`;

    // Show/hide empty state
    emptyState.style.display = todos.length === 0 ? 'block' : 'none';

    // Render todos
    todoList.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-content">
                <input
                    type="checkbox"
                    class="todo-checkbox"
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo('${todo.id}')"
                >
                <span class="todo-title">${escapeHtml(todo.title)}</span>
            </div>
            <button class="btn-delete" onclick="deleteTodo('${todo.id}')">Delete</button>
        </div>
    `).join('');
}

// Utility Functions
function showLoading(show) {
    loading.classList.toggle('hidden', !show);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
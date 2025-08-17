import React, { useState, useEffect } from 'react';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export type FilterType = 'all' | 'active' | 'completed';

export const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos);
        const todosWithDates = parsed.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
        setTodos(todosWithDates);
      } catch (error) {
        console.error('Failed to parse saved todos:', error);
      }
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string) => {
    if (text.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: new Date()
      };
      setTodos(prev => [newTodo, ...prev]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const updateTodo = (id: number, newText: string) => {
    if (newText.trim()) {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? { ...todo, text: newText.trim() } : todo
        )
      );
    }
    setEditingId(null);
    setEditingText('');
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  };

  const toggleAllCompleted = () => {
    const hasIncomplete = todos.some(todo => !todo.completed);
    setTodos(prev =>
      prev.map(todo => ({ ...todo, completed: hasIncomplete }))
    );
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.filter(todo => todo.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTodo(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      updateTodo(id, editingText);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="todo-app" data-testid="todo-app">
      <header>
        <h1>Todo App</h1>
        <form onSubmit={handleSubmit} data-testid="add-todo-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What needs to be done?"
            aria-label="New todo input"
            data-testid="new-todo-input"
          />
          <button type="submit" disabled={!inputValue.trim()}>
            Add Todo
          </button>
        </form>
      </header>

      {todos.length > 0 && (
        <>
          <section className="main">
            <div className="toggle-all-container">
              <input
                type="checkbox"
                id="toggle-all"
                checked={todos.length > 0 && activeCount === 0}
                onChange={toggleAllCompleted}
                data-testid="toggle-all"
              />
              <label htmlFor="toggle-all">Mark all as complete</label>
            </div>

            <ul className="todo-list" data-testid="todo-list">
              {filteredTodos.map(todo => (
                <li
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                  data-testid={`todo-item-${todo.id}`}
                >
                  <div className="todo-view">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      aria-label={`Toggle ${todo.text}`}
                      data-testid={`toggle-${todo.id}`}
                    />
                    
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => updateTodo(todo.id, editingText)}
                        onKeyDown={(e) => handleKeyDown(e, todo.id)}
                        autoFocus
                        data-testid={`edit-input-${todo.id}`}
                      />
                    ) : (
                      <label
                        onDoubleClick={() => startEditing(todo)}
                        data-testid={`todo-label-${todo.id}`}
                      >
                        {todo.text}
                      </label>
                    )}
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      aria-label={`Delete ${todo.text}`}
                      data-testid={`delete-${todo.id}`}
                      className="delete-btn"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <footer className="footer" data-testid="footer">
            <div className="todo-count">
              <strong data-testid="active-count">{activeCount}</strong>
              <span> {activeCount === 1 ? 'item' : 'items'} left</span>
            </div>

            <div className="filters" data-testid="filters">
              <button
                className={filter === 'all' ? 'selected' : ''}
                onClick={() => setFilter('all')}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                className={filter === 'active' ? 'selected' : ''}
                onClick={() => setFilter('active')}
                data-testid="filter-active"
              >
                Active
              </button>
              <button
                className={filter === 'completed' ? 'selected' : ''}
                onClick={() => setFilter('completed')}
                data-testid="filter-completed"
              >
                Completed
              </button>
            </div>

            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                data-testid="clear-completed"
                className="clear-completed"
              >
                Clear completed ({completedCount})
              </button>
            )}
          </footer>
        </>
      )}

      {todos.length === 0 && (
        <div className="empty-state" data-testid="empty-state">
          <p>No todos yet. Add one above!</p>
        </div>
      )}
    </div>
  );
};
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoApp } from './TodoApp';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('TodoApp - Complete Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  test('renders empty state when no todos', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  test('adds new todo when form is submitted', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    const input = screen.getByTestId('new-todo-input');
    const form = screen.getByTestId('add-todo-form');

    await user.type(input, 'Learn React Testing');
    await user.click(screen.getByText('Add Todo'));

    expect(screen.getByText('Learn React Testing')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  test('adds todo on Enter key press', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    const input = screen.getByTestId('new-todo-input');
    await user.type(input, 'Test todo{enter}');

    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  test('trims whitespace from new todos', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    const input = screen.getByTestId('new-todo-input');
    await user.type(input, '  Trimmed todo  {enter}');

    expect(screen.getByText('Trimmed todo')).toBeInTheDocument();
  });

  test('does not add empty todos', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    const input = screen.getByTestId('new-todo-input');
    
    // Try submitting empty string
    await user.click(screen.getByText('Add Todo'));
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();

    // Try submitting only whitespace
    await user.type(input, '   ');
    await user.click(screen.getByText('Add Todo'));
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  test('toggles todo completion', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add a todo
    const input = screen.getByTestId('new-todo-input');
    await user.type(input, 'Complete me{enter}');

    // Find the todo item by text content
    const todoItem = screen.getByText('Complete me').closest('li')!;
    const checkbox = within(todoItem).getByRole('checkbox');

    // Initially not completed
    expect(checkbox).not.toBeChecked();
    expect(todoItem).not.toHaveClass('completed');

    // Toggle to completed
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(todoItem).toHaveClass('completed');

    // Toggle back to incomplete
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(todoItem).not.toHaveClass('completed');
  });

  test('deletes todo when delete button is clicked', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add a todo
    await user.type(screen.getByTestId('new-todo-input'), 'Delete me{enter}');
    expect(screen.getByText('Delete me')).toBeInTheDocument();

    // Delete the todo
    const deleteButton = screen.getByLabelText('Delete Delete me');
    await user.click(deleteButton);

    expect(screen.queryByText('Delete me')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  test('edits todo on double click', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add a todo
    await user.type(screen.getByTestId('new-todo-input'), 'Edit me{enter}');
    
    // Find the todo label by text
    const todoLabel = screen.getByText('Edit me');
    
    // Double click to edit
    await user.dblClick(todoLabel);
    
    // Find the edit input that appears
    const editInput = screen.getByDisplayValue('Edit me');
    expect(editInput).toBeInTheDocument();
    expect(editInput).toHaveValue('Edit me');
  });

  test('saves edit on Enter key', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add and edit a todo
    await user.type(screen.getByTestId('new-todo-input'), 'Original text{enter}');
    
    // Find and double click the todo label
    const todoLabel = screen.getByText('Original text');
    await user.dblClick(todoLabel);
    
    // Find the edit input
    const editInput = screen.getByDisplayValue('Original text');
    await user.clear(editInput);
    await user.type(editInput, 'Edited text{enter}');

    expect(screen.getByText('Edited text')).toBeInTheDocument();
    expect(screen.queryByText('Original text')).not.toBeInTheDocument();
  });

  test('cancels edit on Escape key', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add and start editing a todo
    await user.type(screen.getByTestId('new-todo-input'), 'Original{enter}');
    
    // Find and double click the todo label
    const todoLabel = screen.getByText('Original');
    await user.dblClick(todoLabel);
    
    // Find the edit input
    const editInput = screen.getByDisplayValue('Original');
    await user.clear(editInput);
    await user.type(editInput, 'Changed{escape}');

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
  });

  test('filters todos correctly', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add todos
    await user.type(screen.getByTestId('new-todo-input'), 'Active todo{enter}');
    await user.type(screen.getByTestId('new-todo-input'), 'Completed todo{enter}');

    // Complete one todo
    const completedCheckbox = screen.getAllByRole('checkbox')[1]; // Second checkbox (first is toggle-all)
    await user.click(completedCheckbox);

    // Test "All" filter (default)
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();

    // Test "Active" filter
    await user.click(screen.getByTestId('filter-active'));
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.queryByText('Completed todo')).not.toBeInTheDocument();

    // Test "Completed" filter
    await user.click(screen.getByTestId('filter-completed'));
    expect(screen.queryByText('Active todo')).not.toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();

    // Back to "All"
    await user.click(screen.getByTestId('filter-all'));
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();
  });

  test('displays correct active count', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add todos
    await user.type(screen.getByTestId('new-todo-input'), 'Todo 1{enter}');
    await user.type(screen.getByTestId('new-todo-input'), 'Todo 2{enter}');
    await user.type(screen.getByTestId('new-todo-input'), 'Todo 3{enter}');

    expect(screen.getByTestId('active-count')).toHaveTextContent('3');
    expect(screen.getByText('items left')).toBeInTheDocument();

    // Complete one todo
    const checkbox = screen.getAllByRole('checkbox')[1];
    await user.click(checkbox);

    expect(screen.getByTestId('active-count')).toHaveTextContent('2');
    expect(screen.getByText('items left')).toBeInTheDocument();

    // Complete another, leaving just one
    const checkbox2 = screen.getAllByRole('checkbox')[2];
    await user.click(checkbox2);

    expect(screen.getByTestId('active-count')).toHaveTextContent('1');
    expect(screen.getByText('item left')).toBeInTheDocument(); // Singular
  });

  test('clears completed todos', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add todos
    await user.type(screen.getByTestId('new-todo-input'), 'Keep this{enter}');
    await user.type(screen.getByTestId('new-todo-input'), 'Complete this{enter}');
    await user.type(screen.getByTestId('new-todo-input'), 'Complete this too{enter}');

    // Complete specific todos by finding their checkboxes
    const todo2 = screen.getByText('Complete this').closest('li')!;
    const checkbox2 = within(todo2).getByRole('checkbox');
    await user.click(checkbox2);

    const todo3 = screen.getByText('Complete this too').closest('li')!;
    const checkbox3 = within(todo3).getByRole('checkbox');
    await user.click(checkbox3);

    // Clear completed
    const clearButton = screen.getByTestId('clear-completed');
    expect(clearButton).toHaveTextContent('Clear completed (2)');
    
    await user.click(clearButton);

    expect(screen.getByText('Keep this')).toBeInTheDocument();
    expect(screen.queryByText('Complete this')).not.toBeInTheDocument();
    expect(screen.queryByText('Complete this too')).not.toBeInTheDocument();
    expect(screen.queryByTestId('clear-completed')).not.toBeInTheDocument();
  });

  test('toggle all functionality', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    render(<TodoApp />);

    // Add todos
    await user.type(screen.getByTestId('new-todo-input'), 'Todo 1{enter}');
    await user.type(screen.getByTestId('new-todo-input'), 'Todo 2{enter}');

    const toggleAllCheckbox = screen.getByTestId('toggle-all');
    expect(toggleAllCheckbox).not.toBeChecked();

    // Toggle all to completed
    await user.click(toggleAllCheckbox);
    
    const todoCheckboxes = screen.getAllByRole('checkbox').slice(1); // Exclude toggle-all
    todoCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
    expect(toggleAllCheckbox).toBeChecked();

    // Toggle all back to incomplete
    await user.click(toggleAllCheckbox);
    
    todoCheckboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
    expect(toggleAllCheckbox).not.toBeChecked();
  });

  test('saves and loads todos from localStorage', async () => {
    const user = userEvent.setup();
    
    // Mock initial empty state
    localStorageMock.getItem.mockReturnValue(null);
    
    render(<TodoApp />);

    // Add a todo
    await user.type(screen.getByTestId('new-todo-input'), 'Persistent todo{enter}');

    // Verify localStorage.setItem was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'todos',
      expect.stringContaining('Persistent todo')
    );
  });

  test('loads existing todos from localStorage on mount', () => {
    const savedTodos = JSON.stringify([
      {
        id: 1,
        text: 'Loaded todo',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ]);
    
    localStorageMock.getItem.mockReturnValue(savedTodos);
    
    render(<TodoApp />);

    expect(screen.getByText('Loaded todo')).toBeInTheDocument();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('todos');
  });

  test('handles corrupted localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    
    // Should not throw an error
    render(<TodoApp />);
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
import { createStore, combineReducers, applyMiddleware } from 'redux';

// Action Types
export const INCREMENT = 'INCREMENT' as const;
export const DECREMENT = 'DECREMENT' as const;
export const SET_COUNT = 'SET_COUNT' as const;
export const ADD_TODO = 'ADD_TODO' as const;
export const TOGGLE_TODO = 'TOGGLE_TODO' as const;
export const DELETE_TODO = 'DELETE_TODO' as const;

// Action Creators
export const increment = () => ({ type: INCREMENT });
export const decrement = () => ({ type: DECREMENT });
export const setCount = (count: number) => ({ type: SET_COUNT, payload: count });

export const addTodo = (text: string) => ({
  type: ADD_TODO,
  payload: { id: Date.now(), text, completed: false }
});

export const toggleTodo = (id: number) => ({
  type: TOGGLE_TODO,
  payload: id
});

export const deleteTodo = (id: number) => ({
  type: DELETE_TODO,
  payload: id
});

// Types
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export interface CounterState {
  count: number;
}

export interface TodoState {
  todos: Todo[];
}

export interface RootState {
  counter: CounterState;
  todos: TodoState;
}

export type CounterAction = 
  | ReturnType<typeof increment>
  | ReturnType<typeof decrement>
  | ReturnType<typeof setCount>;

export type TodoAction = 
  | ReturnType<typeof addTodo>
  | ReturnType<typeof toggleTodo>
  | ReturnType<typeof deleteTodo>;

// Reducers
const counterReducer = (
  state: CounterState = { count: 0 },
  action: CounterAction
): CounterState => {
  switch (action.type) {
    case INCREMENT:
      return { count: state.count + 1 };
    case DECREMENT:
      return { count: state.count - 1 };
    case SET_COUNT:
      return { count: action.payload };
    default:
      return state;
  }
};

const todoReducer = (
  state: TodoState = { todos: [] },
  action: TodoAction
): TodoState => {
  switch (action.type) {
    case ADD_TODO:
      return {
        todos: [...state.todos, action.payload]
      };
    case TOGGLE_TODO:
      return {
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    case DELETE_TODO:
      return {
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  counter: counterReducer,
  todos: todoReducer
});

// Store
export const createAppStore = (initialState?: Partial<RootState>) =>
  createStore(rootReducer, initialState);

export const store = createAppStore();
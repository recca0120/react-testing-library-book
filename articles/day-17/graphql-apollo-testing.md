# Day 17: GraphQL 測試 - Apollo Client

## 學習目標

- 理解 GraphQL 與 Apollo Client 的測試策略
- 學會使用 MockedProvider 進行測試
- 掌握 Query、Mutation、Subscription 的測試方法
- 了解 Apollo Client 快取的測試技巧
- 熟悉錯誤處理和載入狀態的測試

## GraphQL 測試概述

GraphQL 測試與 REST API 測試有所不同，主要體現在：

- **單一端點** - 所有請求都發送到同一個 URL
- **查詢語言** - 使用 GraphQL 查詢語法
- **型別系統** - 強型別的 schema
- **快取機制** - Apollo Client 內建智能快取

### Apollo Client 測試架構

```
E2E Tests (端對端測試)
    ↓
Integration Tests (整合測試)
    ↓
Component Tests with Apollo (元件 + Apollo 測試)
    ↓
Hook Tests (自定義 Hook 測試)
    ↓
Query/Mutation Unit Tests (查詢/變更單元測試)
```

## 環境設定

```bash
npm install @apollo/client graphql
npm install -D @apollo/client/testing
```

## Apollo Client 設定

```typescript
// apollo/client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Post: {
        fields: {
          comments: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// 測試用的 client 工廠函數
export const createTestClient = () => {
  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
};
```

## GraphQL Schema 與 Operations

```typescript
// graphql/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  comments: Comment[];
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
  createdAt: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
}

export interface UpdatePostInput {
  id: string;
  title?: string;
  content?: string;
}
```

```typescript
// graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_POSTS = gql`
  query GetPosts($first: Int, $after: String) {
    posts(first: $first, after: $after) {
      edges {
        node {
          id
          title
          content
          author {
            id
            name
            avatar
          }
          likesCount
          isLiked
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
      author {
        id
        name
        email
        avatar
      }
      comments {
        id
        content
        author {
          id
          name
          avatar
        }
        createdAt
      }
      likesCount
      isLiked
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      name
      email
      avatar
      createdAt
    }
  }
`;
```

```typescript
// graphql/mutations.ts
import { gql } from '@apollo/client';

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      author {
        id
        name
        avatar
      }
      likesCount
      isLiked
      createdAt
    }
  }
`;

export const UPDATE_POST = gql`
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) {
      id
      title
      content
      updatedAt
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      success
      message
    }
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLiked
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($postId: ID!, $content: String!) {
    createComment(postId: $postId, content: $content) {
      id
      content
      author {
        id
        name
        avatar
      }
      createdAt
    }
  }
`;
```

```typescript
// graphql/subscriptions.ts
import { gql } from '@apollo/client';

export const POST_UPDATED = gql`
  subscription PostUpdated($postId: ID!) {
    postUpdated(postId: $postId) {
      id
      title
      content
      likesCount
      updatedAt
    }
  }
`;

export const NEW_COMMENT = gql`
  subscription NewComment($postId: ID!) {
    newComment(postId: $postId) {
      id
      content
      author {
        id
        name
        avatar
      }
      createdAt
    }
  }
`;
```

## Query 測試

### 基本 Query 元件測試

```typescript
// components/PostsList.tsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_POSTS } from '../graphql/queries';
import { Post } from '../graphql/types';

interface PostsData {
  posts: {
    edges: Array<{
      node: Post;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}

interface PostsVars {
  first?: number;
  after?: string;
}

export const PostsList: React.FC = () => {
  const { data, loading, error, fetchMore } = useQuery<PostsData, PostsVars>(
    GET_POSTS,
    {
      variables: { first: 10 },
      notifyOnNetworkStatusChange: true,
    }
  );

  const handleLoadMore = async () => {
    if (data?.posts.pageInfo.hasNextPage) {
      await fetchMore({
        variables: {
          after: data.posts.pageInfo.endCursor,
        },
      });
    }
  };

  if (loading && !data) {
    return <div role="status">Loading posts...</div>;
  }

  if (error) {
    return (
      <div role="alert">
        <p>Error loading posts: {error.message}</p>
      </div>
    );
  }

  const posts = data?.posts.edges.map(edge => edge.node) || [];

  if (posts.length === 0) {
    return <div>No posts found</div>;
  }

  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id} data-testid={`post-${post.id}`}>
            <h3>{post.title}</h3>
            <p>By: {post.author.name}</p>
            <p>{post.content}</p>
            <div>
              <span>{post.likesCount} likes</span>
              {post.isLiked && <span> ❤️</span>}
            </div>
            <small>{new Date(post.createdAt).toLocaleDateString()}</small>
          </li>
        ))}
      </ul>
      
      {data?.posts.pageInfo.hasNextPage && (
        <button 
          onClick={handleLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

```typescript
// components/PostsList.test.tsx
import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { PostsList } from './PostsList';
import { GET_POSTS } from '../graphql/queries';

const mockPosts = [
  {
    id: '1',
    title: 'First Post',
    content: 'This is the first post content',
    author: {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'https://example.com/alice.jpg',
    },
    likesCount: 5,
    isLiked: true,
    createdAt: '2023-01-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Second Post',
    content: 'This is the second post content',
    author: {
      id: '2',
      name: 'Bob Smith',
      avatar: 'https://example.com/bob.jpg',
    },
    likesCount: 3,
    isLiked: false,
    createdAt: '2023-01-02T14:30:00Z',
  },
];

const mocks: MockedResponse[] = [
  {
    request: {
      query: GET_POSTS,
      variables: { first: 10 },
    },
    result: {
      data: {
        posts: {
          edges: mockPosts.map(post => ({
            node: post,
            cursor: `cursor-${post.id}`,
          })),
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-1',
            endCursor: 'cursor-2',
          },
        },
      },
    },
  },
];

const renderWithApollo = (mocks: MockedResponse[] = []) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <PostsList />
    </MockedProvider>
  );
};

describe('PostsList', () => {
  test('should show loading state initially', () => {
    renderWithApollo(mocks);
    
    expect(screen.getByRole('status')).toHaveTextContent('Loading posts...');
  });

  test('should display posts when loaded successfully', async () => {
    renderWithApollo(mocks);

    await waitFor(() => {
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
    expect(screen.getByText('By: Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('By: Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('5 likes')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  test('should display error message when query fails', async () => {
    const errorMocks: MockedResponse[] = [
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        error: new Error('Network error occurred'),
      },
    ];

    renderWithApollo(errorMocks);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error loading posts: Network error occurred/)).toBeInTheDocument();
  });

  test('should display GraphQL errors', async () => {
    const errorMocks: MockedResponse[] = [
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          errors: [new GraphQLError('Posts not found')],
        },
      },
    ];

    renderWithApollo(errorMocks);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error loading posts: Posts not found/)).toBeInTheDocument();
  });

  test('should display no posts message when posts array is empty', async () => {
    const emptyMocks: MockedResponse[] = [
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          data: {
            posts: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
            },
          },
        },
      },
    ];

    renderWithApollo(emptyMocks);

    await waitFor(() => {
      expect(screen.getByText('No posts found')).toBeInTheDocument();
    });
  });

  test('should handle load more functionality', async () => {
    const user = userEvent.setup();
    
    const loadMoreMocks: MockedResponse[] = [
      ...mocks,
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10, after: 'cursor-2' },
        },
        result: {
          data: {
            posts: {
              edges: [
                {
                  node: {
                    id: '3',
                    title: 'Third Post',
                    content: 'This is the third post',
                    author: {
                      id: '3',
                      name: 'Charlie Brown',
                      avatar: 'https://example.com/charlie.jpg',
                    },
                    likesCount: 2,
                    isLiked: false,
                    createdAt: '2023-01-03T09:15:00Z',
                  },
                  cursor: 'cursor-3',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'cursor-3',
                endCursor: 'cursor-3',
              },
            },
          },
        },
      },
    ];

    renderWithApollo(loadMoreMocks);

    // 等待初始載入完成
    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    // 點擊載入更多
    const loadMoreButton = screen.getByText('Load More');
    await user.click(loadMoreButton);

    // 確認載入中狀態
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // 等待載入完成
    await waitFor(() => {
      expect(screen.getByText('Third Post')).toBeInTheDocument();
    });

    // 確認載入更多按鈕消失（因為沒有更多頁面）
    expect(screen.queryByText('Load More')).not.toBeInTheDocument();
  });

  test('should not show load more button when hasNextPage is false', async () => {
    const noMorePagesMocks: MockedResponse[] = [
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          data: {
            posts: {
              edges: mockPosts.map(post => ({
                node: post,
                cursor: `cursor-${post.id}`,
              })),
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'cursor-1',
                endCursor: 'cursor-2',
              },
            },
          },
        },
      },
    ];

    renderWithApollo(noMorePagesMocks);

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    expect(screen.queryByText('Load More')).not.toBeInTheDocument();
  });
});
```

## Mutation 測試

### Mutation 元件實作

```typescript
// components/CreatePostForm.tsx
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_POST, GET_POSTS } from '../graphql';
import { CreatePostInput, Post } from '../graphql/types';

interface CreatePostData {
  createPost: Post;
}

interface CreatePostVars {
  input: CreatePostInput;
}

export const CreatePostForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createPost, { loading, error }] = useMutation<CreatePostData, CreatePostVars>(
    CREATE_POST,
    {
      refetchQueries: [{ query: GET_POSTS, variables: { first: 10 } }],
      onCompleted: (data) => {
        setTitle('');
        setContent('');
        setErrors({});
      },
      onError: (error) => {
        const validationErrors: Record<string, string> = {};
        error.graphQLErrors.forEach((graphQLError) => {
          if (graphQLError.extensions?.code === 'VALIDATION_ERROR') {
            const field = graphQLError.extensions.field as string;
            validationErrors[field] = graphQLError.message;
          }
        });
        setErrors(validationErrors);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setErrors({
        title: !title.trim() ? 'Title is required' : '',
        content: !content.trim() ? 'Content is required' : '',
      });
      return;
    }

    try {
      await createPost({
        variables: {
          input: { title: title.trim(), content: content.trim() },
        },
      });
    } catch (error) {
      // Error handling is done in onError callback
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Post</h2>
      
      <div>
        <label htmlFor="title">Title:</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <div id="title-error" role="alert" style={{ color: 'red' }}>
            {errors.title}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="content">Content:</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          rows={4}
          aria-describedby={errors.content ? 'content-error' : undefined}
        />
        {errors.content && (
          <div id="content-error" role="alert" style={{ color: 'red' }}>
            {errors.content}
          </div>
        )}
      </div>

      {error && !Object.keys(errors).length && (
        <div role="alert" style={{ color: 'red' }}>
          Error: {error.message}
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
};
```

```typescript
// components/CreatePostForm.test.tsx
import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { CreatePostForm } from './CreatePostForm';
import { CREATE_POST, GET_POSTS } from '../graphql';

const mockPost = {
  id: '1',
  title: 'New Test Post',
  content: 'This is a new test post content',
  author: {
    id: '1',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
  },
  likesCount: 0,
  isLiked: false,
  createdAt: '2023-01-01T10:00:00Z',
};

const renderWithApollo = (mocks: MockedResponse[] = []) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CreatePostForm />
    </MockedProvider>
  );
};

describe('CreatePostForm', () => {
  test('should render form fields correctly', () => {
    renderWithApollo();
    
    expect(screen.getByText('Create New Post')).toBeInTheDocument();
    expect(screen.getByLabelText('Title:')).toBeInTheDocument();
    expect(screen.getByLabelText('Content:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Post' })).toBeInTheDocument();
  });

  test('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithApollo();

    const submitButton = screen.getByRole('button', { name: 'Create Post' });
    await user.click(submitButton);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Content is required')).toBeInTheDocument();
  });

  test('should create post successfully', async () => {
    const user = userEvent.setup();
    
    const mocks: MockedResponse[] = [
      {
        request: {
          query: CREATE_POST,
          variables: {
            input: {
              title: 'New Test Post',
              content: 'This is a new test post content',
            },
          },
        },
        result: {
          data: {
            createPost: mockPost,
          },
        },
      },
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          data: {
            posts: {
              edges: [
                {
                  node: mockPost,
                  cursor: 'cursor-1',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'cursor-1',
                endCursor: 'cursor-1',
              },
            },
          },
        },
      },
    ];

    renderWithApollo(mocks);

    const titleInput = screen.getByLabelText('Title:');
    const contentTextarea = screen.getByLabelText('Content:');
    const submitButton = screen.getByRole('button', { name: 'Create Post' });

    await user.type(titleInput, 'New Test Post');
    await user.type(contentTextarea, 'This is a new test post content');
    await user.click(submitButton);

    // 確認載入狀態
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument();

    // 等待完成
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Post' })).toBeInTheDocument();
    });

    // 確認表單已清空
    expect(titleInput).toHaveValue('');
    expect(contentTextarea).toHaveValue('');
  });

  test('should handle network errors', async () => {
    const user = userEvent.setup();
    
    const mocks: MockedResponse[] = [
      {
        request: {
          query: CREATE_POST,
          variables: {
            input: {
              title: 'New Test Post',
              content: 'This is a new test post content',
            },
          },
        },
        error: new Error('Network error'),
      },
    ];

    renderWithApollo(mocks);

    const titleInput = screen.getByLabelText('Title:');
    const contentTextarea = screen.getByLabelText('Content:');
    const submitButton = screen.getByRole('button', { name: 'Create Post' });

    await user.type(titleInput, 'New Test Post');
    await user.type(contentTextarea, 'This is a new test post content');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  test('should handle validation errors from server', async () => {
    const user = userEvent.setup();
    
    const mocks: MockedResponse[] = [
      {
        request: {
          query: CREATE_POST,
          variables: {
            input: {
              title: 'Invalid Title',
              content: 'Short',
            },
          },
        },
        result: {
          errors: [
            new GraphQLError('Title must be at least 10 characters', {
              extensions: {
                code: 'VALIDATION_ERROR',
                field: 'title',
              },
            }),
            new GraphQLError('Content must be at least 20 characters', {
              extensions: {
                code: 'VALIDATION_ERROR',
                field: 'content',
              },
            }),
          ],
        },
      },
    ];

    renderWithApollo(mocks);

    const titleInput = screen.getByLabelText('Title:');
    const contentTextarea = screen.getByLabelText('Content:');
    const submitButton = screen.getByRole('button', { name: 'Create Post' });

    await user.type(titleInput, 'Invalid Title');
    await user.type(contentTextarea, 'Short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 10 characters')).toBeInTheDocument();
      expect(screen.getByText('Content must be at least 20 characters')).toBeInTheDocument();
    });
  });

  test('should disable form fields during submission', async () => {
    const user = userEvent.setup();
    
    // 使用永不解析的 Promise 來模擬載入狀態
    const mocks: MockedResponse[] = [
      {
        request: {
          query: CREATE_POST,
          variables: {
            input: {
              title: 'Test Title',
              content: 'Test Content',
            },
          },
        },
        delay: Infinity, // 永不解析
        result: {
          data: {
            createPost: mockPost,
          },
        },
      },
    ];

    renderWithApollo(mocks);

    const titleInput = screen.getByLabelText('Title:');
    const contentTextarea = screen.getByLabelText('Content:');
    const submitButton = screen.getByRole('button', { name: 'Create Post' });

    await user.type(titleInput, 'Test Title');
    await user.type(contentTextarea, 'Test Content');
    await user.click(submitButton);

    // 確認表單欄位被禁用
    expect(titleInput).toBeDisabled();
    expect(contentTextarea).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });
});
```

## Custom Hook 測試

```typescript
// hooks/usePosts.ts
import { useQuery, useMutation, QueryResult } from '@apollo/client';
import { GET_POSTS, CREATE_POST, LIKE_POST } from '../graphql';

export interface UsePostsResult {
  posts: Post[];
  loading: boolean;
  error: any;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  refetch: () => Promise<any>;
}

export const usePosts = (first: number = 10): UsePostsResult => {
  const { data, loading, error, fetchMore, refetch } = useQuery(GET_POSTS, {
    variables: { first },
    notifyOnNetworkStatusChange: true,
  });

  const [createPostMutation] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS, variables: { first } }],
  });

  const [likePostMutation] = useMutation(LIKE_POST);

  const posts = data?.posts.edges.map(edge => edge.node) || [];
  const hasNextPage = data?.posts.pageInfo.hasNextPage || false;

  const loadMore = async () => {
    if (hasNextPage) {
      await fetchMore({
        variables: {
          after: data?.posts.pageInfo.endCursor,
        },
      });
    }
  };

  const createPost = async (input: CreatePostInput) => {
    await createPostMutation({
      variables: { input },
    });
  };

  const likePost = async (postId: string) => {
    await likePostMutation({
      variables: { postId },
      optimisticResponse: {
        likePost: {
          id: postId,
          likesCount: posts.find(p => p.id === postId)?.likesCount + 1,
          isLiked: true,
          __typename: 'Post',
        },
      },
    });
  };

  return {
    posts,
    loading,
    error,
    hasNextPage,
    loadMore,
    createPost,
    likePost,
    refetch,
  };
};
```

```typescript
// hooks/usePosts.test.ts
import { describe, test, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ReactNode } from 'react';
import { usePosts } from './usePosts';
import { GET_POSTS, CREATE_POST, LIKE_POST } from '../graphql';

const mockPosts = [
  {
    id: '1',
    title: 'Test Post 1',
    content: 'Content 1',
    author: { id: '1', name: 'Author 1', avatar: null },
    likesCount: 5,
    isLiked: false,
    createdAt: '2023-01-01T10:00:00Z',
  },
];

const createWrapper = (mocks: MockedResponse[]) => {
  return ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
};

describe('usePosts', () => {
  test('should return posts data when loaded successfully', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          data: {
            posts: {
              edges: mockPosts.map(post => ({
                node: post,
                cursor: `cursor-${post.id}`,
              })),
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'cursor-1',
                endCursor: 'cursor-1',
              },
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(mocks),
    });

    // 初始狀態
    expect(result.current.loading).toBe(true);
    expect(result.current.posts).toEqual([]);

    // 等待載入完成
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.posts).toEqual(mockPosts);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.error).toBe(undefined);
  });

  test('should handle createPost', async () => {
    const newPost = {
      id: '2',
      title: 'New Post',
      content: 'New Content',
      author: { id: '1', name: 'Author 1', avatar: null },
      likesCount: 0,
      isLiked: false,
      createdAt: '2023-01-02T10:00:00Z',
    };

    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          data: {
            posts: {
              edges: mockPosts.map(post => ({
                node: post,
                cursor: `cursor-${post.id}`,
              })),
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'cursor-1',
                endCursor: 'cursor-1',
              },
            },
          },
        },
      },
      {
        request: {
          query: CREATE_POST,
          variables: {
            input: { title: 'New Post', content: 'New Content' },
          },
        },
        result: {
          data: {
            createPost: newPost,
          },
        },
      },
      // Refetch after create
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          data: {
            posts: {
              edges: [...mockPosts, newPost].map(post => ({
                node: post,
                cursor: `cursor-${post.id}`,
              })),
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'cursor-1',
                endCursor: 'cursor-2',
              },
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 執行 createPost
    await result.current.createPost({
      title: 'New Post',
      content: 'New Content',
    });

    // 驗證結果 (在實際應用中，refetch 會更新 posts)
    expect(result.current.posts).toHaveLength(1);
  });

  test('should handle likePost with optimistic response', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_POSTS,
          variables: { first: 10 },
        },
        result: {
          data: {
            posts: {
              edges: mockPosts.map(post => ({
                node: post,
                cursor: `cursor-${post.id}`,
              })),
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'cursor-1',
                endCursor: 'cursor-1',
              },
            },
          },
        },
      },
      {
        request: {
          query: LIKE_POST,
          variables: { postId: '1' },
        },
        result: {
          data: {
            likePost: {
              id: '1',
              likesCount: 6,
              isLiked: true,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 執行 likePost
    await result.current.likePost('1');

    // 樂觀更新應該立即反映（在真實場景中）
    // 這裡只是驗證函數可以被調用而不出錯
    expect(result.current.posts).toHaveLength(1);
  });
});
```

## 快取測試

```typescript
// components/PostDetail.test.tsx - 測試快取行為
import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { GET_POST, GET_POSTS } from '../graphql';
import { PostDetail } from './PostDetail';

describe('Apollo Cache Integration', () => {
  test('should use cached data from previous query', async () => {
    const cache = new InMemoryCache();
    
    // 預先寫入快取
    cache.writeQuery({
      query: GET_POST,
      variables: { id: '1' },
      data: {
        post: {
          id: '1',
          title: 'Cached Post',
          content: 'This is cached content',
          author: {
            id: '1',
            name: 'Cached Author',
            email: 'cached@example.com',
            avatar: null,
          },
          comments: [],
          likesCount: 10,
          isLiked: true,
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T10:00:00Z',
          __typename: 'Post',
        },
      },
    });

    render(
      <MockedProvider cache={cache} mocks={[]} addTypename={true}>
        <PostDetail postId="1" />
      </MockedProvider>
    );

    // 應該立即顯示快取的資料，不會有載入狀態
    expect(screen.getByText('Cached Post')).toBeInTheDocument();
    expect(screen.getByText('Cached Author')).toBeInTheDocument();
    expect(screen.getByText('10 likes')).toBeInTheDocument();
  });

  test('should update cache after mutation', async () => {
    // 這個測試展示 mutation 如何更新快取
    // 實際實作會根據具體的 update 函數而定
  });
});
```

## 常見問題

**Q: MockedProvider 的 addTypename 參數有什麼作用？**
A: Apollo Client 預設會在查詢中加入 __typename 欄位。設定 addTypename={false} 可以簡化 mock 資料，但要確保與實際查詢一致。

**Q: 如何測試 Apollo Client 的錯誤邊界？**
A: 可以使用 errorPolicy 設定和 MockedResponse 的 error 屬性來模擬各種錯誤情況。

**Q: 如何測試 Subscription？**
A: 使用 MockedProvider 的 subscriptions mock 功能，或者使用 subscriptions-transport-ws 的測試工具。

**Q: 如何測試樂觀更新？**
A: 在 mutation 的 optimisticResponse 中設定預期的樂觀回應，然後驗證 UI 的即時更新。

## 練習題

1. **文章評論系統**
   ```typescript
   // 實作文章評論的 CRUD 功能並撰寫測試：
   // - 顯示評論列表
   // - 新增評論
   // - 編輯評論
   // - 刪除評論
   // 包含樂觀更新和錯誤處理
   ```

2. **即時聊天室**
   ```typescript
   // 使用 GraphQL Subscription 實作聊天室：
   // - 接收即時訊息
   // - 發送訊息
   // - 使用者上線/離線狀態
   // - 測試連線中斷和重連
   ```

3. **分頁與搜尋整合**
   ```typescript
   // 實作帶搜尋功能的分頁列表：
   // - 關鍵字搜尋
   // - 無限滾動載入
   // - 搜尋結果快取
   // - 搜尋狀態管理
   ```

## 延伸閱讀

- [Apollo Client Testing 官方文件](https://www.apollographql.com/docs/react/development-testing/testing/)
- [GraphQL 測試最佳實踐](https://graphql.org/learn/serving-over-http/)
- [Mock Service Worker (MSW) with GraphQL](https://mswjs.io/docs/getting-started/mocks/graphql-api)
- [Apollo Client Caching](https://www.apollographql.com/docs/react/caching/cache-configuration/)
- [GraphQL Code Generator](https://graphql-code-generator.com/)

## 本日重點回顧

✅ 了解 GraphQL 與 Apollo Client 的測試策略
✅ 學會使用 MockedProvider 進行元件測試
✅ 掌握 Query 和 Mutation 的完整測試方法
✅ 熟悉自定義 Hook 的測試技巧
✅ 理解 Apollo Client 快取的測試方式
✅ 學會處理載入、錯誤和樂觀更新的測試
✅ 建立 GraphQL 測試的最佳實踐

明天我們將學習 WebSocket 的測試策略，了解如何測試即時通訊功能！
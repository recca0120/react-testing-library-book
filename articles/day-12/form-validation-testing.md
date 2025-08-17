# Day 12: 表單驗證測試

## 學習目標
- 掌握表單驗證的測試策略
- 學會測試即時驗證和提交驗證
- 了解如何測試第三方表單庫（Formik、React Hook Form）
- 掌握複雜表單驗證場景的測試方法

## 概念說明

表單是 Web 應用程式的核心功能之一，表單驗證確保數據的正確性和完整性。測試表單驗證涉及：

1. **欄位驗證**：必填、格式、長度等基本驗證
2. **跨欄位驗證**：密碼確認、日期範圍等
3. **即時驗證**：使用者輸入時的即時反饋
4. **提交驗證**：表單提交前的完整驗證
5. **錯誤處理**：API 錯誤、網路錯誤等

### 測試策略

1. **使用者導向**：從使用者操作角度測試
2. **狀態驗證**：檢查表單內部狀態
3. **錯誤訊息**：驗證錯誤訊息的顯示
4. **邊界測試**：測試邊界值和異常情況

## 實作範例

### 基本表單組件

```typescript
// components/RegistrationForm.tsx
import React, { useState } from 'react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  age: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  age?: string;
}

export const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    age: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        break;
      
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        break;
      
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        break;
      
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        if (value.trim().length < 2) return `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
        break;
      
      case 'age':
        if (!value) return 'Age is required';
        const ageNum = parseInt(value, 10);
        if (isNaN(ageNum)) return 'Age must be a number';
        if (ageNum < 13 || ageNum > 120) return 'Age must be between 13 and 120';
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Real-time validation
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      
      // Re-validate confirm password if password changes
      if (fieldName === 'password' && touched.confirmPassword) {
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const fieldName = name as keyof FormData;
    
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, formData[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof FormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
    } catch (error) {
      setErrors({ email: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div data-testid="success-message">
        <h2>Registration Successful!</h2>
        <p>Welcome, {formData.firstName}!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="registration-form">
      <h1>Registration Form</h1>
      
      <div>
        <label htmlFor="firstName">First Name:</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          data-testid="first-name-input"
        />
        {errors.firstName && (
          <span data-testid="first-name-error" role="alert">
            {errors.firstName}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="lastName">Last Name:</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          data-testid="last-name-input"
        />
        {errors.lastName && (
          <span data-testid="last-name-error" role="alert">
            {errors.lastName}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          data-testid="email-input"
        />
        {errors.email && (
          <span data-testid="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="age">Age:</label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={handleInputChange}
          onBlur={handleBlur}
          data-testid="age-input"
        />
        {errors.age && (
          <span data-testid="age-error" role="alert">
            {errors.age}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          onBlur={handleBlur}
          data-testid="password-input"
        />
        {errors.password && (
          <span data-testid="password-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          onBlur={handleBlur}
          data-testid="confirm-password-input"
        />
        {errors.confirmPassword && (
          <span data-testid="confirm-password-error" role="alert">
            {errors.confirmPassword}
          </span>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        data-testid="submit-button"
      >
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};
```

### 基本表單驗證測試

```typescript
// components/__tests__/RegistrationForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationForm } from '../RegistrationForm';

describe('RegistrationForm', () => {
  beforeEach(() => {
    render(<RegistrationForm />);
  });

  it('should render all form fields', () => {
    expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('age-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  describe('Field Validation', () => {
    it('should show error when first name is empty', async () => {
      const user = userEvent.setup();
      const firstNameInput = screen.getByTestId('first-name-input');

      await user.click(firstNameInput);
      await user.tab(); // Trigger blur

      expect(screen.getByTestId('first-name-error')).toHaveTextContent(
        'First name is required'
      );
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      const emailInput = screen.getByTestId('email-input');

      await user.type(emailInput, 'invalid-email');
      await user.tab();

      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Invalid email format'
      );
    });

    it('should show error for weak password', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId('password-input');

      await user.type(passwordInput, '123');
      await user.tab();

      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must be at least 8 characters'
      );
    });

    it('should show error for password without required characters', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId('password-input');

      await user.type(passwordInput, 'onlyletters');
      await user.tab();

      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must contain uppercase, lowercase, and number'
      );
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'DifferentPassword123');
      await user.tab();

      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent(
        'Passwords do not match'
      );
    });

    it('should show error for invalid age', async () => {
      const user = userEvent.setup();
      const ageInput = screen.getByTestId('age-input');

      await user.type(ageInput, '5');
      await user.tab();

      expect(screen.getByTestId('age-error')).toHaveTextContent(
        'Age must be between 13 and 120'
      );
    });
  });

  describe('Real-time Validation', () => {
    it('should validate email in real-time after first blur', async () => {
      const user = userEvent.setup();
      const emailInput = screen.getByTestId('email-input');

      // First interaction - blur to mark as touched
      await user.type(emailInput, 'invalid');
      await user.tab();

      expect(screen.getByTestId('email-error')).toBeInTheDocument();

      // Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@email.com');

      // Error should disappear during typing
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    it('should re-validate confirm password when password changes', async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');

      // Set initial passwords
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.tab(); // Mark confirm password as touched

      // Change original password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'NewPassword123');

      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent(
        'Passwords do not match'
      );
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = async (user: any) => {
      await user.type(screen.getByTestId('first-name-input'), 'John');
      await user.type(screen.getByTestId('last-name-input'), 'Doe');
      await user.type(screen.getByTestId('email-input'), 'john.doe@example.com');
      await user.type(screen.getByTestId('age-input'), '25');
      await user.type(screen.getByTestId('password-input'), 'Password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'Password123');
    };

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      
      await fillValidForm(user);
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(submitButton).toHaveTextContent('Registering...');
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });

      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    it('should show all errors when submitting invalid form', async () => {
      const user = userEvent.setup();
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // All required field errors should appear
      expect(screen.getByTestId('first-name-error')).toBeInTheDocument();
      expect(screen.getByTestId('last-name-error')).toBeInTheDocument();
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByTestId('age-error')).toBeInTheDocument();
      expect(screen.getByTestId('password-error')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-error')).toBeInTheDocument();
    });

    it('should not submit when validation fails', async () => {
      const user = userEvent.setup();
      
      // Fill some fields but leave others invalid
      await user.type(screen.getByTestId('first-name-input'), 'John');
      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should not show success message
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
      expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email format');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      expect(screen.getByLabelText('First Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Email:')).toBeInTheDocument();
      expect(screen.getByLabelText('Age:')).toBeInTheDocument();
      expect(screen.getByLabelText('Password:')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password:')).toBeInTheDocument();
    });

    it('should have role="alert" on error messages', async () => {
      const user = userEvent.setup();
      const emailInput = screen.getByTestId('email-input');

      await user.type(emailInput, 'invalid');
      await user.tab();

      const errorMessage = screen.getByTestId('email-error');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });
});
```

### React Hook Form 測試

```typescript
// components/ReactHookFormExample.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type FormData = yup.InferType<typeof schema>;

export const ReactHookFormExample: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API error for testing
      if (data.username === 'taken') {
        setError('username', {
          type: 'server',
          message: 'Username is already taken'
        });
        return;
      }
      
      console.log('Form submitted:', data);
    } catch (error) {
      setError('root', {
        type: 'server',
        message: 'Submission failed. Please try again.'
      });
    }
  };

  if (isSubmitSuccessful && !errors.username && !errors.root) {
    return (
      <div data-testid="success-message">
        <h2>Form submitted successfully!</h2>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="react-hook-form">
      <div>
        <label htmlFor="username">Username:</label>
        <input
          {...register('username')}
          id="username"
          data-testid="username-input"
        />
        {errors.username && (
          <span data-testid="username-error" role="alert">
            {errors.username.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input
          {...register('email')}
          id="email"
          type="email"
          data-testid="email-input"
        />
        {errors.email && (
          <span data-testid="email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password:</label>
        <input
          {...register('password')}
          id="password"
          type="password"
          data-testid="password-input"
        />
        {errors.password && (
          <span data-testid="password-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </div>

      {errors.root && (
        <div data-testid="form-error" role="alert">
          {errors.root.message}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting}
        data-testid="submit-button"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### React Hook Form 測試

```typescript
// components/__tests__/ReactHookFormExample.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactHookFormExample } from '../ReactHookFormExample';

describe('ReactHookFormExample', () => {
  it('should validate fields on blur', async () => {
    const user = userEvent.setup();
    render(<ReactHookFormExample />);

    const usernameInput = screen.getByTestId('username-input');
    
    await user.type(usernameInput, 'ab');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toHaveTextContent(
        'Username must be at least 3 characters'
      );
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<ReactHookFormExample />);

    await user.type(screen.getByTestId('username-input'), 'validuser');
    await user.type(screen.getByTestId('email-input'), 'user@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('should handle server-side validation errors', async () => {
    const user = userEvent.setup();
    render(<ReactHookFormExample />);

    // Use the username that triggers server error
    await user.type(screen.getByTestId('username-input'), 'taken');
    await user.type(screen.getByTestId('email-input'), 'user@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toHaveTextContent(
        'Username is already taken'
      );
    });
  });
});
```

## 常見問題

### Q: 如何測試非同步表單驗證（如檢查用戶名是否重複）？

**A:** 使用 Mock API 並配合 waitFor：

```typescript
// Mock API call
const mockCheckUsername = vi.fn();
mockCheckUsername.mockResolvedValue({ isAvailable: false });

// Test
await user.type(usernameInput, 'existinguser');
await user.tab();

await waitFor(() => {
  expect(screen.getByText('Username is not available')).toBeInTheDocument();
});
```

### Q: 如何測試複雜的跨欄位驗證？

**A:** 分別測試獨立欄位驗證和跨欄位邏輯：

```typescript
it('should validate date range', async () => {
  const user = userEvent.setup();
  
  await user.type(startDateInput, '2023-12-01');
  await user.type(endDateInput, '2023-11-01');
  await user.tab();

  expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
});
```

### Q: 如何測試動態表單欄位？

**A:** 測試添加、移除欄位的邏輯：

```typescript
it('should add new field when button clicked', async () => {
  const user = userEvent.setup();
  
  expect(screen.getAllByTestId(/phone-input/)).toHaveLength(1);
  
  await user.click(screen.getByTestId('add-phone-button'));
  
  expect(screen.getAllByTestId(/phone-input/)).toHaveLength(2);
});
```

## 練習題

### 練習 1：多步驟表單驗證
創建一個多步驟註冊表單：
- 每步都有獨立的驗證
- 測試步驟間的數據保持
- 測試最終提交的完整驗證

### 練習 2：檔案上傳表單
實現檔案上傳驗證：
- 檔案類型驗證
- 檔案大小限制
- 多檔案上傳

### 練習 3：動態表單生成器
創建基於 JSON 配置的表單：
- 不同欄位類型的驗證
- 條件顯示邏輯
- 自定義驗證規則

## 延伸閱讀

- [React Hook Form Testing](https://react-hook-form.com/advanced-usage#Testing)
- [Formik Testing Guide](https://formik.org/docs/guides/testing)
- [Form Accessibility Testing](https://webaim.org/techniques/forms/)
- [Complex Form Validation Patterns](https://kentcdodds.com/blog/testing-implementation-details)

## 本日重點回顧

1. **驗證測試策略**：從使用者角度測試表單行為
2. **即時驗證**：測試輸入過程中的驗證反饋
3. **提交流程**：測試完整的表單提交邏輯
4. **第三方庫整合**：React Hook Form、Formik 等的測試方法
5. **可訪問性**：確保表單對所有使用者友善

明天我們將學習測試可訪問性（Accessibility），探討如何確保應用程式對所有使用者都能良好運作。
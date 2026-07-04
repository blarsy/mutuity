# Contract: State Management & Data Flow

**Feature**: Mutuity Mobile Rewrite  
**Date**: 2026-07-03

## Overview

State management combines Apollo Client (GraphQL cache) for remote data, React Context for auth/session, and React Hooks for local UI state. This contract defines the patterns and expectations.

In addition to visible screen state, the mobile rewrite must preserve operational continuity state from Tope-là 1.0:
- session bootstrap and safe invalid-token recovery
- push permission and push-token synchronization
- unread notification continuity and notification-driven routing intents
- remote logging/diagnostics correlation context
- minimum supported app version gate
- support-report diagnostic snapshot generation

---

## Architecture

```
┌─────────────────────────────────────────────┐
│ React Components                            │
│ (Screens, Containers, UI Components)        │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┼──────────┐
         ↓         ↓          ↓
     Apollo     Context    Hooks
     Client      API       (useForm, etc)
         │         │          │
         └─────────┼──────────┘
                   ↓
    ┌─────────────────────────────────┐
    │ GraphQL API (Mutuity Backend)  │
    └─────────────────────────────────┘
```

---

## 1. Apollo Client Cache (Remote Data)

### Setup

```typescript
// src/services/graphql/client.ts

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { getToken } from './auth';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      console.error(`[GraphQL error]: ${message}`, extensions);
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const authLink = new ApolloLink(async (operation, forward) => {
  const token = await getToken();
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : ''
    }
  });
  return forward(operation);
});

const httpLink = new HttpLink({
  uri: process.env.EXPO_PUBLIC_GRAPHQL_URL,
  credentials: 'include'
});

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network'
    },
    query: {
      fetchPolicy: 'cache-and-network'
    }
  }
});
```

### Cache Patterns

#### Normalized Cache

Apollo Client automatically normalizes response data into a single cache, keyed by `__typename` and `id`:

```
Cache:
  Resource:1 → { id: 1, title: "...", creatorAccountId: "123" }
  Resource:2 → { id: 2, title: "...", creatorAccountId: "123" }
  Account:123 → { id: 123, displayName: "Alice" }
  
Query: SearchResources → [Resource:1, Resource:2]
```

When a mutation updates a resource, the cache automatically updates all places that resource appears (search results, detail screen, etc.).

#### Fetch Policies

Different operations use different policies:

- **`cache-and-network`** (default): Check cache first; then fetch from network (user sees fast cached data, then refreshed data).
- **`network-only`**: Always fetch from network; bypass cache. Used after mutations.
- **`cache-only`**: Never fetch from network; throw error if not cached. Used in offline scenarios.
- **`no-cache`**: Fetch from network and skip cache entirely. Used for one-off operations.

#### Update Strategy After Mutations

After a mutation succeeds, update the cache immediately:

```typescript
const [createNeed] = useMutation(CREATE_NEED_MUTATION, {
  update(cache, { data }) {
    const newNeed = data.createNeed.need;
    
    // Update "My Needs" list in cache
    cache.modify({
      fields: {
        allNeeds(existingNeeds = []) {
          const newNeedRef = cache.writeFragment({
            data: newNeed,
            fragment: gql`fragment NewNeed on Need { id title }`
          });
          return [newNeedRef, ...existingNeeds];
        }
      }
    });
  }
});
```

Or use `refetchQueries` (simpler, less efficient):

```typescript
const [createNeed] = useMutation(CREATE_NEED_MUTATION, {
  refetchQueries: [{ query: MY_NEEDS_QUERY }]
});
```

---

## 2. Authentication Context (Session State)

### AuthContext

```typescript
// src/services/auth/AuthContext.tsx

import React, { createContext, useReducer, useEffect } from 'react';

export interface Session {
  authenticated: boolean;
  account?: Account;
  token?: string;
}

export const AuthContext = createContext<{
  session: Session;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }) {
  const [session, dispatch] = useReducer(authReducer, initialSession);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'anonymous'>('loading');

  // On app launch, check if token exists in SecureStore
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await getToken();
        if (token) {
          dispatch({ type: 'LOGIN', payload: { token } });
          setStatus('authenticated');
        } else {
          setStatus('anonymous');
        }
      } catch (e) {
        console.error('Auth bootstrap error', e);
        setStatus('anonymous');
      }
    };
    bootstrap();
  }, []);

  const login = async (token: string) => {
    await setToken(token);
    dispatch({ type: 'LOGIN', payload: { token } });
    setStatus('authenticated');
  };

  const logout = async () => {
    await clearToken();
    dispatch({ type: 'LOGOUT' });
    setStatus('anonymous');
  };

  return (
    <AuthContext.Provider value={{ session, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        authenticated: true,
        token: action.payload.token
      };
    case 'LOGOUT':
      return { authenticated: false, token: null };
    default:
      return state;
  }
}
```

### Usage

```typescript
import { useAuth } from '../services/auth/useAuth';

export function ProfileScreen() {
  const { session, logout } = useAuth();

  return (
    <View>
      <Text>Logged in as {session.account?.displayName}</Text>
      <Button title="Logout" onPress={() => logout()} />
    </View>
  );
}
```

### Required Session Behaviors

- Bootstrap from secure storage before authenticated navigation renders.
- On token invalid or expired responses, clear the stored token and return to a safe signed-out state.
- Keep account identity and unread state available to notification/chat continuity code.

---

## 2a. Operational Continuity State

The app-level context or cooperating services must also track:

- `activityId`: correlation id used by logging and support diagnostics
- `minimumSupportedVersionStatus`: `checking | supported | updateRequired | failed`
- `pushPermissionStatus` and most recent synchronized push token
- pending notification deep-link destination, if app was opened from a notification
- notification preference snapshot for realtime vs summary delivery

This state does not need to be rendered directly on every screen, but it must be initialized and updated predictably from the shared foundation layer.

---

## 3. Apollo Client Hooks (Remote Data Queries)

### useQuery

```typescript
import { useQuery } from '@apollo/client';
import { SEARCH_NEEDS_QUERY } from '../services/graphql/queries';

export function NeedsScreen() {
  const [filters, setFilters] = useState({ location: '', distance: 10 });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    SEARCH_NEEDS_QUERY,
    {
      variables: { location: filters.location, distance: filters.distance },
      fetchPolicy: 'cache-and-network'
    }
  );

  if (loading && !data) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={() => refetch()} />;
  }

  const needs = data?.allNeeds?.nodes ?? [];

  return (
    <FlatList
      data={needs}
      renderItem={({ item }) => <NeedCard need={item} />}
      onEndReached={() => {
        const { pageInfo, nodes } = data.allNeeds;
        if (pageInfo.hasNextPage) {
          fetchMore({
            variables: { after: pageInfo.endCursor }
          });
        }
      }}
      refreshing={loading}
      onRefresh={() => refetch()}
    />
  );
}
```

### useMutation

```typescript
import { useMutation } from '@apollo/client';
import { CREATE_NEED_MUTATION } from '../services/graphql/mutations';

export function CreateNeedScreen() {
  const [createNeed, { loading, error }] = useMutation(CREATE_NEED_MUTATION);

  const handleSubmit = async (formData) => {
    try {
      const result = await createNeed({
        variables: { input: formData },
        refetchQueries: [{ query: MY_NEEDS_QUERY }]
      });
      // Success: navigate back or show toast
      navigation.goBack();
    } catch (err) {
      // Error handled by useMutation; display in UI
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button title="Create" disabled={loading} loading={loading} />
      {error && <ErrorAlert error={error} />}
    </Form>
  );
}
```

---

## 4. Local UI State (React Hooks)

### useState

```typescript
export function FilteredSearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [distanceFilter, setDistanceFilter] = useState(10);

  // GraphQL query uses these filters
  const { data } = useQuery(SEARCH_RESOURCES_QUERY, {
    variables: {
      query: searchText,
      categoryLabels: categoryFilter,
      distance: distanceFilter
    }
  });

  return (
    <View>
      <TextInput
        placeholder="Search..."
        value={searchText}
        onChangeText={setSearchText}
      />
      <Slider
        value={distanceFilter}
        onValueChange={setDistanceFilter}
      />
      {/* Results */}
    </View>
  );
}
```

### Custom Hooks

```typescript
// src/hooks/useForm.ts
export function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setValues(v => ({ ...v, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  };
}

// Usage
export function CreateResourceScreen() {
  const form = useForm(
    { title: '', description: '' },
    async (values) => {
      await createResource({ variables: { input: values } });
    }
  );

  return (
    <Form onSubmit={form.handleSubmit}>
      <TextField
        value={form.values.title}
        onChangeText={(text) => form.handleChange('title', text)}
        onBlur={() => form.handleBlur('title')}
        error={form.touched.title && form.errors.title}
      />
      {/* More fields */}
      <Button title="Create" disabled={form.isSubmitting} />
    </Form>
  );
}
```

---

## 5. Offline Support

### Network Status Detection

```typescript
// src/services/offline/useNetworkStatus.ts
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}

// Usage
export function ChatDetailScreen() {
  const isOnline = useNetworkStatus();

  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION, {
    optimisticResponse: {
      sendMessage: {
        __typename: 'ChatMessage',
        id: `temp-${Date.now()}`,
        body: messageText,
        createdAt: new Date().toISOString()
      }
    }
  });

  const handleSend = async () => {
    await sendMessage({ variables: { body: messageText } });
    // If offline, Apollo Client queues the mutation and retries on reconnect
  };

  return (
    <View>
      {!isOnline && <OfflineIndicator />}
      {/* Chat messages */}
      <SendMessageInput onSend={handleSend} disabled={/* readonly when offline */} />
    </View>
  );
}
```

### Optimistic Updates

Apollo Client supports optimistic responses, allowing UI to update immediately while the network request is in flight:

```typescript
const [claimNeed] = useMutation(CLAIM_NEED_MUTATION, {
  optimisticResponse: {
    claimNeed: {
      __typename: 'NeedClaim',
      id: generateTempId(),
      needId: needId,
      accountId: currentAccountId,
      claimedAt: new Date().toISOString()
    }
  }
});

// UI shows "Claimed" immediately; if mutation fails, Apollo reverts the optimistic response
```

---

## 6. Language/Localization State

### i18n Context

```typescript
// src/services/i18n/I18nContext.tsx
import i18n from 'i18next';

export function I18nProvider({ children }) {
  const { t, i18n: i18nInstance } = useTranslation();
  const { locale } = useAuth();

  useEffect(() => {
    i18nInstance.changeLanguage(locale);
  }, [locale]);

  return <>{children}</>;
}

// Usage
export function ProfileScreen() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
    // Optionally: update user preference on backend
  };

  return (
    <View>
      <Text>{t('profile.changeLanguage')}</Text>
      <Button title={i18n.language === 'en' ? 'Français' : 'English'} onPress={toggleLanguage} />
    </View>
  );
}
```

---

## 7. Putting It All Together

### Typical Data Flow (User Creates a Need)

```
1. User enters form data in CreateNeedScreen
   ↓
2. handleSubmit called (local state)
   ↓
3. useMutation(CREATE_NEED_MUTATION) executes
   ↓
4. Apollo Client sends GraphQL mutation to backend
   ↓
5. Optimistic response updates cache immediately (UI shows new need)
   ↓
6. Backend responds with actual data
   ↓
7. Cache updated with real data
   ↓
8. refetchQueries triggered (MY_NEEDS_QUERY re-fetched)
   ↓
9. Navigation.goBack() called
   ↓
10. NeedsScreen re-renders with updated list (from cache)
```

### Typical Data Flow (User Views a Resource)

```
1. User taps Search tab
   ↓
2. useQuery(SEARCH_RESOURCES_QUERY) with fetchPolicy: cache-and-network
   ↓
3. Apollo checks cache first
   ↓
4. If cached: render immediately
   ↓
5. Simultaneously: fetch from network
   ↓
6. Network response updates cache
   ↓
7. Component re-renders with fresh data
```

---

## Summary Table

| Concern | Solution | Pattern |
|---------|----------|---------|
| Remote data (queries) | Apollo Client + useQuery | fetch via GraphQL, cache automatically |
| Remote mutations | Apollo Client + useMutation | optimistic updates, then confirm |
| Auth state | AuthContext | session + token in SecureStore |
| UI filters/search | useState | local state, pass to useQuery variables |
| Forms | useForm hook or Formik | manage values, errors, submission |
| Network status | NetInfo + useNetworkStatus | detect offline, show indicator |
| Offline mutations | Apollo offline link | queue mutations, retry on reconnect |
| Localization | i18next + I18nContext | switch language, trigger refetch |
| Cache refresh | refetch() or fetchMore() | re-fetch query after mutation |

---

## Testing State Management

- **Unit**: Test hooks in isolation (e.g., `useNetworkStatus` with mocked NetInfo).
- **Integration**: Test component + Apollo with mocked GraphQL responses.
- **E2E**: Test full user flows (login → create need → see in list).

---

## Next Steps

See `quickstart.md` for development setup and testing instructions.

import * as React from 'react';

declare module 'react' {
  export const ViewTransition: React.ComponentType<{
    children?: React.ReactNode;
    name?: string;
    enter?: string | Record<string, string>;
    exit?: string | Record<string, string>;
    share?: string | Record<string, string>;
    default?: string;
  }>;
}

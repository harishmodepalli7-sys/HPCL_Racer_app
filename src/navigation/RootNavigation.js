import * as React from 'react';

export const navigationRef = React.createRef();

export function resetToLogin() {
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
}



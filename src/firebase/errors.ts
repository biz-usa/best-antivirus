export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
  message?: string;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const defaultMessage = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      {
        auth: {
          uid: '(unavailable)', // In a real app, you'd get this from the auth state
          token: '(unavailable)',
        },
        method: context.operation,
        path: `/databases/(default)/documents/${context.path}`,
        request: {
          resource: {
            data: context.requestResourceData,
          },
        },
      },
      null,
      2
    )}`;

    super(context.message || defaultMessage);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to ensure the stack trace is captured correctly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}

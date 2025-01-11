export function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}

export function handleError(message: string, error: any) {
  console.error('Error:', {
    message,
    error,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  if (typeof penpot !== 'undefined') {
    penpot.ui.sendMessage({
      type: 'ERROR',
      data: {
        message: message,
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
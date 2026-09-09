const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadCustomRequestFiles(
  requestId: string,
  files: File[],
): Promise<{
  success: boolean;
  files?: Array<{
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    storageKey: string;
  }>;
  message?: string;
}> {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const res = await fetch(`${API_URL}/custom-requests/${requestId}/files`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: formData,
    });

    const data = await res.json();

    if (res.ok && data.success) {
      return { success: true, files: data.data ?? [] };
    }

    return {
      success: false,
      message: data.message || 'Failed to upload files',
    };
  } catch (error) {
    console.error('Failed to upload custom request files:', error);
    return { success: false, message: 'Failed to upload files' };
  }
}

export async function sendCustomMessageWithAttachments(
  requestId: string,
  message: string,
  attachments: string[] = [],
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/custom-requests/${requestId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        message,
        attachments,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      return { success: true };
    }

    return {
      success: false,
      message: data.message || 'Failed to send message',
    };
  } catch (error) {
    console.error('Failed to send custom message:', error);
    return { success: false, message: 'Failed to send message' };
  }
}

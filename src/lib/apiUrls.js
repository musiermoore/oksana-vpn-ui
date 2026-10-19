const authPaths = new Set(['auth/me', 'auth/telegram', 'auth/login']);

export const apiBaseUrlForPath = (path, baseUrl, authUrl) => {
    const normalizedPath = String(path).replace(/^\/+/, '');
    return authPaths.has(normalizedPath) ? authUrl : baseUrl;
};

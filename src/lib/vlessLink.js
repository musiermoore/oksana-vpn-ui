export const VLESS_LINK_API_PATH = 'vless/link';

export const buildVlessLinkApiUrl = (apiBaseUrl, apiPath = VLESS_LINK_API_PATH) => {
    const baseUrl = String(apiBaseUrl).replace(/\/+$/, '');
    const normalizedPath = String(apiPath).replace(/^\/+|\/+$/g, '');

    return `${baseUrl}/${normalizedPath}`;
};

export const normalizeVlessLinkResponse = (data) => ({
    happ_deep_link: data?.happ_deep_link ?? '',
    incy_deep_link: data?.incy_deep_link ?? '',
    v2raytun_deep_link: data?.v2raytun_deep_link ?? '',
    show_raw_link: data?.show_raw_link === true,
});

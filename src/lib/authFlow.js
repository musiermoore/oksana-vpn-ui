export const authenticateTelegramWithProvisioning = async (post, authUrl, provisioningUrl, initData) => {
    const payload = { init_data: initData };

    try {
        return await post(authUrl, payload);
    } catch (error) {
        if (error?.response?.status !== 401 || error?.response?.data?.error !== 'User not found') {
            throw error;
        }

        await post(provisioningUrl, payload);
        return await post(authUrl, payload);
    }
};

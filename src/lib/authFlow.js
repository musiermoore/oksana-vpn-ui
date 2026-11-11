export const authenticateTelegram = (post, authUrl, initData) => {
    return post(authUrl, { init_data: initData });
};

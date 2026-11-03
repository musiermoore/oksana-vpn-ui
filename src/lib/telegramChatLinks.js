const newsAndChatLinks = [
    {
        title: 'Новости',
        description: 'Канал с обновлениями, анонсами и важными сообщениями сервиса.',
        url: 'https://t.me/+DfexxpJzKiFkNzQ6',
    },
    {
        title: 'Чат',
        description: 'Флуд, вопросы и общение с другими пользователями.',
        url: 'https://t.me/+jG8T4yBk0tg4MWNi',
    },
];

const botLink = {
    title: 'Бот',
    description: 'Откройте бота для управления подпиской и получения помощи.',
    url: 'https://t.me/OksanaVpnBot',
};

const websiteLink = {
    title: 'Сайт',
    description: 'Откройте сайт OksanaVPN.',
    url: 'https://public.oksana1984.ru/',
};

export const telegramCommunityLinks = (isTelegramMiniApp) => [
    ...newsAndChatLinks,
    isTelegramMiniApp ? websiteLink : botLink,
];

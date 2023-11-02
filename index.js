require('dotenv').config();
const { Bot, Keyboard, InlineKeyboard, GrammyError, HttpError } = require('grammy');



const bot = new Bot(process.env.BOT_API_KEY);


bot.command('start', async (ctx) => {
    const startKeyboard = new Keyboard()
        .text('JavaScript')
        .text('HTML')
        .row()
        .text('CSS')
        .text('React')
        // .text('General Issues')
        .resized();
    await ctx.reply('Привет, это бот для подготовки к собеседованию! \n Не передумал ?');
    await ctx.reply('С чего начнём? \n Выбери тему вопроса в менню 👇 ', {
        reply_markup: startKeyboard
    })
});

bot.hears(['JavaScript', 'CSS', 'React', 'General Issues'], async (ctx) => {
    const inlineKeyboard = new InlineKeyboard().text('Получить ответ', JSON.stringify({
        type: ctx.message.text,
        questionId:1
    })).text('Отменить', 'cancel')
    ctx.reply(`Что такое ${ctx.message.text}?`, {
        reply_markup: inlineKeyboard
    })
});

bot.on('callback_query:data', async (ctx) => {
    if (ctx.callbackQuery.data === 'cancel') {
        await ctx.reply('Отменено');
        await ctx.answerCallbackQuery();
        return;
    };
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    await ctx.reply(`${callbackData.type} - составляющая фронтенда.`);
    await ctx.answerCallbackQuery();
})

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Ошибка во время обработки обновления: ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Ошибка в запросе:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Не удалось связаться с Telegram:", e);
    } else {
        console.error("Неизвестная ошибка:", e);
    }
});

bot.start();
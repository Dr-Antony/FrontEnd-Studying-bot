require('dotenv').config();
const { Bot, Keyboard, InlineKeyboard, GrammyError, HttpError } = require('grammy');
const bot = new Bot(process.env.BOT_API_KEY);
const { getRandomQuestion, getCorrectAnswer } = require('./utils.js')

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






bot.hears(['JavaScript', 'CSS', 'React', 'HTML'], async (ctx) => {
    const topic = ctx.message.text.toLowerCase();
    const question = getRandomQuestion(topic);
    let inlineKeyboard;
    if (question.hasOptions) {
        const buttonRows = question.options.map((option) => {
            return [InlineKeyboard.text(option.text, JSON.stringify({
                type: `${topic}-option`,
                isCorrect: option.isCorrect,
                questionId: question.id
            }))]
        });
        inlineKeyboard = InlineKeyboard.from(buttonRows);
    } else {
        inlineKeyboard = new InlineKeyboard().text('Узнать ответ', JSON.stringify({
            type: topic,
            questionId: question.id
        }));
    }


    ctx.reply(question.text, {
        reply_markup: inlineKeyboard
    })
});







bot.on('callback_query:data', async (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    if (!callbackData.type.includes('option')) {
        const answer = getCorrectAnswer(callbackData.type, callbackData.questionId)
        await ctx.reply(answer, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
        await ctx.answerCallbackQuery();
        return;
    };
    if (callbackData.isCorrect) {
        await ctx.reply('Ответ верный ✅');
        await ctx.answerCallbackQuery();
        return;
    }
    const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.questionId);
    await ctx.reply(`Ответ неверный ❌, правильный ответ: ${answer}`);
    await ctx.answerCallbackQuery();
});







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
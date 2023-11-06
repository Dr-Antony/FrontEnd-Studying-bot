require('dotenv').config();
const { Bot, session, Keyboard, InlineKeyboard, GrammyError, HttpError } = require('grammy');
const { freeStorage } = require("@grammyjs/storage-free");
const { Random } = require('random-js');


const bot = new Bot(process.env.BOT_API_KEY);
const { getRandomQuestion, getCorrectAnswer } = require('./utils.js')

const random = new Random();
const questions = require('./questions.json');




const adminId = 569441073;





bot.use(session({
    initial: () => ({
        totalQuestionsCount: 0,
        correctAnswer: 0,
        incorrectAnswer: 0,

    }),
    storage: freeStorage(bot.token),
}));

const removeSessionData = ()=>{
    ctx.session = {
        totalQuestionsCount: 0,
        correctAnswer: 0,
        incorrectAnswer: 0,
    }
}









bot.command('start', async (ctx) => {
    console.log(ctx.message)
    if (ctx.message.from.id === adminId) {
        await ctx.reply('Вы администратор. Замечательно. Какие будут указания ?');
    }
    const startKeyboard = new Keyboard()
        .text('JavaScript')
        .text('HTML')
        .row()
        .text('CSS')
        .text('React')
        .row()
        .text('Random question')
        .row()
        .text('Мои ответы')
        .resized();
    await ctx.reply('Привет, это бот для подготовки к собеседованию!');
    await ctx.reply('С чего начнём? \n Выбери тему вопроса в менню 👇 ', {
        reply_markup: startKeyboard
    })
});




///////////////////////////////////////////ОБРАБОТКА ВОПРОСОВ И ОТВЕТОВ////////////////////////////////////////////////////////

bot.hears(['JavaScript', 'CSS', 'React', 'HTML', 'Random question'], async (ctx) => {
    let topic = ctx.message.text.toLowerCase();
    if (topic === 'random question') {
        const various = Object.keys(questions);
        const randomTopic = various[random.integer(0, various.length - 1)];
        topic = randomTopic;
    };


    const question = getRandomQuestion(topic);
    let inlineKeyboard;
    if (question.hasOptions) {
        ctx.session.totalQuestionsCount++
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


    await ctx.reply(question.text, {
        reply_markup: inlineKeyboard
    })
});







bot.on('callback_query:data', async (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    console.log(callbackData);

    if (callbackData.removeSession) {
        await ctx.reply('Ваши ответы удалены!')
        await ctx.answerCallbackQuery();
    }




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
        ctx.session.correctAnswer++
        await ctx.reply('Ответ верный ✅');
        await ctx.answerCallbackQuery();
        return;
    }

    const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.questionId);
    ctx.session.incorrectAnswer++
    await ctx.reply(`Ответ неверный ❌, правильный ответ: ${answer}`);
    await ctx.answerCallbackQuery();
});


///////////////////////////////////////////.............................////////////////////////////////////////////////////////




bot.hears('Мои ответы', async (ctx) => {

    const { totalQuestionsCount, correctAnswer, incorrectAnswer } = ctx.session

    const response = `Общее количество пройденных тестовых вопросов: ${totalQuestionsCount};
                    Количество правильных ответов: ${correctAnswer}
                    Количество неверных ответов: ${incorrectAnswer}
                    Процент верных ответов: ${correctAnswer / totalQuestionsCount * 100}%
                    `;

                    const inlineKeyboard = new InlineKeyboard().text('Удалить данные моих ответов', JSON.stringify({
                        removeSession:true
                    }))
                    await ctx.reply(response, {
                        reply_markup: inlineKeyboard
                    })
})

// bot.on('callback_query:data', async (ctx) => {
//     const callbackData = JSON.parse(ctx.callbackQuery.data);
//     console.log(callbackData)
//     if (callbackData.removeSession) {
//         ctx.session.totalQuestionsCount = 0;
//         ctx.session.correctAnswer = 0;
//         ctx.session.incorrectAnswer = 0;
//         await ctx.reply('Ваши ответы удалены!')
//         await ctx.answerCallbackQuery();
//     }
// });
















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